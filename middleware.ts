import { NextRequest, NextResponse } from "next/server";

/**
 * Gate di accesso alla board: pagine e API richiedono la sessione (cookie
 * httpOnly impostato da /api/login) oppure il token interno X-Internal-Token
 * (n8n, cron, automazioni). Il segreto vive SOLO lato server.
 *
 * Percorsi pubblici:
 * - /login, /api/login                  → flusso di accesso
 * - /api/public-availability            → consumato dal sito pubblico (read-only, nessun dato ospite)
 * - /api/calendar                       → feed iCal per calendari esterni (comportamento esistente)
 * - /api/cron/sync-airbnb               → protetto internamente da CRON_SECRET
 * - /api/bookings/export                → protetto internamente da CRON_SECRET (n8n)
 * - asset statici (_next, file con estensione)
 *
 * Fail-open: senza secret configurato (sviluppo locale) non blocca nulla,
 * coerente con il comportamento storico delle route.
 */

const SESSION_COOKIE = "vob_session";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/login",
  "/api/public-availability",
  "/api/calendar",
  "/api/cron/",
  "/api/bookings/export",
  "/_next/",
];

function getSecret(): string {
  return (
    process.env.API_WRITE_SECRET ??
    process.env.CRON_SECRET ??
    process.env.NEXT_PUBLIC_API_WRITE_SECRET ??
    ""
  ).trim();
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hasValidSession(req: NextRequest, secret: string): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmacHex(secret, `vob-session.${expStr}`);
  return sig === expected;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)))) {
    return NextResponse.next();
  }
  // Asset statici serviti da /public (immagini, template, manifest…).
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  const secret = getSecret();
  if (!secret) return NextResponse.next();

  // Automazioni (n8n, Cowork, cron interno): header con il token server-side.
  const internalToken = (req.headers.get("x-internal-token") ?? "").trim();
  if (internalToken && internalToken === secret) {
    return NextResponse.next();
  }

  if (await hasValidSession(req, secret)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Esclude i file statici più comuni a livello di matcher (performance).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
