import { NextRequest, NextResponse } from "next/server";
import { bookingWriteAuthError } from "@/lib/bookingsApiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN ?? "";
// Versione API Blob (allineata al client ufficiale @vercel/blob).
const BLOB_API_VERSION = "11";
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
  const pathname = `spese/${Date.now()}-${safeName}`;
  const contentType = file.type || "application/octet-stream";

  try {
    const body = Buffer.from(await file.arrayBuffer());
    const blobRes = await fetch(
      `https://blob.vercel-storage.com/${encodeURI(pathname)}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bearer ${BLOB_TOKEN}`,
          "x-api-version": BLOB_API_VERSION,
          "x-content-type": contentType,
          "x-add-random-suffix": "1",
          "content-type": contentType,
        },
        body,
      }
    );

    if (!blobRes.ok) {
      const detail = await blobRes.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: "blob_upload_failed", status: blobRes.status, detail },
        { status: 502 }
      );
    }

    const data = (await blobRes.json()) as {
      url: string;
      downloadUrl?: string;
      pathname?: string;
      contentType?: string;
    };

    return NextResponse.json({
      ok: true,
      attachment: {
        name: file.name || safeName,
        url: data.url,
        size: file.size,
        contentType: data.contentType || contentType,
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
