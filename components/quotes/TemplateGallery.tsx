"use client";

import { useEffect, useState } from "react";
import { FileText, FileImage, File as FileIcon, ExternalLink, Download, Star } from "lucide-react";

type TemplateItem = {
  name: string;
  label: string;
  url: string;
  ext: string;
  kind: "html" | "pdf" | "image" | "file";
  size: number;
};

const NAVY = "#0f2742";
const GOLD = "#b45309";

function kindIcon(kind: TemplateItem["kind"]) {
  if (kind === "image") return <FileImage size={18} />;
  if (kind === "pdf") return <FileText size={18} />;
  if (kind === "html") return <FileText size={18} />;
  return <FileIcon size={18} />;
}

function fmtSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Galleria dei migliori template preventivo già prodotti.
 * Legge dinamicamente i file presenti in public/templates/.
 */
export function TemplateGallery() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 18,
        margin: "0 auto 20px",
        maxWidth: 1100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Star size={18} style={{ color: GOLD }} />
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: NAVY }}>
          Template preventivo
        </h2>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b" }}>
        Scegli uno dei migliori modelli prodotti finora, oppure usa il generatore guidato qui sotto.
      </p>

      {loading ? (
        <div style={{ padding: 20, color: "#94a3b8", fontSize: 14 }}>Caricamento template…</div>
      ) : templates.length === 0 ? (
        <div
          style={{
            border: "1px dashed #cbd5e1",
            borderRadius: 10,
            padding: 18,
            fontSize: 13,
            color: "#64748b",
            background: "#f8fafc",
          }}
        >
          Nessun template salvato. Copia i tuoi modelli migliori (HTML, PDF o immagine) nella
          cartella <code>public/templates/</code> del progetto: compariranno qui automaticamente.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {templates.map((t) => {
            const isSel = selected === t.name;
            return (
              <div
                key={t.name}
                onClick={() => setSelected(t.name)}
                style={{
                  border: `1px solid ${isSel ? NAVY : "#e2e8f0"}`,
                  outline: isSel ? `2px solid ${NAVY}` : "none",
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: 120,
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {t.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.url}
                      alt={t.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : t.kind === "pdf" ? (
                    <object data={`${t.url}#view=FitH`} type="application/pdf" width="100%" height="100%">
                      <div style={{ color: "#94a3b8" }}>{kindIcon(t.kind)}</div>
                    </object>
                  ) : (
                    <iframe
                      title={t.label}
                      src={t.url}
                      style={{
                        width: "220%",
                        height: "220%",
                        transform: "scale(0.45)",
                        transformOrigin: "top left",
                        border: "none",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: NAVY,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={t.label}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      marginTop: 2,
                    }}
                  >
                    {t.ext.replace(".", "")} {t.size ? `· ${fmtSize(t.size)}` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={linkBtn(NAVY)}
                    >
                      <ExternalLink size={13} /> Apri
                    </a>
                    <a
                      href={t.url}
                      download={t.name}
                      onClick={(e) => e.stopPropagation()}
                      style={linkBtn(GOLD)}
                    >
                      <Download size={13} /> Scarica
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function linkBtn(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    fontWeight: 600,
    color,
    textDecoration: "none",
    border: `1px solid ${color}`,
    borderRadius: 7,
    padding: "4px 8px",
  };
}
