// Villa Olimpia — Booking Board · Shell (Header + Sidebar + KPI strip)

const { useState, useEffect, useRef, useMemo } = React;

// ============== HEADER ==============
window.BBHeader = function BBHeader({ saveStatus, onNew, onQuote, onPrint, onExport, lang, view, setView, locale }) {
  const today = window.TODAY;
  const dateStr = today.toLocaleDateString(locale === 'en' ? 'en-GB' : 'it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px',
      background: 'var(--bb-surface)', borderBottom: '1px solid var(--bb-line)',
      position: 'sticky', top: 0, zIndex: 30, height: 68,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--vo-navy), var(--vo-ocean))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--vo-sand-light)', fontFamily: 'Playfair Display, serif',
          fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em',
          boxShadow: '0 4px 10px -3px rgba(15,59,87,0.4)',
        }}>VO</div>
        <div style={{ lineHeight: 1.15 }}>
          <div className="bb-display" style={{ fontSize: 17, fontWeight: 700 }}>
            Villa Olimpia <span style={{ fontWeight: 400, fontStyle: 'italic', color: 'var(--bb-mute)' }}>· Booking Board</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--bb-mute)', marginTop: 2 }}>
            {lang === 'en' ? 'Bookings, quotes & availability — Capo Rizzuto' : 'Prenotazioni, preventivi e disponibilità — Capo Rizzuto'}
          </div>
        </div>
      </div>

      {/* Date */}
      <div style={{
        marginLeft: 20, paddingLeft: 20, borderLeft: '1px solid var(--bb-line)',
        display: 'flex', flexDirection: 'column', lineHeight: 1.2,
      }}>
        <div style={{ fontSize: 10.5, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {lang === 'en' ? 'Today' : 'Oggi'}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--bb-ink)', textTransform: 'capitalize' }}>{dateStr}</div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Save status */}
      <SaveStatus status={saveStatus} lang={lang} />

      {/* Actions */}
      <button className="bb-btn bb-btn--ghost" onClick={onPrint}>
        <window.IconPrint size={15} /> {lang === 'en' ? 'Print' : 'Stampa'}
      </button>
      <button className="bb-btn bb-btn--ghost" onClick={onExport}>
        <window.IconDownload size={15} /> {lang === 'en' ? 'Export' : 'Esporta'}
      </button>
      <button className="bb-btn bb-btn--ghost" onClick={onQuote}>
        <window.IconFile size={15} /> {lang === 'en' ? 'New quote' : 'Nuovo preventivo'}
      </button>
      <button className="bb-btn bb-btn--primary" onClick={onNew}>
        <window.IconPlus size={15} /> {lang === 'en' ? 'New booking' : 'Nuova prenotazione'}
      </button>
    </header>
  );
};

function SaveStatus({ status, lang }) {
  const conf = {
    saved:    { icon: <window.IconCloudCheck size={14} />, label: lang==='en'?'Data saved':'Dati salvati',     color: 'var(--vo-sage-deep)', bg: 'rgba(122,155,126,0.12)' },
    saving:   { icon: <span className="bb-spin" style={{display:'inline-flex'}}><window.IconRefresh size={14}/></span>, label: lang==='en'?'Saving…':'Salvataggio…', color: 'var(--vo-ocean)', bg: 'rgba(0,119,190,0.12)' },
    unsaved:  { icon: <window.IconCloudOff size={14} />, label: lang==='en'?'Unsaved changes':'Dati non salvati', color: 'var(--vo-amber)', bg: 'rgba(201,138,58,0.15)' },
    error:    { icon: <window.IconAlert size={14} />, label: lang==='en'?'Sync error':'Errore di sincronizzazione', color: 'var(--vo-coral)', bg: 'rgba(194,96,79,0.12)' },
  };
  const c = conf[status] || conf.saved;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      background: c.bg, color: c.color,
      fontSize: 12, fontWeight: 600, marginRight: 8,
    }}>
      {c.icon} {c.label}
    </div>
  );
}

// ============== SIDEBAR ==============
window.BBSidebar = function BBSidebar({ active, onNav, collapsed, onToggle, lang }) {
  const items = [
    { id: 'dashboard', label: lang==='en'?'Dashboard':'Dashboard',       icon: window.IconLayoutDash },
    { id: 'calendar',  label: lang==='en'?'Calendar':'Calendario',       icon: window.IconCalendar, badge: 'GANTT' },
    { id: 'today',     label: lang==='en'?'Today':'Oggi',                icon: window.IconClock, hot: true },
    { id: 'bookings',  label: lang==='en'?'Bookings':'Prenotazioni',     icon: window.IconReceipt, count: 24 },
    { id: 'quotes',    label: lang==='en'?'Quotes':'Preventivi',         icon: window.IconFile, count: 6 },
    { id: 'lodges',    label: lang==='en'?'Lodges':'Lodge',              icon: window.IconHome },
    { id: 'guests',    label: lang==='en'?'Guests':'Clienti',            icon: window.IconUsers },
    { id: 'payments',  label: lang==='en'?'Payments':'Pagamenti',        icon: window.IconWallet },
    { id: 'reports',   label: lang==='en'?'Reports':'Report',            icon: window.IconChartBar },
    { id: 'export',    label: lang==='en'?'Export data':'Esporta dati',  icon: window.IconDownload },
  ];
  return (
    <aside style={{
      width: collapsed ? 72 : 230,
      flexShrink: 0,
      background: 'var(--bb-surface)',
      borderRight: '1px solid var(--bb-line)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 200ms cubic-bezier(0.25,0.25,0,1)',
      position: 'sticky', top: 68, height: 'calc(100vh - 68px)',
    }}>
      <nav style={{ padding: '14px 10px', flex: 1, overflowY: 'auto' }}>
        {!collapsed && (
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 12px 8px' }}>
            {lang==='en'?'Operations':'Operativo'}
          </div>
        )}
        {items.map(it => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => onNav(it.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                width: '100%', padding: collapsed ? '10px' : '9px 12px',
                marginBottom: 2,
                background: isActive ? 'var(--bb-bg-2)' : 'transparent',
                color: isActive ? 'var(--bb-ink)' : 'var(--bb-ink-2)',
                border: 'none', borderRadius: 8,
                fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit',
                position: 'relative',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bb-bg)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              title={collapsed ? it.label : ''}>
              {isActive && <span style={{
                position: 'absolute', left: 0, top: 6, bottom: 6, width: 3,
                background: 'var(--vo-ocean)', borderRadius: '0 3px 3px 0',
              }}/>}
              <Icon size={17} />
              {!collapsed && <span style={{ flex: 1 }}>{it.label}</span>}
              {!collapsed && it.count != null && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: isActive ? 'var(--vo-ocean)' : 'var(--bb-line)',
                  color: isActive ? 'white' : 'var(--bb-ink-2)',
                  padding: '1px 7px', borderRadius: 999,
                }}>{it.count}</span>
              )}
              {!collapsed && it.hot && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--vo-coral)',
                  boxShadow: '0 0 0 3px rgba(194,96,79,0.18)',
                }}/>
              )}
              {!collapsed && it.badge && (
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--vo-gold-deep)',
                  border: '1px solid var(--vo-gold)', padding: '1px 4px', borderRadius: 4, letterSpacing: '0.05em' }}>{it.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid var(--bb-line)', padding: 10 }}>
        <button onClick={() => onNav('settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 11,
            width: '100%', padding: collapsed ? '10px' : '9px 12px',
            background: 'transparent', color: 'var(--bb-ink-2)',
            border: 'none', borderRadius: 8, fontSize: 13.5,
            cursor: 'pointer', fontFamily: 'inherit',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
          <window.IconSettings size={17} />
          {!collapsed && <span>{lang==='en'?'Settings':'Impostazioni'}</span>}
        </button>

        {!collapsed && (
          <div style={{
            marginTop: 10, padding: 10, borderRadius: 10,
            background: 'var(--bb-bg-2)', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--vo-gold), var(--vo-gold-deep))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#3d2810', fontWeight: 700, fontSize: 12,
            }}>FN</div>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--bb-ink)' }}>Francesco Nigro</div>
              <div style={{ fontSize: 10.5, color: 'var(--bb-mute)' }}>Property manager</div>
            </div>
          </div>
        )}

        <button onClick={onToggle} style={{
          marginTop: 8, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '6px', background: 'transparent', border: '1px dashed var(--bb-line)',
          borderRadius: 6, color: 'var(--bb-mute)', fontSize: 11.5, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          {collapsed ? <window.IconChevRight size={13} /> : <><window.IconChevLeft size={13} /> {lang==='en'?'Collapse':'Comprimi'}</>}
        </button>
      </div>
    </aside>
  );
};

// ============== KPI STRIP ==============
window.BBKpiStrip = function BBKpiStrip({ lang }) {
  const bookings = window.BOOKINGS;
  const today = window.TODAY;
  const cm = window.CURRENT_MONTH; // { year, month } — month 0-indexed
  const monthStart = new Date(cm.year, cm.month, 1);
  const monthEnd   = new Date(cm.year, cm.month + 1, 0); // ultimo giorno del mese
  const daysInViewMonth = monthEnd.getDate();
  const monthName = monthStart.toLocaleDateString('it-IT', { month: 'long' });

  const active = bookings.filter(b => b.status !== 'cancelled' && b.departure > today).length;
  const checkInsNext = bookings.filter(b => {
    const diff = (b.arrival - today) / (1000*60*60*24);
    return diff >= 0 && diff <= 3 && b.status !== 'cancelled';
  }).length;
  const checkOutsToday = bookings.filter(b => sameDay(b.departure, today) && b.status !== 'cancelled').length;
  const occupiedNights = bookings.filter(b => b.status !== 'cancelled').reduce((acc, b) => {
    const start = b.arrival < monthStart ? monthStart : b.arrival;
    const end   = b.departure > monthEnd ? monthEnd : b.departure;
    return acc + Math.max(0, daysBetween(start, end));
  }, 0);
  const totalNights = 9 * daysInViewMonth;
  const occupancyPct = Math.round(occupiedNights / totalNights * 100);
  const revenue = bookings.filter(b => b.status !== 'cancelled' && b.arrival instanceof Date &&
    b.arrival.getMonth() === cm.month && b.arrival.getFullYear() === cm.year)
    .reduce((a, b) => a + (b.total || 0), 0);
  const depositsToCollect = bookings.filter(b => b.status === 'pending' || b.status === 'option')
    .reduce((a, b) => a + (b.deposit - b.paid), 0);
  const openQuotes = window.QUOTES.filter(q => q.status === 'sent' || q.status === 'draft').length;
  const cancellations = bookings.filter(b => b.status === 'cancelled').length;

  const kpis = [
    { label: lang==='en'?'Active bookings':'Prenotazioni attive', value: active, sub: lang==='en'?'in season':'in stagione', icon: window.IconReceipt, accent: 'navy' },
    { label: lang==='en'?'Upcoming check-ins':'Check-in prossimi', value: checkInsNext, sub: lang==='en'?'within 72h':'entro 72h', icon: window.IconLogIn, accent: 'sage', hot: checkInsNext > 0 },
    { label: lang==='en'?'Check-outs today':'Check-out oggi', value: checkOutsToday, sub: lang==='en'?'cleaning ops':'pulizie da fare', icon: window.IconLogOut, accent: 'amber' },
    { label: lang==='en'?`${monthName} occupancy`:`Occupazione ${monthName}`, value: occupancyPct + '%', sub: `${occupiedNights}/${totalNights} ${lang==='en'?'nights':'notti'}`, icon: window.IconTrend, accent: 'ocean', bar: occupancyPct },
    { label: lang==='en'?`Revenue (${monthName})`:`Revenue · ${monthName}`, value: fmtEurShort(revenue), sub: lang==='en'?'before commissions':'al lordo commissioni', icon: window.IconEuro, accent: 'gold' },
    { label: lang==='en'?'Deposits to collect':'Acconti da incassare', value: fmtEurShort(depositsToCollect), sub: `${bookings.filter(b => b.status==='pending'||b.status==='option').length} ${lang==='en'?'bookings':'prenot.'}`, icon: window.IconWallet, accent: 'amber', alert: depositsToCollect > 0 },
    { label: lang==='en'?'Open quotes':'Preventivi aperti', value: openQuotes, sub: lang==='en'?'awaiting follow-up':'da seguire', icon: window.IconFile, accent: 'sea' },
    { label: lang==='en'?'Cancellations':'Cancellazioni', value: cancellations, sub: lang==='en'?'this month':'questo mese', icon: window.IconAlert, accent: 'coral' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
      {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
    </div>
  );
};

function KpiCard({ label, value, sub, icon: Icon, accent, hot, alert, bar }) {
  const accents = {
    navy:  { c: 'var(--vo-navy)',     bg: 'rgba(15,59,87,0.06)' },
    sage:  { c: 'var(--vo-sage-deep)',bg: 'rgba(122,155,126,0.12)' },
    amber: { c: 'var(--vo-amber)',    bg: 'rgba(201,138,58,0.12)' },
    ocean: { c: 'var(--vo-ocean)',    bg: 'rgba(0,119,190,0.10)' },
    gold:  { c: 'var(--vo-gold-deep)',bg: 'rgba(201,164,92,0.15)' },
    sea:   { c: 'var(--vo-sea)',      bg: 'rgba(75,163,199,0.12)' },
    coral: { c: 'var(--vo-coral)',    bg: 'rgba(194,96,79,0.10)' },
  };
  const a = accents[accent] || accents.navy;
  return (
    <div className="bb-card" style={{ padding: 14, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: a.bg, color: a.c,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon size={15} /></div>
        {hot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--vo-sage-deep)' }}/>}
        {alert && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--vo-amber)' }}/>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
        {label}
      </div>
      <div className="bb-num" style={{ fontSize: 26, fontWeight: 700, color: 'var(--bb-ink)', letterSpacing: '-0.02em', lineHeight: 1.05, fontFamily: 'Playfair Display, serif' }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--bb-mute)', marginTop: 3 }}>{sub}</div>
      {bar != null && (
        <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--bb-bg-2)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${bar}%`, background: a.c, borderRadius: 2 }}/>
        </div>
      )}
    </div>
  );
}
