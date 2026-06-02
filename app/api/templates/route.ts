import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Elenca i template preventivo disponibili nella cartella public/templates/.
 * Per aggiungere un template basta copiare il file (HTML, PDF, PNG, JPG…)
 * in public/templates/ — comparirà automaticamente nella galleria.
 */
const TEMPLATES_DIR = path.join(process.cwd(), "public", "templates");

const KIND_BY_EXT: Record<string, string> = {
  ".html": "html",
  ".htm": "html",
  ".pdf": "pdf",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
};

export async function GET() {
  try {
    const entries = await readdir(TEMPLATES_DIR);
    const files = await Promise.all(
      entries
        .filter((name) => !name.startsWith("."))
        .map(async (name) => {
          const ext = path.extname(name).toLowerCase();
          const kind = KIND_BY_EXT[ext] ?? "file";
          let size = 0;
          try {
            size = (await stat(path.join(TEMPLATES_DIR, name))).size;
          } catch {
            /* ignore */
          }
          const label = name
            .replace(/\.[^.]+$/, "")
            .replace(/[_-]+/g, " ")
            .trim();
          return {
            name,
            label: label || name,
            url: `/templates/${encodeURIComponent(name)}`,
            ext,
            kind,
            size,
          };
        })
    );
    files.sort((a, b) => a.label.localeCompare(b.label));
    return NextResponse.json({ ok: true, templates: files });
  } catch {
    return NextResponse.json({ ok: true, templates: [] });
  }
}
