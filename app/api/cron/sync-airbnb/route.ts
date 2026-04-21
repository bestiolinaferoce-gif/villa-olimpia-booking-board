import { NextRequest, NextResponse } from "next/server";
import type { Booking, Lodge } from "@/lib/types";
import {
  parseAirbnbICal,
  icalEventToBooking,
  airbnbBookingId,
  type AirbnbSyncConfig,
} from "@/lib/airbnb-ical";
import { getBookingApiWriteSecret } from "@/lib/bookingsApiAuth";

const BASE  = process.env.KV_REST_API_URL   ?? "";
const TOKEN = process.env.KV_REST_API_TOKEN ?? "";
const KEY   = "vob_bookings";

function getSyncConfigs(): AirbnbSyncConfig[] {
  const mappings: Array<{ envKey: string; lodge: Lodge; defaultGuests: number }> = [
    { envKey: "AIRBNB_ICAL_FRANGIPANE", lodge: "Frangipane", defaultGuests: 4 },
    { envKey: "AIRBNB_ICAL_GERANIO",    lodge: "Geranio",    defaultGuests: 4 },
    { envKey: "AIRBNB_ICAL_GIGLIO",     lodge: "Giglio",     defaultGuests: 6 },
    { envKey: "AIRBNB_ICAL_LAVANDA",    lodge: "Lavanda",    defaultGuests: 4 },
    { envKey: "AIRBNB_ICAL_FIORDALISO", lodge: "Fiordaliso", defaultGuests: 4 },
    { envKey: "AIRBNB_ICAL_TULIPANO",   lodge: "Tulipano",   defaultGuests: 4 },
    { envKey: "AIRBNB_ICAL_ORCHIDEA",   lodge: "Orchidea",   defaultGuests: 4 },
    { envKey: "AIRBNB_ICAL_GARDENIA",   lodge: "Gardenia",   defaultGuests: 4 },
    { envKey: "AIRBNB_ICAL_AZALEA",     lodge: "Azalea",     defaultGuests: 4 },
  ];
  return mappings
    .filter(({ envKey }) => !!process.env[envKey])
    .map(({ envKey, lodge, defaultGuests }) => ({
      icalUrl: process.env[envKey]!,
      lodge,
      defaultGuestsCount: defaultGuests,
    }));
}

async function readAllBookings(): Promise<Booking[]> {
  if (!BASE || !TOKEN) return [];
  try {
    const res = await fetch(`${BASE}/get/${KEY}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
    });
    const json = (await res.json()) as { result: string | null };
    if (!json.result) return [];
    const parsed = JSON.parse(json.result);
    return Array.isArray(parsed) ? parsed : (parsed?.data ?? []);
  } catch { return []; }
}

interface SyncResult {
  lodge: Lodge;
  fetched: number;
  created: number;
  updated: number;
  cancelled: number;
  skipped: number;
  error?: string;
}

async function syncProperty(
  config: AirbnbSyncConfig,
  existing: Booking[]
): Promise<{ bookings: Booking[]; result: SyncResult }> {
  const result: SyncResult = { lodge: config.lodge, fetched: 0, created: 0, updated: 0, cancelled: 0, skipped: 0 };

  let icsText: string;
  try {
    const resp = await fetch(config.icalUrl, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    icsText = await resp.text();
  } catch (err) {
    return { bookings: existing, result: { ...result, error: String(err) } };
  }

  const events = parseAirbnbICal(icsText);
  result.fetched = events.length;
  const updated = [...existing];
  const now = new Date().toISOString();

  // Fields that sync must NEVER overwrite once an operator has set them manually:
  // notes, guestsCount, totalAmount, depositAmount, depositReceived,
  // guestProfile, extrasAmount, cleaningFee, touristTax, economicNotes, childrenCount.
  // guestName is overwritten only if it is still the Airbnb placeholder (operator has not corrected it).
  const AIRBNB_PLACEHOLDER_NAME = "Ospite Airbnb";

  for (const event of events) {
    const id  = airbnbBookingId(event.confirmationCode);
    const idx = updated.findIndex((b) => b.id === id);

    if (idx === -1) {
      updated.push(icalEventToBooking(event, config.lodge, config.defaultGuestsCount));
      result.created++;
    } else {
      const b = updated[idx];
      // Only update guestName from feed if operator has not corrected it yet.
      const canUpdateGuestName = b.guestName === AIRBNB_PLACEHOLDER_NAME || b.guestName === event.guestName;
      const datesChanged = b.checkIn !== event.dtstart || b.checkOut !== event.dtend;
      const nameChanged  = canUpdateGuestName && b.guestName !== event.guestName;
      const wasReactivated = b.status === "cancelled";
      if (datesChanged || nameChanged || wasReactivated) {
        updated[idx] = {
          ...b,                        // preserves all manual fields
          checkIn: event.dtstart,
          checkOut: event.dtend,
          ...(canUpdateGuestName ? { guestName: event.guestName } : {}),
          status: "confirmed",
          isNew: false,
          updatedAt: now,
          dataOrigin: "sync",
        };
        result.updated++;
      } else {
        result.skipped++;
      }
    }
  }

  // Auto-cancella SOLO prenotazioni create dal sync non piu' presenti nel feed
  const syncedIds = new Set(events.map((e) => airbnbBookingId(e.confirmationCode)));
  for (let i = 0; i < updated.length; i++) {
    const b = updated[i];
    if (
      b.lodge === config.lodge &&
      b.channel === "airbnb" &&
      b.dataOrigin === "sync" &&
      b.status !== "cancelled" &&
      !syncedIds.has(b.id)
    ) {
      updated[i] = { ...b, status: "cancelled", updatedAt: now };
      result.cancelled++;
    }
  }

  return { bookings: updated, result };
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const auth = req.headers.get("authorization");
  const qs   = req.nextUrl.searchParams.get("secret");
  if (cronSecret && auth !== `Bearer ${cronSecret}` && qs !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = getSyncConfigs();
  if (configs.length === 0) {
    return NextResponse.json({ ok: false, message: "Nessuna variabile AIRBNB_ICAL_* trovata." });
  }

  let bookings = await readAllBookings();
  const results: SyncResult[] = [];

  for (const config of configs) {
    const { bookings: merged, result } = await syncProperty(config, bookings);
    bookings = merged;
    results.push(result);
  }

  const totalChanges = results.reduce((s, r) => s + r.created + r.updated + r.cancelled, 0);

  const summary = results
    .map((r) => {
      if (r.error) return `${r.lodge}: ERROR(${r.error})`;
      const parts: string[] = [];
      if (r.created)   parts.push(`+${r.created} creati`);
      if (r.updated)   parts.push(`~${r.updated} aggiornati`);
      if (r.cancelled) parts.push(`✗${r.cancelled} cancellati`);
      if (r.skipped)   parts.push(`=${r.skipped} invariati`);
      return `${r.lodge}: ${parts.length ? parts.join(", ") : "nessuna modifica"}`;
    })
    .join(" | ");

  if (totalChanges > 0) {
    const url = new URL("/api/bookings", req.url).toString();
    const writeToken = getBookingApiWriteSecret();
    const writeRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(writeToken ? { "x-internal-token": writeToken } : {}),
      },
      body: JSON.stringify(bookings),
    });

    if (!writeRes.ok) {
      let writeResponse: unknown;
      try {
        writeResponse = await writeRes.json();
      } catch {
        writeResponse = await writeRes.text().catch(() => "(unreadable)");
      }
      return NextResponse.json(
        {
          ok: false,
          syncedAt: new Date().toISOString(),
          totalChanges,
          summary,
          results,
          write_failed: true,
          write_status: writeRes.status,
          write_response: writeResponse,
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ ok: true, syncedAt: new Date().toISOString(), totalChanges, summary, results });
}
