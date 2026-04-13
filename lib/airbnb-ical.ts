import type { Booking, Lodge } from "@/lib/types";

export interface AirbnbICalEvent {
  uid: string;
  confirmationCode: string;
  dtstart: string;
  dtend: string;
  guestName: string;
  summary: string;
  description: string;
}

export interface AirbnbSyncConfig {
  icalUrl: string;
  lodge: Lodge;
  defaultGuestsCount?: number;
}

function parseICalDate(raw: string): string {
  const clean = raw.replace(/[^0-9]/g, "").substring(0, 8);
  if (clean.length !== 8) return "";
  return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`;
}

function extractGuestName(description: string, summary: string): string {
  const m1 = description.match(/Your guest (.+?) is confirmed/i);
  if (m1) return m1[1].trim();
  const m2 = description.match(/Reservation by (.+?)(?:\\n|\n|$)/i);
  if (m2) return m2[1].trim();
  if (/not available|blocked|closed|unavailable/i.test(summary)) return "";
  return summary === "Reserved" ? "Ospite Airbnb" : (summary || "Ospite Airbnb");
}

function extractConfirmationCode(uid: string, description: string): string {
  const uidCode = uid.split("@")[0];
  if (uidCode && uidCode.length > 4) return uidCode;
  const m = description.match(/Airbnb\s*\(([A-Z0-9]+)\)/i);
  if (m) return m[1];
  return uid;
}

export function parseAirbnbICal(icsContent: string): AirbnbICalEvent[] {
  const unfolded = icsContent.replace(/\r\n[ \t]/g, "").replace(/\r\n/g, "\n");
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
  const events: AirbnbICalEvent[] = [];

  for (const block of blocks) {
    const get = (key: string) => {
      const m = block.match(new RegExp(`^${key}[^:]*:(.*)$`, "m"));
      return m ? m[1].trim().replace(/\\n/g, "\n").replace(/\\,/g, ",") : "";
    };
    const uid = get("UID");
    const summary = get("SUMMARY");
    const description = get("DESCRIPTION");
    const dtstart = parseICalDate(get("DTSTART"));
    const dtend = parseICalDate(get("DTEND"));
    const status = get("STATUS");

    if (!dtstart || !dtend) continue;
    if (status === "CANCELLED") continue;
    if (/not available|blocked|closed|unavailable/i.test(summary)) continue;

    const confirmationCode = extractConfirmationCode(uid, description);
    const guestName = extractGuestName(description, summary);
    if (!guestName) continue;

    events.push({ uid, confirmationCode, dtstart, dtend, guestName, summary, description });
  }
  return events;
}

/** ID senza prefisso — compatibile con le prenotazioni Airbnb inserite manualmente */
export function airbnbBookingId(confirmationCode: string): string {
  return confirmationCode;
}

export function icalEventToBooking(
  event: AirbnbICalEvent,
  lodge: Lodge,
  defaultGuestsCount = 2
): Booking {
  const now = new Date().toISOString();
  return {
    id: airbnbBookingId(event.confirmationCode),
    guestName: event.guestName,
    lodge,
    checkIn: event.dtstart,
    checkOut: event.dtend,
    status: "confirmed",
    channel: "airbnb",
    notes: `Prenotazione Airbnb — Codice: ${event.confirmationCode}\n\n⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall'ospite.`,
    guestsCount: defaultGuestsCount,
    totalAmount: 0,
    depositAmount: 0,
    depositReceived: false,
    isNew: false,
    createdAt: now,
    updatedAt: now,
    dataOrigin: "sync",
    guestProfile: {},
  };
}
