import { NextRequest, NextResponse } from "next/server";
import { bookingWriteAuthError } from "@/lib/bookingsApiAuth";
import type { Booking } from "@/lib/types";
import { reconcileBookings } from "@/lib/reconciliation";
import { analyzeBoard } from "@/lib/boardInsights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = process.env.KV_REST_API_URL ?? "";
const TOKEN = process.env.KV_REST_API_TOKEN ?? "";
const KEY = "vob_bookings";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

type ChatMessage = { role: "user" | "assistant"; content: string };

async function readBookings(): Promise<Booking[]> {
  if (!BASE || !TOKEN) return [];
  try {
    const res = await fetch(`${BASE}/get/${KEY}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
    });
    const json = (await res.json()) as { result: string | null };
    if (!json.result) return [];
    const parsed = JSON.parse(json.result);
    const rows: Booking[] = Array.isArray(parsed) ? parsed : parsed?.data ?? [];
    const deleted = new Set<string>(Array.isArray(parsed?.deletedIds) ? parsed.deletedIds : []);
    return rows.filter((b) => !deleted.has(b.id));
  } catch {
    return [];
  }
}

function eur(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );
}

/** Contesto compatto della board per il modello (situazione + prenotazioni rilevanti). */
function buildBoardContext(bookings: Booking[]): string {
  const { bookings: canonical, conflicts } = reconcileBookings(bookings);
  const analysis = analyzeBoard(canonical, conflicts, new Date());

  const issues = analysis.insights
    .filter((i) => i.severity === "critical" || i.severity === "warning")
    .map((i) => `- [${i.severity}] ${i.title}: ${i.detail}`)
    .join("\n");

  // Prenotazioni attive compatte (campi essenziali), ordinate per check-in.
  const active = canonical
    .filter((b) => b.status !== "cancelled")
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .map((b) => {
      const saldo = Math.max(0, (b.totalAmount || 0) - (b.depositReceived ? b.depositAmount || 0 : 0));
      return [
        b.lodge,
        b.guestName,
        `${b.checkIn}→${b.checkOut}`,
        b.status,
        b.channel,
        `tot ${eur(b.totalAmount || 0)}`,
        b.depositReceived ? "caparra:OK" : `caparra:${eur(b.depositAmount || 0)} DA INCASSARE`,
        saldo > 0 ? `saldo ${eur(saldo)}` : "saldato",
        b.id,
      ].join(" | ");
    })
    .join("\n");

  return [
    `SITUAZIONE ECONOMICA:`,
    `- Prenotazioni confermate attive: ${analysis.economics.activeCount}`,
    `- Valore confermato (tutte le date): ${eur(analysis.economics.confirmedRevenue)}`,
    `- Caparre incassate: ${eur(analysis.economics.depositsReceived)}`,
    `- Saldo ancora da incassare: ${eur(analysis.economics.outstanding)}`,
    ``,
    `PROBLEMI / AZIONI RILEVATE (${analysis.actionsCount}):`,
    issues || "- nessuna azione urgente",
    ``,
    `PRENOTAZIONI ATTIVE (lodge | ospite | date | stato | canale | totale | caparra | saldo | id):`,
    active || "- nessuna",
  ].join("\n");
}

const SYSTEM_PROMPT = `Sei l'assistente operativo della booking board di Villa Olimpia, struttura ricettiva a Capo Piccolo (Isola di Capo Rizzuto, Calabria) con 9 lodge: Frangipane, Fiordaliso, Giglio, Tulipano, Orchidea, Lavanda, Geranio, Gardenia, Azalea.

Il tuo compito è aiutare il gestore (Francesco) a risolvere i problemi della board: conflitti/sovrapposizioni, caparre da incassare, opzioni in scadenza, adempimenti Alloggiati/ROSS1000, check-in/out imminenti, e dare riepiloghi economici.

REGOLE:
- Rispondi in italiano, in modo conciso, pratico e orientato all'azione. Niente teoria inutile.
- Usa SOLO i dati reali forniti nel contesto board qui sotto. Non inventare prenotazioni, importi o ospiti. Se un dato manca, dillo.
- Quando indichi una prenotazione, cita lodge, ospite e date così Francesco la trova subito. Se utile, riporta anche l'id tra parentesi.
- Per i totali distingui sempre se ti riferisci a un singolo mese o al valore complessivo.
- Non puoi modificare direttamente la board: proponi le azioni concrete da fare (es. "incassa la caparra di X", "sposta Y su lodge Z", "conferma o libera l'opzione di W") e spiega come.
- Sii diretto e deciso lato operativo, caldo se serve, mai robotico.`;

export async function POST(req: NextRequest) {
  const authErr = bookingWriteAuthError(req);
  if (authErr) return authErr;

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error: "no_api_key",
        message:
          "Assistente AI non configurato. Crea una API key su console.anthropic.com (fatturazione API, separata dal piano Max) e aggiungi ANTHROPIC_API_KEY alle variabili d'ambiente Vercel.",
      },
      { status: 503 }
    );
  }

  let messages: ChatMessage[] = [];
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (messages.length === 0) {
    return NextResponse.json({ ok: false, error: "no_messages" }, { status: 400 });
  }

  const bookings = await readBookings();
  const boardContext = buildBoardContext(bookings);

  // Il contesto board viene iniettato nel system prompt (sempre fresco).
  const system = `${SYSTEM_PROMPT}\n\n===== CONTESTO BOARD (dati live, ${new Date().toLocaleString("it-IT")}) =====\n${boardContext}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system,
        messages: messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: "anthropic_error", status: res.status, detail: detail.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text =
      (data.content ?? [])
        .filter((c) => c.type === "text" && c.text)
        .map((c) => c.text)
        .join("\n")
        .trim() || "(nessuna risposta)";

    return NextResponse.json({ ok: true, reply: text });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "exception", detail: String(err) }, { status: 500 });
  }
}
