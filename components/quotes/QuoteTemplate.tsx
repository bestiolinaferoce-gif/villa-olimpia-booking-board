"use client";

import Image from "next/image";
import { forwardRef, useCallback, useState } from "react";
import {
  CalendarDays,
  Car,
  Check,
  Copy,
  FileText,
  Home,
  Landmark,
  MapPin,
  PawPrint,
  Phone,
  Droplets,
  TreePine,
  Users,
  Waves,
  Wifi,
} from "lucide-react";
import {
  bankDetails,
  policies,
  quoteDocument,
  quoteLodges,
  villaAmenityLines,
  villaContact,
  villaStructure,
  lodgeQuotePresentation,
  lodgeStructuralLine,
  type QuoteLodge,
  type QuoteLodgeId,
} from "./quoteConfig";
import type { QuoteComputed } from "./quoteUtils";
import {
  formatCurrencyEUR,
  formatDateIt,
  formatIbanSpaced,
} from "./quoteUtils";

export type QuoteTemplateProps = {
  quoteNumber: string;
  clientName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  lodgeId: QuoteLodgeId;
  lodgeName: string;
  lodgeDescription: string;
  lodgeFactsLine?: string | null;
  /** Seconda lodge: tabella confronto qualitativo (opzionale). */
  compareLodge?: QuoteLodge;
  includeSanitization: boolean;
  computed: QuoteComputed;
};

function BankBlock() {
  const [copied, setCopied] = useState(false);
  const spaced = formatIbanSpaced(bankDetails.iban);
  const copy = useCallback(async () => {
    const raw = bankDetails.iban.replace(/\s/g, "");
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(raw);
      } else {
        const ta = document.createElement("textarea");
        ta.value = raw;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert(`Copia manualmente l’IBAN:\n${raw}`);
    }
  }, []);

  return (
    <div className="qt-bank">
      <div className="qt-bank-head">
        <Landmark className="qt-bank-icon" size={22} aria-hidden />
        <div>
          <h3 className="qt-bank-title">Coordinate bancarie</h3>
          <p className="qt-bank-sub">Versamento acconto — dati per bonifico</p>
        </div>
      </div>
      <div className="qt-bank-grid">
        <div className="qt-bank-field">
          <span className="qt-bank-label">Intestatario</span>
          <span className="qt-bank-value">{bankDetails.accountHolder}</span>
        </div>
        <div className="qt-bank-field qt-bank-iban-wrap">
          <span className="qt-bank-label">IBAN</span>
          <div className="qt-bank-iban-row">
            <code className="qt-bank-iban">{spaced}</code>
            <button
              type="button"
              className="qt-bank-copy"
              onClick={copy}
              title="Copia IBAN"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? " Copiato" : " Copia"}
            </button>
          </div>
        </div>
        <div className="qt-bank-field">
          <span className="qt-bank-label">BIC / SWIFT</span>
          <span className="qt-bank-value">{bankDetails.bic}</span>
        </div>
      </div>
    </div>
  );
}

function CompareRow({ lodge }: { lodge: QuoteLodge }) {
  const pres = lodgeQuotePresentation(lodge);
  const facts = lodgeStructuralLine(lodge);
  return (
    <tr>
      <th scope="row" className="qt-compare-lodge">
        {lodge.name}
      </th>
      <td>
        <p className="qt-compare-cell-lead">{pres.composition}</p>
        {facts ? <p className="qt-compare-cell-sub">{facts}</p> : null}
      </td>
      <td>
        <ul className="qt-compare-list">
          {pres.strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </td>
      <td>
        <ul className="qt-compare-list">
          {pres.equipment.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

export const QuoteTemplate = forwardRef<HTMLDivElement, QuoteTemplateProps>(
  function QuoteTemplate(props, ref) {
    const {
      quoteNumber,
      clientName,
      checkIn,
      checkOut,
      guests,
      lodgeId,
      lodgeName,
      lodgeDescription,
      lodgeFactsLine,
      compareLodge,
      includeSanitization,
      computed,
    } = props;

    const primaryLodge =
      quoteLodges.find((l) => l.id === lodgeId) ?? quoteLodges[0];
    const primaryPres = lodgeQuotePresentation(primaryLodge);

    const waDigits = villaContact.whatsappDigits;
    const whatsappHref =
      /^[0-9]{10,15}$/.test(waDigits) ? `https://wa.me/${waDigits}` : null;

    const clientLine =
      clientName.trim().length > 0
        ? `${quoteDocument.clientGreetingLead} ${clientName.trim()},`
        : `${quoteDocument.clientGreetingLead} cliente,`;

    const showCompare =
      compareLodge && compareLodge.id !== primaryLodge.id;

    return (
      <div ref={ref} className="quotes-template">
        <header className="qt-header" data-quote-section="header">
          <div className="qt-logo" aria-hidden>
            <Image
              src="/logo-villa-olimpia.png"
              alt=""
              width={56}
              height={56}
              unoptimized
              style={{ objectFit: "contain", borderRadius: 8 }}
            />
          </div>
          <div className="qt-header-text">
            <span className="qt-badge">
              <FileText
                size={13}
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              {quoteDocument.docBadge}
            </span>
            <h1>{quoteDocument.docTitle}</h1>
            <p className="qt-header-tagline">{quoteDocument.headerTagline}</p>
            <p className="qt-ref">Riferimento pratica: {quoteNumber}</p>
            <div className="qt-cover-meta">
              <div className="qt-cover-meta-item">
                <CalendarDays size={16} aria-hidden />
                <div>
                  <span className="qt-cover-meta-label">Periodo soggiorno</span>
                  <span className="qt-cover-meta-value">
                    {formatDateIt(checkIn)} — {formatDateIt(checkOut)}
                  </span>
                </div>
              </div>
              <div className="qt-cover-meta-item">
                <Users size={16} aria-hidden />
                <div>
                  <span className="qt-cover-meta-label">Ospiti</span>
                  <span className="qt-cover-meta-value">{guests}</span>
                </div>
              </div>
              <div className="qt-cover-meta-item">
                <Home size={16} aria-hidden />
                <div>
                  <span className="qt-cover-meta-label">Soluzione proposta</span>
                  <span className="qt-cover-meta-value">{lodgeName}</span>
                </div>
              </div>
              <div className="qt-cover-meta-item qt-cover-meta-contacts">
                <span className="qt-cover-meta-label">Contatti</span>
                <span className="qt-cover-meta-value">
                  <a href={`mailto:${villaContact.email}`}>{villaContact.email}</a>
                  {villaContact.phoneDisplay && villaContact.phoneDisplay !== "—" ? (
                    <>
                      {" · "}
                      <span>{villaContact.phoneDisplay}</span>
                    </>
                  ) : null}
                  {whatsappHref ? (
                    <>
                      {" · "}
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    </>
                  ) : null}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="qt-body">
          <section className="qt-section" data-quote-section="intro-cliente">
            <h2>Messaggio al cliente</h2>
            <p className="qt-block-text qt-block-lead">{clientLine}</p>
            <p className="qt-block-text">{quoteDocument.availabilityIntro}</p>
            <p className="qt-block-text">{quoteDocument.choiceGuide}</p>
          </section>

          <section className="qt-section" data-quote-section="struttura">
            <h2>La struttura — Villa Olimpia</h2>
            <p className="qt-block-text">{quoteDocument.villaLead}</p>
            <div className="qt-pill-row">
              <span className="qt-pill">
                <Droplets size={15} aria-hidden /> Piscina
              </span>
              <span className="qt-pill">
                <TreePine size={15} aria-hidden /> Giardino
              </span>
              <span className="qt-pill">
                <Waves size={15} aria-hidden /> Mare e spiagge
              </span>
            </div>
            <div className="qt-grid-2" style={{ marginTop: 14 }}>
              <div className="qt-box qt-box-with-icon">
                <Droplets className="qt-box-ic" size={16} aria-hidden />
                <strong>Piscina</strong>
                {villaStructure.pool}
              </div>
              <div className="qt-box qt-box-with-icon">
                <TreePine className="qt-box-ic" size={16} aria-hidden />
                <strong>Giardino</strong>
                {villaStructure.garden}
              </div>
            </div>
            <p className="qt-territory">
              <Waves size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {villaStructure.beach}
            </p>
            <p className="qt-territory">
              <MapPin size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {villaStructure.territory}
            </p>
          </section>

          <section className="qt-section" data-quote-section="servizi-indicativi">
            <h2>Servizi (indicativi)</h2>
            <div className="qt-service-grid">
              {villaAmenityLines.map((a) => (
                <div key={a.key} className="qt-service">
                  {a.key === "wifi" ? (
                    <Wifi className="qt-service-ic" size={18} aria-hidden />
                  ) : (
                    <Car className="qt-service-ic" size={18} aria-hidden />
                  )}
                  <div>
                    <strong>{a.label}</strong>
                    <p>{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="qt-section" data-quote-section="lodge">
            <h2>Soluzione lodge proposta — {lodgeName}</h2>
            <p className="qt-lodge-lead">
              <strong className="qt-lodge-name">{lodgeName}</strong>
              {" — "}
              {lodgeDescription}
            </p>
            {lodgeFactsLine ? (
              <p className="qt-lodge-facts">{lodgeFactsLine}</p>
            ) : null}
            <h3 className="qt-subsection-title">Composizione</h3>
            <p className="qt-block-text">{primaryPres.composition}</p>
            <h3 className="qt-subsection-title">Punti di forza</h3>
            <ul className="qt-bullet-list">
              {primaryPres.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <h3 className="qt-subsection-title">Dotazioni principali</h3>
            <ul className="qt-bullet-list">
              {primaryPres.equipment.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <section className="qt-section" data-quote-section="economico">
            <h2>Riepilogo economico — soluzione proposta</h2>
            <p className="qt-block-text qt-econ-intro">{quoteDocument.economicSolutionLead}</p>
            <div className="qt-econ">
              <div className="qt-econ-row">
                <span>Tariffa giornaliera (per notte)</span>
                <span>
                  {computed.dailyRate > 0
                    ? formatCurrencyEUR(computed.dailyRate)
                    : "—"}
                </span>
              </div>
              <div className="qt-econ-row qt-econ-sub">
                <span>
                  {computed.nights > 0
                    ? `Notti: ${computed.nights} · Totale soggiorno (${computed.nights} × ${formatCurrencyEUR(computed.dailyRate)})`
                    : "Totale soggiorno (notti × tariffa)"}
                </span>
                <span>
                  {computed.nights > 0
                    ? formatCurrencyEUR(computed.stayGross)
                    : "—"}
                </span>
              </div>
              {computed.discountPercent > 0 && (
                <>
                  <div className="qt-econ-row">
                    <span>Sconto applicato ({computed.discountPercent}%)</span>
                    <span>−{formatCurrencyEUR(computed.discountAmount)}</span>
                  </div>
                  <div className="qt-econ-row qt-econ-sub">
                    <span>Totale soggiorno dopo sconto</span>
                    <span>{formatCurrencyEUR(computed.stayAfterDiscount)}</span>
                  </div>
                </>
              )}
              {includeSanitization && (
                <div className="qt-econ-row">
                  <span>Extra sanificazione</span>
                  <span>{formatCurrencyEUR(computed.sanitization)}</span>
                </div>
              )}
              {computed.petEnvironmentFee > 0 && (
                <div className="qt-econ-row qt-econ-row-single">
                  <span className="qt-econ-with-ic">
                    <PawPrint size={15} aria-hidden />
                    Quota sanificazione ambiente (presenza animale domestico):{" "}
                    {formatCurrencyEUR(computed.petEnvironmentFee)}
                  </span>
                </div>
              )}
              <div className="qt-econ-row">
                <span>Tassa di soggiorno (stimata)</span>
                <span>{formatCurrencyEUR(computed.touristTax)}</span>
              </div>
              <div className="qt-econ-row qt-econ-total">
                <span>Totale complessivo</span>
                <span>{formatCurrencyEUR(computed.grandTotal)}</span>
              </div>
              <div className="qt-econ-row qt-econ-deposit">
                <span>
                  Acconto {computed.depositPercent}% ({policies.depositLabel})
                </span>
                <span>{formatCurrencyEUR(computed.deposit)}</span>
              </div>
              <div className="qt-econ-row qt-econ-balance">
                <span>Saldo {100 - computed.depositPercent}% ({policies.balanceLabel})</span>
                <span>{formatCurrencyEUR(computed.balance)}</span>
              </div>
            </div>
          </section>

          {showCompare ? (
            <section className="qt-section" data-quote-section="confronto">
              <h2>Confronto lodge (indicativo)</h2>
              <p className="qt-block-text">{quoteDocument.compareFootnote}</p>
              <div className="qt-table-wrap">
                <table className="qt-compare-table">
                  <thead>
                    <tr>
                      <th scope="col">Lodge</th>
                      <th scope="col">Composizione</th>
                      <th scope="col">Punti di forza</th>
                      <th scope="col">Dotazioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow lodge={primaryLodge} />
                    <CompareRow lodge={compareLodge} />
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="qt-section qt-policy" data-quote-section="condizioni">
            <h2>Condizioni di prenotazione</h2>
            <ul>
              <li>{policies.bookingNote}</li>
              <li>
                <strong>Acconto e saldo:</strong> acconto {computed.depositPercent}% alla
                prenotazione; saldo {100 - computed.depositPercent}% come da{" "}
                {policies.balanceLabel.toLowerCase()}.
              </li>
              <li>{policies.cancellationFree}</li>
              <li>{policies.cancellationAfter}</li>
              <li>{policies.touristTaxNote}</li>
            </ul>
          </section>

          <section className="qt-section">
            <h2 className="qt-sr-only">Coordinate bancarie</h2>
            <BankBlock />
          </section>

          <section className="qt-section qt-cta" data-quote-section="cta">
            <h2 className="qt-cta-heading">Come prenotare — in sintesi</h2>
            <ol className="qt-step-list">
              {quoteDocument.bookingSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <p className="qt-block-text qt-cta-strong">
              <Phone size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
              <strong>Contatti</strong>
            </p>
            <p>
              Email:{" "}
              <a href={`mailto:${villaContact.email}`}>{villaContact.email}</a>
            </p>
            {whatsappHref && (
              <p>
                WhatsApp:{" "}
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  scrivici su WhatsApp
                </a>
              </p>
            )}
            <p className="qt-cta-note">
              {villaContact.addressLine} — {villaContact.websiteNote}
            </p>
          </section>

          <p className="qt-footer-note">
            Documento generato per uso informativo. Importi e condizioni definitivi
            previa conferma scritta della struttura.
          </p>
        </div>
      </div>
    );
  }
);
