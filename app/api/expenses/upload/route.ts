import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { bookingWriteAuthError } from "@/lib/bookingsApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per documento

function sanitizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(-120) || "documento";
}

/**
 * Upload di un allegato spesa su Vercel Blob.
 * Riceve multipart/form-data con campo "file".
 * Richiede BLOB_READ_WRITE_TOKEN (attiva uno store Blob nel pannello Vercel).
 */
export async function POST(req: NextRequest) {
  const authErr = bookingWriteAuthError(req);
  if (authErr) return authErr;

  const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN ?? "";
  if (!BLOB_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error: "blob_not_configured",
        message:
          "Storage allegati non attivo. Crea uno store Blob su Vercel (Storage → Create → Blob) e aggiungi BLOB_READ_WRITE_TOKEN alle variabili d'ambiente.",
      },
      { status: 503 }
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "too_large", message: "File troppo grande (max 25 MB)." },
      { status: 413 }
    );
  }

  const safeName = sanitizeName(file.name || "documento");
  const contentType = file.type || "application/octet-stream";

  try {
    const blob = await put(`spese/${safeName}`, file, {
      access: "public",
      token: BLOB_TOKEN,
      addRandomSuffix: true,
      contentType,
    });
    return NextResponse.json({
      ok: true,
      attachment: {
        name: file.name || safeName,
        url: blob.url,
        size: file.size,
        contentType: blob.contentType || contentType,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "upload_exception", detail: String(err) },
      { status: 500 }
    );
  }
}
