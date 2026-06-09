import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getServerWriteSecret,
  safeEqual,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Login con password (stesso valore di API_WRITE_SECRET/CRON_SECRET su Vercel). */
export async function POST(req: NextRequest) {
  const secret = getServerWriteSecret();
  if (!secret) {
    // Nessun secret configurato (es. sviluppo locale): nessun login necessario.
    return NextResponse.json({ ok: true, open: true });
  }

  let password = "";
  try {
    const body = (await req.json()) as { password?: string };
    password = String(body.password ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!password || !safeEqual(password, secret)) {
    return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
