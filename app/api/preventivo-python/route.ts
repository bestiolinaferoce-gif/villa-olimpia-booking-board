import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, unlink } from "fs/promises";
import path from "path";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PreventivoParams {
  lodge_name: string;
  client_name: string;
  checkin: string;
  checkout: string;
  nights: number;
  guests: number;
  daily_rate: number;
  tassa_unit: number;
  photo1?: string;
  photo2?: string;
}

export async function POST(request: NextRequest) {
  let params: PreventivoParams;

  try {
    params = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON non valido" },
      { status: 400 }
    );
  }

  // Validazione campi obbligatori
  const required = [
    "lodge_name", "client_name", "checkin", "checkout",
    "nights", "guests", "daily_rate", "tassa_unit",
  ] as const;

  for (const field of required) {
    if (params[field] === undefined || params[field] === null || params[field] === "") {
      return NextResponse.json(
        { error: `Campo obbligatorio mancante: ${field}` },
        { status: 400 }
      );
    }
  }

  const scriptPath = path.join(process.cwd(), "scripts", "preventivo_pdf.py");
  const paramsJson = JSON.stringify(params);

  let pdfPath: string;

  try {
    const { stdout, stderr } = await execFileAsync(
      "python3",
      [scriptPath, "--params", paramsJson],
      {
        timeout: 30000,  // 30 secondi max
        maxBuffer: 10 * 1024 * 1024,  // 10 MB buffer
      }
    );

    // Log stderr sul server (non blocca)
    if (stderr) {
      console.log("[preventivo-python]", stderr.trim());
    }

    pdfPath = stdout.trim();

    if (!pdfPath) {
      throw new Error("Lo script Python non ha restituito alcun percorso file");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[preventivo-python] Errore subprocess:", message);
    return NextResponse.json(
      { error: "Generazione PDF fallita", detail: message },
      { status: 500 }
    );
  }

  // Legge il PDF e lo invia come response
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await readFile(pdfPath);
  } catch (err) {
    console.error("[preventivo-python] Impossibile leggere il PDF:", pdfPath, err);
    return NextResponse.json(
      { error: "File PDF generato ma non leggibile" },
      { status: 500 }
    );
  }

  // Pulizia file temporaneo (fire-and-forget, non blocca la response)
  unlink(pdfPath).catch(() => {});

  const lodgeName = params.lodge_name.replace(/[^a-zA-Z0-9]/g, "_");
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `Preventivo_VillaOlimpia_${lodgeName}_${today}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
