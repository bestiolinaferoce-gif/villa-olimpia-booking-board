import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerWriteSecret, safeEqual, SESSION_COOKIE, verifySessionToken } from "@/lib/serverAuth";

/** Vercel deploy o build production: richiede autenticazione per le API mutanti. */
export function isBookingsApiProductionLike(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function getBookingApiWriteSecret(): string {
  return getServerWriteSecret();
}

/**
 * Autenticazione scritture: sessione browser (cookie httpOnly firmato, impostato
 * da /api/login) OPPURE header X-Internal-Token uguale al secret server-side
 * (n8n, cron, automazioni). Il secret non è mai presente nel bundle client.
 * In ambiente production-like senza secret configurato → 503 (niente scritture anonime).
 */
export function bookingWriteAuthError(req: NextRequest): NextResponse | null {
  const apiSecret = getBookingApiWriteSecret();

  if (isBookingsApiProductionLike() && !apiSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Server misconfigured: API_WRITE_SECRET or CRON_SECRET is required in this environment.",
      },
      { status: 503 }
    );
  }

  if (!apiSecret) return null;

  const clientToken = (req.headers.get("x-internal-token") ?? "").trim();
  if (clientToken && safeEqual(clientToken, apiSecret)) return null;

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(session, apiSecret)) return null;

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Autenticazione letture: stessi criteri delle scritture (sessione o token).
 * Fail-open senza secret configurato (sviluppo locale).
 */
export function bookingReadAuthError(req: NextRequest): NextResponse | null {
  const apiSecret = getBookingApiWriteSecret();
  if (!apiSecret) return null;

  const clientToken = (req.headers.get("x-internal-token") ?? "").trim();
  if (clientToken && safeEqual(clientToken, apiSecret)) return null;

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(session, apiSecret)) return null;

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function kvNotConfiguredResponse(): NextResponse {
  return NextResponse.json({ ok: false, error: "KV not configured" }, { status: 503 });
}
