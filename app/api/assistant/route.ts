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
- Sii diretto e deciso lato operativo, caldo se serve, mai robotico.

AZIONI OPERATIVE:
- Hai a disposizione degli strumenti per PROPORRE modifiche alla board: mark_deposit_received (segna caparra incassata), set_status (cambia stato: confirmed/option/cancelled), update_amounts (aggiorna totale e/o caparra).
- Usa questi strumenti SOLO quando Francesco ti chiede esplicitamente di fare/applicare una modifica (es. "incassa la caparra di X", "conferma l'opzione di Y", "cancella Z", "metti il totale di W a 1200").
- Le azioni che proponi NON vengono eseguite subito: Francesco le conferma con un clic. Quindi, quando usi uno strumento, accompagna sempre con una frase che spiega cosa stai per fare.
- Identifica la prenotazione giusta dal contesto (per lodge+ospite+date) e passa il suo id esatto. Se l'id è ambiguo o non lo trovi con certezza, NON usare lo strumento: chiedi conferma indicando la prenotazione.
- Per semplici domande/riepiloghi rispondi solo a testo, senza strumenti.`;

// Strumenti che l'assistente può proporre (eseguiti lato client previa conferma).
const ASSISTANT_TOOLS = [
  {
    name: "mark_deposit_received",
    description: "Segna la caparra come incassata (depositReceived = true) per una prenotazione.",
    input_schema: {
      type: "object",
      properties: { bookingId: { type: "string", description: "id esatto della prenotazione" } },
      required: ["bookingId"],
    },
  },
  {
    name: "set_status",
    description: "Cambia lo stato di una prenotazione.",
    input_schema: {
      type: "object",
      properties: {
        bookingId: { type: "string" },
        status: { type: "string", enum: ["confirmed", "option", "cancelled"] },
      },
      required: ["bookingId", "status"],
    },
  },
  {
    name: "update_amounts",
    description: "Aggiorna importo totale e/o caparra (in euro) di una prenotazione.",
    input_schema: {
      type: "object",
      properties: {
        bookingId: { type: "string" },
        totalAmount: { type: "number" },
        depositAmount: { type: "number" },
      },
      required: ["bookingId"],
    },
  },
];

const ACTION_LABELS: Record<string, (input: Record<string, unknown>, who: string) => string> = {
  mark_deposit_received: (_i, who) => `Segna caparra incassata — ${who}`,
  set_status: (i, who) => `Cambia stato a "${i.status}" — ${who}`,
  update_amounts: (i, who) => {
    const parts: string[] = [];
    if (typeof i.totalAmount === "number") parts.push(`totale ${eur(i.totalAmount as number)}`);
    if (typeof i.depositAmount === "number") parts.push(`caparra ${eur(i.depositAmount as number)}`);
    return `Aggiorna ${parts.join(" e ") || "importi"} — ${who}`;
  },
};

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
        tools: ASSISTANT_TOOLS,
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

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }>;
    };

    const text =
      (data.content ?? [])
        .filter((c) => c.type === "text" && c.text)
        .map((c) => c.text)
        .join("\n")
        .trim();

    // Estrai azioni proposte (tool_use) — NON eseguite qui: confermate dall'utente.
    const byId = new Map(bookings.map((b) => [b.id, b]));
    const actions = (data.content ?? [])
      .filter((c) => c.type === "tool_use" && c.name && c.input)
      .map((c) => {
        const input = c.input as Record<string, unknown>;
        const b = byId.get(String(input.bookingId));
        const who = b ? `${b.guestName} · ${b.lodge} (${b.checkIn})` : `id ${input.bookingId}`;
        const label = (ACTION_LABELS[c.name!]?.(input, who)) ?? `${c.name} — ${who}`;
        return { tool: c.name!, input, label, bookingFound: Boolean(b) };
      })
      // Sicurezza: scarta azioni su prenotazioni non trovate.
      .filter((a) => a.bookingFound);

    const reply =
      text ||
      (actions.length > 0
        ? "Ho preparato l'azione qui sotto: confermala per applicarla."
        : "(nessuna risposta)");

    return NextResponse.json({ ok: true, reply, actions });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "exception", detail: String(err) }, { status: 500 });
  }
}
