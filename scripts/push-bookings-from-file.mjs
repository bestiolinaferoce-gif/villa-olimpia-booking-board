#!/usr/bin/env node
/**
 * Sincronizza prenotazioni verso il KV.
 *
 * MODALITÀ DEFAULT (sicura): POST /api/bookings/merge-local
 *   Aggiunge solo id non già presenti sul cloud. Non rimuove e non aggiorna righe esistenti.
 *
 * MODALITÀ --replace-all (distruttiva): POST /api/bookings
 *   Sostituisce l’intero dataset. Obbligatorio: VILLA_OLIMPIA_CONFIRM_REPLACE_ALL=yes
 *
 * Uso:
 *   node scripts/push-bookings-from-file.mjs [baseUrl] [pathJson]
 *   node scripts/push-bookings-from-file.mjs --replace-all [baseUrl] [pathJson]
 *
 * File: se omesso, usa data/bookings-canonical.json se esiste, altrimenti data/bookings.json
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "..");

const argv = process.argv.slice(2);
const replaceAll = argv.includes("--replace-all");
const positional = argv.filter((a) => !a.startsWith("--"));

const baseUrl = (positional[0] || "http://localhost:3000").replace(/\/$/, "");

let jsonPath = positional[1] ? resolve(root, positional[1]) : null;
if (!jsonPath) {
  const canon = resolve(root, "data/bookings-canonical.json");
  const legacy = resolve(root, "data/bookings.json");
  if (existsSync(canon)) jsonPath = canon;
  else if (existsSync(legacy)) jsonPath = legacy;
  else {
    console.error(
      "Nessun file trovato. Crea data/bookings-canonical.json (fonte affidabile) oppure passa il path.\n" +
        `  Provati: ${canon}\n  ${legacy}`
    );
    process.exit(1);
  }
}

const raw = JSON.parse(readFileSync(jsonPath, "utf8"));
const rows = Array.isArray(raw) ? raw : raw.bookings;
if (!Array.isArray(rows)) {
  console.error("JSON non valido: serve un array o { bookings: [] }");
  process.exit(1);
}

function channelStatus(r) {
  let channel = r.channel;
  if (!channel) {
    const s = String(r.source ?? "").toLowerCase();
    if (s.includes("airbnb")) channel = "airbnb";
    else if (s.includes("booking")) channel = "booking";
    else if (s.includes("expedia")) channel = "expedia";
    else channel = "direct";
  }
  const ok = ["confirmed", "option", "blocked", "cancelled"];
  const status = ok.includes(r.status) ? r.status : "confirmed";
  return { channel, status };
}

function writeAuthHeaders() {
  const secret = (process.env.API_WRITE_SECRET ?? process.env.CRON_SECRET ?? "").trim();
  const headers = { "Content-Type": "application/json" };
  if (secret) headers["X-Internal-Token"] = secret;
  return headers;
}

const bookings = rows.map((r) => {
  const { channel, status } = channelStatus(r);
  const now = new Date().toISOString();
  return {
    id: String(r.id),
    guestName: String(r.guestName ?? "").trim(),
    lodge: r.lodge,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    status,
    channel,
    notes: String(r.notes ?? ""),
    guestsCount: typeof r.guestsCount === "number" && r.guestsCount >= 1 ? r.guestsCount : 2,
    totalAmount: Number(r.totalAmount ?? r.grossEarnings ?? 0),
    depositAmount: Number(r.depositAmount ?? 0),
    depositReceived: Boolean(r.depositReceived),
    createdAt: r.createdAt || now,
    updatedAt: r.updatedAt || now,
  };
});

if (replaceAll) {
  const ok = String(process.env.VILLA_OLIMPIA_CONFIRM_REPLACE_ALL ?? "").toLowerCase() === "yes";
  if (!ok) {
    console.error(
      "Sostituzione completa rifiutata: imposta esattamente\n" +
        "  VILLA_OLIMPIA_CONFIRM_REPLACE_ALL=yes\n" +
        "Questo evita di cancellare per errore prenotazioni sul cloud."
    );
    process.exit(1);
  }
  const url = `${baseUrl}/api/bookings`;
  console.warn(`[REPLACE-ALL] POST ${url} — ${bookings.length} prenotazioni (sovrascrive TUTTO il KV)`);
  const res = await fetch(url, {
    method: "POST",
    headers: writeAuthHeaders(),
    body: JSON.stringify({ bookings }),
  });
  await printResult(res);
} else {
  const url = `${baseUrl}/api/bookings/merge-local`;
  console.log(`[MERGE] POST ${url} — ${bookings.length} prenotazioni da ${jsonPath}`);
  console.log("  (solo id nuovi vengono aggiunti; nulla viene rimosso dal cloud)");
  const res = await fetch(url, {
    method: "POST",
    headers: writeAuthHeaders(),
    body: JSON.stringify({ bookings }),
  });
  await printResult(res);
}

async function printResult(res) {
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    console.error("Errore HTTP", res.status, body);
    process.exit(1);
  }
  console.log("OK:", body);
}
