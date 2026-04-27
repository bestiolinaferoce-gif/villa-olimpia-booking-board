"use client";

import { FileDown, Printer } from "lucide-react";
import { useCallback, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type QuotePdfProps = {
  targetRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
};

export function QuotePdfExport({ targetRef, disabled }: QuotePdfProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const printPage = useCallback(() => {
    setPdfError(null);
    window.print();
  }, []);

  const exportPdf = useCallback(async () => {
    const el = targetRef.current;
    if (!el || disabled) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#FAFAF8",
        scrollX: 0,
        scrollY: -window.scrollY,
        imageTimeout: 8000,
        onclone: (doc) => {
          // Force all images to have crossorigin attribute in the clone
          doc.querySelectorAll("img").forEach((img) => {
            img.crossOrigin = "anonymous";
          });
        },
      });

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidthMm = pageWidth;
      const pageHeightPx = Math.floor((canvas.width * pageHeight) / pageWidth);

      const totalPages = Math.ceil(canvas.height / pageHeightPx);
      for (let page = 0; page < totalPages; page++) {
        const yPx = page * pageHeightPx;
        const sliceH = Math.min(pageHeightPx, canvas.height - yPx);

        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext("2d");
        if (!ctx) break;
        ctx.drawImage(canvas, 0, yPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        const sliceHMm = (sliceH * imgWidthMm) / canvas.width;
        if (page > 0) pdf.addPage();
        pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, imgWidthMm, sliceHMm);
      }

      const fileName = `preventivo-villa-olimpia-${new Date().toISOString().slice(0, 10)}.pdf`;
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error("[QuotePDF] export error:", e);
      setPdfError(
        "Generazione PDF non riuscita. Usa «Stampa / PDF sistema» e scegli «Salva come PDF» nel dialogo di stampa."
      );
    } finally {
      setPdfLoading(false);
    }
  }, [targetRef, disabled]);

  return (
    <div className="quotes-actions">
      {/* Stampa sistema: qualità print-grade, nessun rischio CORS */}
      <button
        type="button"
        className="quotes-btn quotes-btn-primary"
        onClick={printPage}
        disabled={disabled}
        title="Apre il dialogo di stampa del browser. Scegli «Salva come PDF» per un PDF ad alta qualità."
      >
        <Printer size={18} />
        Stampa / PDF sistema
      </button>

      {/* html2canvas: opzione alternativa, qualità raster */}
      <button
        type="button"
        className="quotes-btn quotes-btn-ghost"
        onClick={exportPdf}
        disabled={disabled || pdfLoading}
        title="Genera PDF via canvas (qualità raster). Preferire Stampa per risultati migliori."
      >
        <FileDown size={18} />
        {pdfLoading ? "Generazione…" : "Scarica PDF"}
      </button>

      {pdfError && (
        <p
          role="alert"
          style={{
            width: "100%",
            marginTop: 8,
            fontSize: "0.8rem",
            color: "#fbbf24",
            lineHeight: 1.4,
          }}
        >
          {pdfError}
        </p>
      )}
    </div>
  );
}
