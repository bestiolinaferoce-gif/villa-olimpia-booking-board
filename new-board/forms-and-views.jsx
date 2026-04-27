// Villa Olimpia — Booking Board · Forms, Quotes, Lodges views

const { useState: useStateF } = React;

// ============== NEW BOOKING FORM (modal) ==============
window.BBBookingForm = function BBBookingForm({ onClose, lang }) {
  const [pets, setPets] = useStateF(false);
  const [lodge, setLodge] = useStateF('frangipane');
  const [arrival, setArrival] = useStateF('2026-08-01');
  const [departure, setDeparture] = useStateF('2026-08-08');
  const [rate, setRate] = useStateF(180);
  const [discount, setDiscount] = useStateF(0);
  const nights = Math.max(1, daysBetween(new Date(arrival), new Date(departure)));
  const subtotal = rate * nights;
  const total = subtotal - discount;
  const deposit = Math.round(total * 0.3);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,59,87,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(960px, 100%)', maxHeight: '92vh', overflow: 'auto',
        background: 'var(--bb-surface)', borderRadius: 'var(--bb-r-xl)',
        boxShadow: 'var(--bb-shadow-xl)', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--bb-line)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bb-surface-2)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--vo-navy)', color: 'var(--vo-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <window.IconPlus size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="bb-display" style={{ fontSize: 22, margin: 0 }}>{lang==='en'?'New booking':'Nuova prenotazione'}</h2>
            <div style={{ fontSize: 12.5, color: 'var(--bb-mute)' }}>{lang==='en'?'Fill in guest, period and price.':'Compila ospite, periodo e prezzo.'}</div>
          </div>
          <button onClick={onClose} className="bb-btn bb-btn--ghost bb-btn--icon"><window.IconClose size={16}/></button>
        </div>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <FormBlock title={lang==='en'?'1. Guest':'1. Ospite'}>
              <Grid cols={2}>
                <Field label={lang==='en'?'Full name':'Nome ospite'}><input className="bb-input" defaultValue="Famiglia Esposito"/></Field>
                <Field label={lang==='en'?'City / country':'Città / paese'}><input className="bb-input" defaultValue="Salerno, IT"/></Field>
                <Field label={lang==='en'?'Phone':'Telefono'}><input className="bb-input" defaultValue="+39 340 9988776"/></Field>
                <Field label="Email"><input className="bb-input" defaultValue="esposito.f@email.it"/></Field>
                <Field label={lang==='en'?'Channel':'Provenienza / canale'}>
                  <select className="bb-select" defaultValue="diretto">
                    <option value="diretto">Diretto (sito + WhatsApp)</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="vrbo">Vrbo / Expedia</option>
                    <option value="telefono">Telefono / passaparola</option>
                  </select>
                </Field>
                <Field label={lang==='en'?'Adults · Children':'Adulti · Bambini'}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="bb-input" type="number" defaultValue={2} min={1}/>
                    <input className="bb-input" type="number" defaultValue={2} min={0}/>
                  </div>
                </Field>
              </Grid>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={pets} onChange={e => setPets(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--vo-ocean)' }}/>
                <window.IconPaw size={14}/> {lang==='en'?'Pets present (sanitization fee +€30)':'Animali presenti (sanificazione +€30)'}
              </label>
            </FormBlock>

            <FormBlock title={lang==='en'?'2. Stay':'2. Periodo soggiorno'}>
              <Grid cols={3}>
                <Field label="Lodge">
                  <select className="bb-select" value={lodge} onChange={e => { setLodge(e.target.value); const l = window.LODGES.find(l => l.id === e.target.value); if(l) setRate(l.rate); }}>
                    {window.LODGES.map(l => <option key={l.id} value={l.id}>{l.name} · {l.sqm}mq · {l.capacity}p {l.premium?'★':''}</option>)}
                  </select>
                </Field>
                <Field label={lang==='en'?'Arrival':'Data arrivo'}>
                  <input className="bb-input" type="date" value={arrival} onChange={e => setArrival(e.target.value)}/>
                </Field>
                <Field label={lang==='en'?'Departure':'Data partenza'}>
                  <input className="bb-input" type="date" value={departure} onChange={e => setDeparture(e.target.value)}/>
                </Field>
              </Grid>
              <div style={{
                marginTop: 4, padding: '10px 12px', borderRadius: 8,
                background: 'rgba(0,119,190,0.06)', border: '1px solid rgba(0,119,190,0.18)',
                display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
              }}>
                <window.IconCheckCircle size={15} />
                <span><strong>{lang==='en'?'Available':'Disponibile'}</strong> · {nights} {lang==='en'?'nights':'notti'} · {window.LODGES.find(l=>l.id===lodge)?.name}</span>
              </div>
            </FormBlock>

            <FormBlock title={lang==='en'?'3. Pricing':'3. Prezzo'}>
              <Grid cols={3}>
                <Field label={lang==='en'?'Daily rate (€)':'Tariffa giornaliera (€)'}>
                  <input className="bb-input bb-num" type="number" value={rate} onChange={e => setRate(+e.target.value)}/>
                </Field>
                <Field label={lang==='en'?'Discount (€)':'Sconto (€)'}>
                  <input className="bb-input bb-num" type="number" value={discount} onChange={e => setDiscount(+e.target.value)} min={0}/>
                </Field>
                <Field label={lang==='en'?'Total (auto)':'Totale (auto)'}>
                  <input className="bb-input bb-num" value={fmtEur(total)} disabled style={{ background: 'var(--bb-bg-2)', fontWeight: 700 }}/>
                </Field>
                <Field label={lang==='en'?'Deposit requested (€)':'Acconto richiesto (€)'}>
                  <input className="bb-input bb-num" type="number" value={deposit} readOnly/>
                </Field>
                <Field label={lang==='en'?'Deposit received (€)':'Acconto ricevuto (€)'}>
                  <input className="bb-input bb-num" type="number" defaultValue={0}/>
                </Field>
                <Field label={lang==='en'?'Tourist tax (€)':'Tassa di soggiorno (€)'}>
                  <input className="bb-input bb-num" defaultValue={`${(2 * 4 * Math.min(nights,5))}`}/>
                </Field>
              </Grid>
            </FormBlock>

            <FormBlock title={lang==='en'?'4. Status & notes':'4. Stato & note'}>
              <Grid cols={1}>
                <Field label={lang==='en'?'Booking status':'Stato prenotazione'}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['paid','confirmed','option','pending','cancelled'].map(s => (
                      <label key={s} style={{ cursor: 'pointer' }}>
                        <input type="radio" name="status" defaultChecked={s==='confirmed'} style={{ display: 'none' }}/>
                        <span className={`bb-badge bb-badge--${window.STATUS_META[s].color}`} style={{ padding: '5px 11px', cursor: 'pointer' }}>
                          {window.STATUS_META[s].label}
                        </span>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label={lang==='en'?'Internal notes':'Note interne'}>
                  <textarea className="bb-textarea" rows={3} placeholder={lang==='en'?'e.g. late arrival, allergies, special requests…':'es. arrivo serale, allergie, richieste speciali…'}/>
                </Field>
              </Grid>
            </FormBlock>
          </div>

          {/* Sticky summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'sticky', top: 0, padding: 18, borderRadius: 12, background: 'linear-gradient(180deg, var(--vo-cream-deep), var(--bb-surface-2))', border: '1px solid var(--bb-line)' }}>
              <div className="bb-eyebrow" style={{ marginBottom: 12 }}>{lang==='en'?'Summary':'Riepilogo'}</div>
              <SumRow label="Lodge" value={window.LODGES.find(l=>l.id===lodge)?.name}/>
              <SumRow label={lang==='en'?'Period':'Periodo'} value={`${fmtDateShort(new Date(arrival))} → ${fmtDateShort(new Date(departure))}`}/>
              <SumRow label={lang==='en'?'Nights':'Notti'} value={nights}/>
              <SumRow label={lang==='en'?'Daily':'Giornaliero'} value={fmtEur(rate)}/>
              {discount > 0 && <SumRow label={lang==='en'?'Discount':'Sconto'} value={`− ${fmtEur(discount)}`} muted/>}
              <div style={{ height: 1, background: 'var(--bb-line)', margin: '10px 0' }}/>
              <SumRow label={lang==='en'?'Total':'Totale'} value={<span className="bb-display bb-num" style={{ fontSize: 20 }}>{fmtEur(total)}</span>} bold/>
              <SumRow label={lang==='en'?'Deposit 30%':'Acconto 30%'} value={fmtEur(deposit)}/>
              <SumRow label={lang==='en'?'Balance':'Saldo'} value={fmtEur(total - deposit)} muted/>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--bb-line)', background: 'var(--bb-surface-2)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="bb-btn bb-btn--ghost" onClick={onClose}>{lang==='en'?'Cancel':'Annulla'}</button>
          <button className="bb-btn bb-btn--ghost"><window.IconFile size={14}/> {lang==='en'?'Save as quote':'Salva come preventivo'}</button>
          <button className="bb-btn bb-btn--primary"><window.IconCheck size={14}/> {lang==='en'?'Save booking':'Salva prenotazione'}</button>
        </div>
      </div>
    </div>
  );
};

function FormBlock({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--vo-ocean)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}
function Grid({ cols, children }) { return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>; }
function Field({ label, children }) {
  return <div><label className="bb-label">{label}</label>{children}</div>;
}
function SumRow({ label, value, muted, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', fontSize: 13 }}>
      <span style={{ color: muted ? 'var(--bb-mute)' : 'var(--bb-ink-2)' }}>{label}</span>
      <span className="bb-num" style={{ fontWeight: bold ? 700 : 600, color: muted ? 'var(--bb-mute)' : 'var(--bb-ink)' }}>{value}</span>
    </div>
  );
}

// ============== QUOTES VIEW ==============
window.BBQuotesView = function BBQuotesView({ lang, onPreview }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      <div className="bb-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bb-line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 className="bb-display" style={{ fontSize: 18, margin: 0 }}>{lang==='en'?'Quotes':'Preventivi'}</h3>
          <span style={{ fontSize: 11, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{window.QUOTES.length} {lang==='en'?'total':'totali'}</span>
          <span style={{ flex: 1 }}/>
          <button className="bb-btn bb-btn--ghost bb-btn--sm"><window.IconFilter size={13}/> {lang==='en'?'Filter':'Filtri'}</button>
          <button className="bb-btn bb-btn--primary bb-btn--sm"><window.IconPlus size={13}/> {lang==='en'?'New quote':'Nuovo'}</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bb-surface-2)' }}>
              {[lang==='en'?'Client':'Cliente', 'Lodge', lang==='en'?'Period':'Periodo', lang==='en'?'Total':'Totale', lang==='en'?'Status':'Stato', lang==='en'?'Expires':'Scade', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--bb-line)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {window.QUOTES.map(q => {
              const lodge = window.LODGES.find(l => l.id === q.lodge) || { name: q.lodge, premium: false };
              const meta = window.QUOTE_STATUS_META[q.status] || window.QUOTE_STATUS_META.draft;
              const expiresIn = q.expiresOn ? Math.ceil((q.expiresOn - window.TODAY)/(1000*60*60*24)) : null;
              return (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--bb-line-soft)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600 }}>{q.client}</div>
                    <div style={{ fontSize: 11, color: 'var(--bb-mute)' }}>{q.city}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {lodge.name} {lodge.premium && <span className="bb-badge bb-badge--premium" style={{fontSize:9, padding:'1px 5px'}}>★</span>}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--bb-ink-2)' }}>
                    {fmtDateShort(q.arrival)} → {fmtDateShort(q.departure)}
                    <div style={{ fontSize: 11, color: 'var(--bb-mute)' }}>{q.nights} {lang==='en'?'nights':'nt'}</div>
                  </td>
                  <td className="bb-num" style={{ padding: '12px 14px', fontWeight: 700 }}>{fmtEur(q.total)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`bb-badge bb-badge--${meta.color}`}>{meta.label}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: q.status==='sent' && expiresIn <= 3 ? 'var(--vo-amber)' : 'var(--bb-mute)' }}>
                    {q.expiresOn ? (q.status === 'expired' ? (lang==='en'?'expired':'scaduto') : (q.status==='sent' ? (lang==='en'?`in ${expiresIn}d`:`fra ${expiresIn}g`) : '—')) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button className="bb-btn bb-btn--quiet bb-btn--sm" onClick={() => onPreview(q)}>{lang==='en'?'Open':'Apri'}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <QuotePDFPreview lang={lang}/>
    </div>
  );
};

function QuotePDFPreview({ lang }) {
  const q = window.QUOTES[1]; // Hoffmann · Geranio premium
  const lodge = window.LODGES.find(l => l.id === q.lodge) || { name: q.lodge, premium: false };
  return (
    <div className="bb-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bb-line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <window.IconFilePdf size={16}/>
        <h3 className="bb-display" style={{ fontSize: 17, margin: 0 }}>{lang==='en'?'PDF preview':'Anteprima PDF'}</h3>
        <span style={{ flex: 1 }}/>
        <button className="bb-btn bb-btn--ghost bb-btn--sm"><window.IconDownload size={12}/> PDF</button>
        <button className="bb-btn bb-btn--gold bb-btn--sm"><window.IconCheck size={12}/> {lang==='en'?'Convert':'Converti'}</button>
      </div>
      <div style={{ padding: 16, background: 'var(--bb-bg-2)' }}>
        <div style={{
          background: 'white', borderRadius: 6, boxShadow: '0 8px 24px -8px rgba(15,59,87,0.25)',
          padding: 28, fontSize: 11.5, color: '#1c2330', lineHeight: 1.5,
          maxHeight: 540, overflow: 'auto',
        }}>
          {/* Letterhead */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: 14, borderBottom: '2px solid #c9a45c' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, #0f3b57, #0077BE)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5efe4', fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>VO</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 18, color: '#0f3b57', lineHeight: 1.1 }}>Villa Olimpia</div>
              <div style={{ fontSize: 9.5, color: '#6b7785' }}>Capopiccolo · Isola di Capo Rizzuto (KR) · +39 333 577 3390</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 14, fontStyle: 'italic', color: '#c9a45c' }}>Preventivo</div>
              <div style={{ fontSize: 9.5, color: '#6b7785' }}>#{q.id.toUpperCase()} · {fmtDate(q.sentDate || window.TODAY)}</div>
            </div>
          </div>

          {/* Greeting */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12 }}>Gentile <strong>{q.client}</strong>,</div>
            <p style={{ marginTop: 6, color: '#3a4654' }}>
              come richiesto, le inviamo la nostra proposta per il soggiorno presso Villa Olimpia, a Capopiccolo, ~100 m dalla Spiaggia dei Gigli (Bandiera Blu) e nell'Area Marina Protetta di Capo Rizzuto.
            </p>
          </div>

          {/* Apartment block */}
          <div style={{ marginTop: 14, padding: 12, borderRadius: 6, background: '#fbf7ef', border: '1px solid #e6dcc6' }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 14, color: '#0f3b57' }}>{lodge.name} <span style={{ fontSize: 10, color: '#a8843e', fontStyle: 'italic' }}>★ Premium · attico</span></div>
            <div style={{ fontSize: 10.5, color: '#6b7785', marginTop: 2 }}>{lodge.description}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 10, fontSize: 10 }}>
              <Mini label="Periodo" value={`${fmtDateShort(q.arrival)} → ${fmtDateShort(q.departure)}`}/>
              <Mini label="Notti" value={q.nights}/>
              <Mini label="Ospiti" value={`${q.adults}+${q.children}`}/>
              <Mini label="Tariffa" value={`€${q.rate}/notte`}/>
            </div>
          </div>

          {/* Cost breakdown */}
          <table style={{ width: '100%', marginTop: 14, fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #e6dcc6' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', color: '#6b7785', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Voce</th>
              <th style={{ textAlign: 'right', padding: '6px 4px', color: '#6b7785', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Importo</th>
            </tr></thead>
            <tbody>
              <tr><td style={{ padding: '5px 4px' }}>{q.nights} notti × €{q.rate}</td><td style={{ textAlign: 'right' }} className="bb-num">{fmtEur(q.total)}</td></tr>
              <tr><td style={{ padding: '5px 4px', color: '#8a8474' }}>Tassa di soggiorno (€2 × 5 nt × {q.adults} ad.)</td><td style={{ textAlign: 'right', color: '#8a8474' }} className="bb-num">€{2*5*q.adults}</td></tr>
              <tr style={{ borderTop: '1px solid #e6dcc6' }}>
                <td style={{ padding: '8px 4px', fontWeight: 700 }}>TOTALE</td>
                <td style={{ textAlign: 'right', fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, color: '#0f3b57' }}>{fmtEur(q.total + 2*5*q.adults)}</td>
              </tr>
              <tr><td style={{ padding: '5px 4px', color: '#3e5e44' }}>Acconto 30% alla conferma</td><td style={{ textAlign: 'right', color: '#3e5e44', fontWeight: 600 }} className="bb-num">{fmtEur(q.deposit)}</td></tr>
              <tr><td style={{ padding: '5px 4px', color: '#6b7785' }}>Saldo all'arrivo</td><td style={{ textAlign: 'right', color: '#6b7785' }} className="bb-num">{fmtEur(q.total - q.deposit)}</td></tr>
            </tbody>
          </table>

          <div style={{ marginTop: 14, padding: 10, borderRadius: 6, background: '#dbe9ef', fontSize: 10.5, color: '#1f4a5e' }}>
            <strong>Validità:</strong> il preventivo è valido fino al {fmtDate(q.expiresOn)}. La conferma avviene al ricevimento dell'acconto.
          </div>

          <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #e6dcc6', fontSize: 9.5, color: '#8a8474', textAlign: 'center', fontStyle: 'italic' }}>
            Villa Olimpia · Località Capopiccolo · 88841 Isola di Capo Rizzuto (KR) · villaolimpia.it
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div style={{ background: 'white', padding: '5px 8px', borderRadius: 4, border: '1px solid #e6dcc6' }}>
      <div style={{ fontSize: 8.5, color: '#8a8474', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#0f3b57', marginTop: 1 }}>{value}</div>
    </div>
  );
}

// ============== LODGES VIEW ==============
window.BBLodgesView = function BBLodgesView({ lang, onSelectBooking }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {window.LODGES.map(lodge => <LodgeCard key={lodge.id} lodge={lodge} lang={lang} onSelectBooking={onSelectBooking}/>)}
    </div>
  );
};

function LodgeCard({ lodge, lang, onSelectBooking }) {
  const today = window.TODAY;
  const ongoing = window.BOOKINGS.find(b => b.lodge === lodge.id && b.status !== 'cancelled' && b.arrival <= today && b.departure > today);
  const nextBooking = window.BOOKINGS
    .filter(b => b.lodge === lodge.id && b.status !== 'cancelled' && b.arrival > today)
    .sort((a, b) => a.arrival - b.arrival)[0];
  const viewMonth = window.CURRENT_MONTH.month; // luglio 2026 default (0-indexed)
  const monthRev = window.BOOKINGS.filter(b => b.lodge === lodge.id && b.status !== 'cancelled' && b.arrival instanceof Date && b.arrival.getMonth() === viewMonth).reduce((s, b) => s + (b.total || 0), 0);
  const status = ongoing ? 'occupied' : (nextBooking && (nextBooking.arrival - today)/(1000*60*60*24) <= 3 ? 'arriving' : 'free');

  const statusBadge = {
    occupied: { label: lang==='en'?'Occupied':'Occupato',  color: 'cancelled' },
    arriving: { label: lang==='en'?'Arriving':'In arrivo',  color: 'pending' },
    free:     { label: lang==='en'?'Free':'Libero',         color: 'confirmed' },
  }[status];

  return (
    <div className="bb-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
        <img src={lodge.image} alt={lodge.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(15,59,87,0.65))' }}/>
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          <span className={`bb-badge bb-badge--${statusBadge.color}`} style={{ background: 'rgba(255,255,255,0.95)' }}>
            <span className="dot" style={{ background: `var(--st-${statusBadge.color}-bar)` }}/> {statusBadge.label}
          </span>
          {lodge.premium && <span className="bb-badge bb-badge--premium">★ Premium</span>}
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 14, color: 'white' }}>
          <div className="bb-display" style={{ fontSize: 22, fontWeight: 700, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{lodge.name}</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>{lodge.floor} · {lodge.sqm} mq · {lodge.capacity} ospiti</div>
        </div>
      </div>
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--bb-mute)', lineHeight: 1.4, minHeight: 32 }}>{lodge.description}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11.5 }}>
          <div style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--bb-bg-2)' }}>
            <div style={{ fontSize: 9.5, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{lang==='en'?'Next check-in':'Prossimo check-in'}</div>
            <div style={{ fontWeight: 600, marginTop: 1 }}>{nextBooking ? fmtDateShort(nextBooking.arrival) : '—'}</div>
          </div>
          <div style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--bb-bg-2)' }}>
            <div style={{ fontSize: 9.5, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{lang==='en'?'Revenue Jul':'Revenue lug'}</div>
            <div className="bb-num" style={{ fontWeight: 600, marginTop: 1 }}>{fmtEurShort(monthRev)}</div>
          </div>
        </div>
        {ongoing && (
          <button onClick={() => onSelectBooking(ongoing)} style={{ all: 'unset', cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: 'rgba(194,96,79,0.08)', border: '1px solid rgba(194,96,79,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <window.IconUser size={13} />
            <div style={{ flex: 1, lineHeight: 1.2 }}>
              <div style={{ fontWeight: 600 }}>{ongoing.guest}</div>
              <div style={{ fontSize: 10.5, color: 'var(--bb-mute)' }}>{lang==='en'?'until':'fino al'} {fmtDateShort(ongoing.departure)}</div>
            </div>
            <window.IconChevRight size={13} />
          </button>
        )}
        <button className="bb-btn bb-btn--ghost bb-btn--sm" style={{ marginTop: 'auto' }}>
          <window.IconCalendar size={13}/> {lang==='en'?'View calendar':'Vedi calendario'}
        </button>
      </div>
    </div>
  );
}
