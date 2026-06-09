import type { Booking } from "@/lib/types";

/**
 * Scrittura compare-and-swap sul KV (Upstash REST) per eliminare la race
 * condition read-modify-write: se la versione sul KV è cambiata tra lettura
 * e scrittura, la scrittura viene rifiutata e il chiamante ri-legge e
 * ri-applica il merge (retry). Senza CAS, due scritture concorrenti
 * (es. operatore + cron Airbnb) si sovrascrivono a vicenda perdendo dati.
 */

const BASE = process.env.KV_REST_API_URL ?? "";
const TOKEN = process.env.KV_REST_API_TOKEN ?? "";
export const BOOKINGS_KEY = "vob_bookings";

export type KVBookingsPayload = { v: number; ts: string; data: Booking[]; deletedIds?: string[] };

/** Tombstones: cap per evitare crescita illimitata del payload (mantiene i più recenti). */
export const MAX_DELETED_IDS = 5000;

export function capDeletedIds(ids: string[]): string[] {
  return ids.length > MAX_DELETED_IDS ? ids.slice(ids.length - MAX_DELETED_IDS) : ids;
}

export function kvConfigured(): boolean {
  return Boolean(BASE && TOKEN);
}

export async function readBookingsKV(): Promise<KVBookingsPayload | null> {
  if (!kvConfigured()) return null;
  const res = await fetch(`${BASE}/get/${BOOKINGS_KEY}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  const json = (await res.json()) as { result: string | null };
  if (!json.result) return null;
  const parsed = JSON.parse(json.result) as KVBookingsPayload | Booking[];
  if (Array.isArray(parsed)) {
    return { v: 1, ts: new Date().toISOString(), data: parsed };
  }
  return parsed;
}

/**
 * Script Lua: scrive solo se la versione attuale sul KV coincide con quella
 * letta dal chiamante (o se la chiave non esiste / non è leggibile).
 * Ritorna 1 se scritto, 0 se la versione è cambiata nel frattempo.
 */
const CAS_SCRIPT = `
local cur = redis.call('GET', KEYS[1])
if cur then
  local ok, decoded = pcall(cjson.decode, cur)
  if ok and type(decoded) == 'table' and decoded.v ~= nil then
    if tonumber(decoded.v) ~= tonumber(ARGV[1]) then
      return 0
    end
  end
end
redis.call('SET', KEYS[1], ARGV[2])
return 1
`.trim();

/**
 * Scrittura CAS. `expectedVersion` è la `v` del payload letto prima del merge
 * (0 se la chiave non esisteva). Ritorna true se la scrittura è avvenuta.
 */
export async function casWriteBookingsKV(
  expectedVersion: number,
  payload: KVBookingsPayload
): Promise<boolean> {
  if (!kvConfigured()) return false;
  const res = await fetch(BASE, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      "EVAL",
      CAS_SCRIPT,
      "1",
      BOOKINGS_KEY,
      String(expectedVersion),
      JSON.stringify(payload),
    ]),
  });
  if (!res.ok) return false;
  const json = (await res.json()) as { result?: number | string; error?: string };
  if (json.error) return false;
  return Number(json.result) === 1;
}
