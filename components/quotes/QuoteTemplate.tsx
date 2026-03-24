"use client";

import Image from "next/image";
import { forwardRef, useCallback, useState } from "react";
import {
  CalendarDays,
  Car,
  Copy,
  Check,
  FileText,
  Home,
  Landmark,
  MapPin,
  PawPrint,
  Droplets,
  TreePine,
  User,
  Users,
  Waves,
  Wifi,
} from "lucide-react";
import {
  bankDetails,
  policies,
  quoteLodges,
  villaAmenityLines,
  villaContact,
  villaIntro,
  villaStructure,
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
  lodgeName: string;
  lodgeDescription: string;
  /** Capienza / camere se presenti in config lodge. */
  lodgeFactsLine?: string | null;
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

export const QuoteTemplate = forwardRef<HTMLDivElement, QuoteTemplateProps>(
  function QuoteTemplate(props, ref) {
    const {
      quoteNumber,
      clientName,
      checkIn,
      checkOut,
      guests,
      lodgeName,
      lodgeDescription,
      lodgeFactsLine,
      includeSanitization,
      computed,
    } = props;

    const waDigits = villaContact.whatsappDigits;
    const whatsappHref =
      /^[0-9]{10,15}$/.test(waDigits) ? `https://wa.me/${waDigits}` : null;

    const otherLodges = quoteLodges
      .filter((l) => l.name !== lodgeName)
      .map((l) => l.name)
      .join(", ");

    return (
      <div ref={ref} className="quotes-template">
        <header className="qt-header">
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
              <FileText size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Preventivo personalizzato
            </span>
            <h1>Preventivo soggiorno — {villaContact.name}</h1>
            <p className="qt-ref">Rif. {quoteNumber}</p>
          </div>
        </header>

        <div className="qt-body">
          <section className="qt-section">
            <h2>Alloggio & ospite</h2>
            <div className="qt-grid-2">
              <div className="qt-box qt-box-with-icon">
                <User className="qt-box-ic" size={16} aria-hidden />
                <strong>Cliente</strong>
                {clientName.trim() || "—"}
              </div>
              <div className="qt-box qt-box-with-icon">
                <Home className="qt-box-ic" size={16} aria-hidden />
                <strong>Lodge</strong>
                {lodgeName}
              </div>
              <div className="qt-box qt-box-with-icon">
                <CalendarDays className="qt-box-ic" size={16} aria-hidden />
                <strong>Arrivo</strong>
                {formatDateIt(checkIn)}
              </div>
              <div className="qt-box qt-box-with-icon">
                <CalendarDays className="qt-box-ic" size={16} aria-hidden />
                <strong>Partenza</strong>
                {formatDateIt(checkOut)}
              </div>
              <div className="qt-box qt-box-with-icon">
                <span className="qt-box-ic" aria-hidden>
                  ☾
                </span>
                <strong>Notti</strong>
                {computed.nights > 0 ? `${computed.nights}` : "—"}
              </div>
              <div className="qt-box qt-box-with-icon">
                <Users className="qt-box-ic" size={16} aria-hidden />
                <strong>Ospiti</strong>
                {guests}
              </div>
            </div>
          </section>

          <section className="qt-section">
            <h2>{villaIntro.title}</h2>
            <p>{villaIntro.paragraph}</p>
          </section>

          <section className="qt-section">
            <h2>Punti di forza</h2>
            <div className="qt-pill-row">
              <span className="qt-pill">
                <Droplets size={15} aria-hidden /> Piscina
              </span>
              <span className="qt-pill">
                <TreePine size={15} aria-hidden /> Giardino
              </span>
              <span className="qt-pill">
                <Waves size={15} aria-hidden /> Vicino al mare
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
              <MapPin size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {villaStructure.sea}
            </p>
          </section>

          <section className="qt-section">
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

          <section className="qt-section">
            <h2>La lodge selezionata</h2>
            <p className="qt-lodge-lead">
              <strong className="qt-lodge-name">{lodgeName}</strong>
              {" — "}
              {lodgeDescription}
            </p>
            <p className="qt-lodge-alt">
              Altre lodge disponibili: {otherLodges}.
            </p>
            {lodgeFactsLine ? (
              <p className="qt-lodge-facts">{lodgeFactsLine}</p>
            ) : null}
          </section>

          <section className="qt-section">
            <h2>Riepilogo economico</h2>
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
                    ? `Totale soggiorno: ${computed.nights} notti × ${formatCurrencyEUR(computed.dailyRate)}`
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
                <span>Tassa di soggiorno (€ 2 / persona / notte, stimata)</span>
                <span>{formatCurrencyEUR(computed.touristTax)}</span>
              </div>
              <div className="qt-econ-row qt-econ-total">
                <span>Totale finale</span>
                <span>{formatCurrencyEUR(computed.grandTotal)}</span>
              </div>
              <div className="qt-econ-row">
                <span>
                  {policies.depositLabel} ({computed.depositPercent}%)
                </span>
                <span>{formatCurrencyEUR(computed.deposit)}</span>
              </div>
              <div className="qt-econ-row">
                <span>{policies.balanceLabel}</span>
                <span>{formatCurrencyEUR(computed.balance)}</span>
              </div>
            </div>
          </section>

          <section className="qt-section qt-policy">
            <h2>Politiche di prenotazione</h2>
            <ul>
              <li>{policies.bookingNote}</li>
              <li>{policies.cancellationFree}</li>
              <li>{policies.cancellationAfter}</li>
            </ul>
          </section>

          <section className="qt-section">
            <h2 className="qt-sr-only">Coordinate bancarie</h2>
            <BankBlock />
          </section>

          <section className="qt-section qt-cta">
            <p>
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
