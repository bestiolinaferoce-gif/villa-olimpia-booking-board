// Villa Olimpia — Booking Board · Side panels & detail modal

const { useState: useStateP } = React;

// ============== BOOKING DETAIL MODAL ==============
window.BBBookingModal = function BBBookingModal({ booking, onClose, lang }) {
  if (!booking) return null;
  const lodge = window.LODGES.find(l => l.id === booking.lodge) || {};
  const ch = window.CHANNELS[booking.channel] || window.CHANNELS.diretto;
  const meta = window.STATUS_META[booking.status] || window.STATUS_META.confirmed;
  const adults   = booking.adults   ?? booking.guestsCount ?? 2;
  const children = booking.children ?? 0;
  const paid     = booking.paid     ?? 0;
  const total    = booking.total    ?? booking.totalAmount ?? 0;
  const deposit  = booking.deposit  ?? booking.depositAmount ?? Math.round(total * 0.3);
  const balance  = total - paid;
  const city     = booking.city    || '—';
  const country  = booking.country || '—';
  const tassaSoggiorno = (adults + (children > 0 ? children : 0)) * 2 * Math.min(booking.nights || 1, 5);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,59,87,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(900px, 100%)', maxHeight: '90vh', overflow: 'auto',
        background: 'var(--bb-surface)', borderRadius: 'var(--bb-r-xl)',
        boxShadow: 'var(--bb-shadow-xl)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header strip */}
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid var(--bb-line)',
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'var(--bb-surface-2)',
          borderTopLeftRadius: 'var(--bb-r-xl)', borderTopRightRadius: 'var(--bb-r-xl)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `var(--st-${meta.color}-bg)`,
            color: `var(--st-${meta.color}-fg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 20,
          }}>{booking.guest.charAt(0)}</div>
          <div style={{ flex: 1, lineHeight: 1.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
              <h2 className="bb-display" style={{ fontSize: 22, margin: 0 }}>{booking.guest}</h2>
              <span className={`bb-badge bb-badge--${meta.color}`}>
                <span className="dot" style={{ background: `var(--st-${meta.color}-bar)` }}/>
                {meta.label}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--bb-mute)' }}>
              #{booking.id.toUpperCase()} · {city}{country !== '—' ? ', ' + country : ''} · {ch.label} · {fmtDate(booking.arrival)} → {fmtDate(booking.departure)} · {booking.nights} {lang==='en'?'nights':'notti'}
            </div>
          </div>
          <button onClick={onClose} className="bb-btn bb-btn--ghost bb-btn--icon" aria-label="Close">
            <window.IconClose size={16}/>
          </button>
        </div>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          {/* Left col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Section title={lang==='en'?'Guest':'Dati ospite'}>
              <DetailRow label={lang==='en'?'Name':'Nome'} value={booking.guest}/>
              <DetailRow label={lang==='en'?'Country':'Paese'} value={`${city}${country !== '—' ? ', ' + country : ''}`}/>
              {booking.phone && booking.phone !== '—' && <DetailRow label={lang==='en'?'Phone':'Telefono'} value={booking.phone}/>}
              {booking.email && <DetailRow label="Email" value={booking.email}/>}
              <DetailRow label={lang==='en'?'Guests':'Ospiti'} value={`${adults} ${lang==='en'?'adults':'adulti'}${children?` · ${children} ${lang==='en'?'children':'bambini'}`:''}${booking.pets?` · 🐾 ${lang==='en'?'pet':'animale'}`:''}`}/>
            </Section>

            <Section title={lang==='en'?'Stay':'Periodo soggiorno'}>
              <DetailRow label={lang==='en'?'Lodge':'Lodge'} value={<span>{lodge.name} <span style={{color:'var(--bb-mute)'}}>· {lodge.floor} · {lodge.sqm}mq</span> {lodge.premium && <span className="bb-badge bb-badge--premium" style={{fontSize:10, marginLeft:4}}>★ Premium</span>}</span>}/>
              <DetailRow label={lang==='en'?'Check-in':'Check-in'} value={fmtDate(booking.arrival)} sub="dalle 16:00"/>
              <DetailRow label={lang==='en'?'Check-out':'Check-out'} value={fmtDate(booking.departure)} sub="entro le 10:00"/>
              <DetailRow label={lang==='en'?'Nights':'Notti'} value={booking.nights}/>
              <DetailRow label={lang==='en'?'Channel':'Canale'} value={<span><span className="bb-badge bb-badge--neutral" style={{fontSize:10.5}}>{ch.short}</span> &nbsp;{ch.label}{ch.commission > 0 && <span style={{color:'var(--bb-mute)'}}> · commissione {(ch.commission*100).toFixed(0)}%</span>}</span>}/>
            </Section>

            <Section title={lang==='en'?'Notes':'Note interne'}>
              <div style={{
                padding: 12, borderRadius: 8, background: 'var(--bb-bg-2)',
                fontSize: 13, color: 'var(--bb-ink-2)', lineHeight: 1.55,
                fontStyle: booking.notes ? 'normal' : 'italic',
              }}>
                {booking.notes || (lang==='en' ? 'No notes.' : 'Nessuna nota.')}
              </div>
              {booking.pets && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--vo-amber)' }}>
                  <window.IconPaw size={14}/> {lang==='en'?'Pet present — extra sanitization':'Animale presente — sanificazione +30€'}
                </div>
              )}
            </Section>
          </div>

          {/* Right col — money */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
              padding: 18, borderRadius: 12,
              background: 'linear-gradient(180deg, var(--vo-cream-deep), var(--bb-surface-2))',
              border: '1px solid var(--bb-line)',
            }}>
              <div className="bb-eyebrow" style={{ marginBottom: 10 }}>{lang==='en'?'Money':'Importi'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--bb-ink-2)' }}>{lang==='en'?'Daily rate':'Tariffa giorno'}</span>
                <span className="bb-num" style={{ fontSize: 14, fontWeight: 600 }}>{fmtEur(lodge.rate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--bb-ink-2)' }}>{booking.nights} {lang==='en'?'nights':'notti'} × {fmtEur(lodge.rate)}</span>
                <span className="bb-num" style={{ fontSize: 14, fontWeight: 600 }}>{fmtEur(total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, color: 'var(--bb-mute)', fontSize: 12 }}>
                <span>{lang==='en'?'Tourist tax':'Tassa di soggiorno'} (€2 × {Math.min(booking.nights||1,5)} {lang==='en'?'nights':'nt'})</span>
                <span className="bb-num">{fmtEur(tassaSoggiorno)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--bb-line)', margin: '12px 0' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{lang==='en'?'Total':'Totale'}</span>
                <span className="bb-display bb-num" style={{ fontSize: 26 }}>{fmtEur(total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <PaymentRow label={lang==='en'?'Deposit (30%)':'Acconto 30%'}
                amount={deposit}
                paid={paid >= deposit}
                color="var(--vo-sage-deep)"/>
              <PaymentRow label={lang==='en'?'Balance':'Saldo'}
                amount={total - deposit}
                paid={paid >= total}
                color="var(--vo-ocean)"/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 12px', borderRadius: 8, background: balance > 0 ? 'rgba(201,138,58,0.10)' : 'rgba(122,155,126,0.10)', border: `1px solid ${balance > 0 ? 'rgba(201,138,58,0.3)' : 'rgba(122,155,126,0.3)'}` }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: balance > 0 ? 'var(--vo-amber)' : 'var(--vo-sage-deep)' }}>
                  {balance > 0 ? (lang==='en'?'Balance due':'Da incassare') : (lang==='en'?'Fully paid':'Saldato')}
                </span>
                <span className="bb-num" style={{ fontSize: 16, fontWeight: 700, color: balance > 0 ? 'var(--vo-amber)' : 'var(--vo-sage-deep)' }}>
                  {balance > 0 ? fmtEur(balance) : '✓'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--bb-line)',
          background: 'var(--bb-surface-2)',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <button className="bb-btn bb-btn--ghost"><window.IconEdit size={14}/> {lang==='en'?'Edit':'Modifica'}</button>
          <button className="bb-btn bb-btn--ghost"><window.IconCopy size={14}/> {lang==='en'?'Duplicate':'Duplica'}</button>
          <button className="bb-btn bb-btn--ghost"><window.IconFile size={14}/> {lang==='en'?'New quote from this':'Genera preventivo'}</button>
          <button className="bb-btn bb-btn--ghost"><window.IconFilePdf size={14}/> PDF</button>
          <span style={{ flex: 1 }}/>
          {balance > 0 && (
            <>
              <button className="bb-btn bb-btn--ghost"><window.IconCheck size={14}/> {lang==='en'?'Mark deposit received':'Acconto ricevuto'}</button>
              <button className="bb-btn bb-btn--gold"><window.IconWallet size={14}/> {lang==='en'?'Mark paid':'Saldo pagato'}</button>
            </>
          )}
          <button className="bb-btn bb-btn--danger"><window.IconTrash size={14}/> {lang==='en'?'Cancel':'Cancella'}</button>
        </div>
      </div>
    </div>
  );
};

function Section({ title, children }) {
  return (
    <div>
      <div className="bb-eyebrow" style={{ marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value, sub }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0', borderBottom: '1px dashed var(--bb-line-soft)' }}>
      <span style={{ fontSize: 12.5, color: 'var(--bb-mute)', flexShrink: 0, marginRight: 14 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--bb-ink)', textAlign: 'right' }}>
        {value}
        {sub && <div style={{ fontSize: 11, color: 'var(--bb-mute)', fontWeight: 400 }}>{sub}</div>}
      </span>
    </div>
  );
}

function PaymentRow({ label, amount, paid, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: 8,
      background: 'var(--bb-surface)', border: '1px solid var(--bb-line)',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: paid ? color : 'var(--bb-bg-2)',
          color: paid ? 'white' : 'var(--bb-mute)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: paid ? 'none' : '1px dashed var(--bb-line-strong)',
        }}>{paid ? <window.IconCheck size={11} strokeWidth={3}/> : null}</span>
        {label}
      </span>
      <span className="bb-num" style={{ fontSize: 14, fontWeight: 600 }}>{fmtEur(amount)}</span>
    </div>
  );
}

// ============== TODAY OPS PANEL (right rail) ==============
window.BBTodayPanel = function BBTodayPanel({ lang, onSelectBooking }) {
  const today = window.TODAY;
  const checkIns = window.BOOKINGS.filter(b => sameDay(b.arrival, today) && b.status !== 'cancelled');
  const checkOuts = window.BOOKINGS.filter(b => sameDay(b.departure, today) && b.status !== 'cancelled');
  const upcomingCheckIns = window.BOOKINGS.filter(b => {
    const diff = (b.arrival - today)/(1000*60*60*24);
    return diff > 0 && diff <= 3 && b.status !== 'cancelled';
  });
  const pendingDeposits = window.BOOKINGS.filter(b => b.status === 'pending' || (b.status === 'option' && b.paid < b.deposit));
  const openQuotes = window.QUOTES.filter(q => q.status === 'sent' || q.status === 'draft');

  return (
    <div className="bb-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bb-line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <window.IconClock size={16} />
        <h3 className="bb-display" style={{ fontSize: 17, margin: 0 }}>{lang==='en'?'Today':'Oggi'}</h3>
        <span style={{ fontSize: 11, color: 'var(--bb-mute)', textTransform: 'capitalize' }}>
          {today.toLocaleDateString(lang==='en'?'en-GB':'it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OpsBlock
          title={lang==='en'?'Check-ins today':'Check-in di oggi'}
          icon={<window.IconLogIn size={13}/>}
          color="var(--vo-sage-deep)"
          count={checkIns.length}
        >
          {checkIns.length === 0 && <EmptyMini lang={lang} text={lang==='en'?'No arrivals today':'Nessun arrivo oggi'}/>}
          {checkIns.map(b => <OpsBookingRow key={b.id} b={b} sub={lang==='en'?'arrival from 16:00':'arrivo dalle 16:00'} onSelect={() => onSelectBooking(b)}/>)}
        </OpsBlock>

        <OpsBlock
          title={lang==='en'?'Check-outs today':'Check-out di oggi'}
          icon={<window.IconLogOut size={13}/>}
          color="var(--vo-amber)"
          count={checkOuts.length}
        >
          {checkOuts.length === 0 && <EmptyMini lang={lang} text={lang==='en'?'No departures today':'Nessuna partenza oggi'}/>}
          {checkOuts.map(b => <OpsBookingRow key={b.id} b={b} sub={lang==='en'?'leave by 10:00 → cleaning':'entro 10:00 → pulizia'} onSelect={() => onSelectBooking(b)}/>)}
        </OpsBlock>

        <OpsBlock
          title={lang==='en'?'Cleanings':'Pulizie da fare'}
          icon={<window.IconBroom size={13}/>}
          color="var(--vo-sea)"
          count={checkOuts.length}
        >
          {checkOuts.length === 0 && <EmptyMini lang={lang} text={lang==='en'?'Nothing to clean':'Niente da pulire'}/>}
          {checkOuts.map(b => {
            const lodge = window.LODGES.find(l => l.id === b.lodge) || { name: b.lodge };
            return (
              <div key={b.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bb-bg)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <window.IconBroom size={14}/>
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{lodge.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--bb-mute)' }}>
                    {b.pets ? (lang==='en'?'+ deep sanitization (pet)':'+ sanificazione (animale)') : (lang==='en'?'standard cleaning':'pulizia standard')}
                  </div>
                </div>
                <button className="bb-btn bb-btn--quiet bb-btn--sm" style={{padding:'0 8px'}}>
                  {lang==='en'?'Mark done':'Segna fatto'}
                </button>
              </div>
            );
          })}
        </OpsBlock>

        <OpsBlock
          title={lang==='en'?'Deposits to verify':'Acconti da verificare'}
          icon={<window.IconWallet size={13}/>}
          color="var(--vo-amber)"
          count={pendingDeposits.length}
          alert
        >
          {pendingDeposits.slice(0,4).map(b => (
            <button key={b.id} onClick={() => onSelectBooking(b)} style={{
              all: 'unset', cursor: 'pointer', display: 'flex',
              padding: '8px 10px', borderRadius: 8,
              background: 'rgba(201,138,58,0.08)', border: '1px solid rgba(201,138,58,0.25)',
              alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 6, height: 32, borderRadius: 3, background: 'var(--vo-amber)' }}/>
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{b.guest}</div>
                <div style={{ fontSize: 11, color: 'var(--bb-mute)' }}>
                  {(window.LODGES.find(l=>l.id===b.lodge)||{}).name||b.lodge} · {fmtDateShort(b.arrival)} → {fmtDateShort(b.departure)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="bb-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--vo-amber)' }}>{fmtEur(b.deposit - b.paid)}</div>
                <div style={{ fontSize: 10, color: 'var(--bb-mute)' }}>{lang==='en'?'pending':'in attesa'}</div>
              </div>
            </button>
          ))}
        </OpsBlock>

        <OpsBlock
          title={lang==='en'?'Upcoming check-ins':'Prossimi check-in'}
          icon={<window.IconCalendar size={13}/>}
          color="var(--vo-ocean)"
          count={upcomingCheckIns.length}
        >
          {upcomingCheckIns.slice(0,3).map(b => {
            const lodge = window.LODGES.find(l=>l.id===b.lodge) || { name: b.lodge };
            const days = Math.round((b.arrival - today)/(1000*60*60*24));
            return (
              <button key={b.id} onClick={() => onSelectBooking(b)} style={{
                all: 'unset', cursor: 'pointer', display: 'flex',
                padding: '8px 10px', borderRadius: 8, background: 'var(--bb-bg)',
                alignItems: 'center', gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{b.guest}</div>
                  <div style={{ fontSize: 11, color: 'var(--bb-mute)' }}>
                    {lodge.name} · {fmtDateShort(b.arrival)}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--vo-ocean)', background: 'rgba(0,119,190,0.10)', padding: '2px 8px', borderRadius: 999 }}>
                  {lang==='en'?'in':'fra'} {days}g
                </span>
              </button>
            );
          })}
        </OpsBlock>

        <OpsBlock
          title={lang==='en'?'Quotes to follow up':'Preventivi da seguire'}
          icon={<window.IconFile size={13}/>}
          color="var(--vo-sea)"
          count={openQuotes.length}
        >
          {openQuotes.slice(0,3).map(q => (
            <div key={q.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bb-bg)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{q.client}</div>
              <div style={{ fontSize: 11, color: 'var(--bb-mute)' }}>
                {(window.LODGES.find(l=>l.id===q.lodge)||{}).name||q.lodge} · {fmtDateShort(q.arrival)} → {fmtDateShort(q.departure)} · {fmtEurShort(q.total)}
              </div>
            </div>
          ))}
        </OpsBlock>
      </div>
    </div>
  );
};

function OpsBlock({ title, icon, color, count, alert, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', color }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bb-ink)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
          background: alert ? 'rgba(201,138,58,0.18)' : 'var(--bb-bg-2)',
          color: alert ? 'var(--vo-amber)' : 'var(--bb-mute)',
        }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{children}</div>
    </div>
  );
}

function EmptyMini({ text }) {
  return (
    <div style={{
      padding: '10px 12px', fontSize: 12, color: 'var(--bb-mute)',
      fontStyle: 'italic', textAlign: 'center',
      border: '1px dashed var(--bb-line)', borderRadius: 8,
    }}>{text}</div>
  );
}

function OpsBookingRow({ b, sub, onSelect }) {
  const lodge = window.LODGES.find(l => l.id === b.lodge) || { name: b.lodge };
  const ch = window.CHANNELS[b.channel] || window.CHANNELS.diretto;
  const meta = window.STATUS_META[b.status] || window.STATUS_META.confirmed;
  return (
    <button onClick={onSelect} style={{
      all: 'unset', cursor: 'pointer', display: 'flex',
      padding: '8px 10px', borderRadius: 8,
      background: 'rgba(0,119,190,0.05)', border: '1px solid rgba(0,119,190,0.15)',
      alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `var(--st-${meta.color}-bg)`,
        color: `var(--st-${meta.color}-fg)`,
        fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{b.guest.charAt(0)}</div>
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{b.guest}</div>
        <div style={{ fontSize: 11, color: 'var(--bb-mute)' }}>
          {lodge.name} · {ch.short} · {sub}
        </div>
      </div>
      <window.IconChevRight size={14} />
    </button>
  );
}
