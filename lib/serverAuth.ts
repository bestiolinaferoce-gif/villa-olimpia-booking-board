import { createHmac, timingSafeEqual } from "crypto";

/**
 * Autenticazione server-side della board.
 *
 * Il segreto NON deve mai essere referenziato da codice client con prefisso
 * NEXT_PUBLIC_ (finirebbe nel bundle JS pubblico). Qui viene letto solo
 * lato server. NEXT_PUBLIC_API_WRITE_SECRET resta nella catena di fallback
 * SOLO per compatibilità con env Vercel esistenti: leggerlo dal server è
 * sicuro, purché nessun file client lo referenzi.
 */

export const SESSION_COOKIE = "vob_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 giorni

export function getServerWriteSecret(): string {
  return (
    process.env.API_WRITE_SECRET ??
    process.env.CRON_SECRET ??
    process.env.NEXT_PUBLIC_API_WRITE_SECRET ??
    ""
  ).trim();
}

/**
 * Password di accesso alla board (pagina /login), separata dal token API.
 * APP_PASSWORD è la password "umana" scelta dal gestore; in sua assenza
 * vale il token API. Letta SOLO lato server.
 */
export function getLoginPassword(): string {
  return (
    process.env.APP_PASSWORD ??
    process.env.NEXT_PUBLIC_APP_PASSWORD ??
    getServerWriteSecret()
  ).trim();
}

function sign(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

/** Token sessione: "<scadenzaMs>.<hmacHex>". Stateless: verificabile senza storage. */
export function createSessionToken(secret: string, ttlMs: number = SESSION_TTL_MS): string {
  const exp = Date.now() + ttlMs;
  return `${exp}.${sign(secret, `vob-session.${exp}`)}`;
}

export function verifySessionToken(token: string | undefined | null, secret: string): boolean {
  if (!token || !secret) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(secret, `vob-session.${expStr}`);
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}
