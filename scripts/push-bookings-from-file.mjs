#!/usr/bin/env node
/**
 * Carica prenotazioni sul KV via POST /api/bookings (sostituisce l'intero dataset).
 * Uso: node scripts/push-bookings-from-file.mjs [baseUrl] [pathJson]
 * Esempi:
 *   node scripts/push-bookings-from-file.mjs http://localhost:3000 data/bookings.json
 *   node scripts/push-bookings-from-file.mjs https://tuo-progetto.vercel.app
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "..");

const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const jsonPath = resolve(root, process.argv[3] || "data/bookings.json");

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

const url = `${baseUrl}/api/bookings`;
console.log(`POST ${url} — ${bookings.length} prenotazioni da ${jsonPath}`);

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ bookings }),
});

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
