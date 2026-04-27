// Villa Olimpia — Booking Board v2 · Premium widgets
// Exercises the v2 tokens: Revenue Opportunities, Smart Follow-up,
// Weather, Flights, Owner Snapshot, Button states gallery.

const { useState: useStateV2, useMemo: useMemoV2 } = React;

// ============== REVENUE OPPORTUNITIES ==============
window.V2RevenueOpp = function V2RevenueOpp({ lang, onAction }) {
  const opps = [
    { kind: 'gap',   lodge: 'Tulipano',   when: '18→23 lug', nights: 5, value: 900,  severity: 'hot',  reason: lang==='en'?'5-night gap, peak season':'Buco 5 notti, alta stagione' },
    { kind: 'gap',   lodge: 'Gardenia',   when: '21→26 lug', nights: 5, value: 975,  severity: 'hot',  reason: lang==='en'?'Direct competitor visible on Booking':'Concorrenza visibile su Booking' },
    { kind: 'upsell',lodge: 'Geranio',    when: '18 lug→1 ago', nights: 14, value: 280, severity: 'warn', reason: lang==='en'?'Premium guest · suggest welcome basket':'Ospite premium · proporre welcome basket' },
    { kind: 'price', lodge: 'Frangipane', when: '25 lug→1 ago', nights: 7, value: 140, severity: 'info', reason: lang==='en'?'Rate could be +€20/night vs market':'Tariffa +€20/notte vs mercato' },
    { kind: 'gap',   lodge: 'Azalea',     when: '20→27 lug', nights: 7, value: 1400, severity: 'warn', reason: lang==='en'?'Cancellation hole · push WhatsApp list':'Buco da cancellazione · spingi su lista WhatsApp' },
  ];
  const total = opps.reduce((s, o) => s + o.value, 0);

  return (
    <div className="v2-widget">
      <div className="v2-widget__head">
        <div className="v2-widget__head-icon" style={{ background: 'rgba(201,164,92,0.15)', color: 'var(--vo-gold-deep)' }}>
          <window.IconSparkles size={16}/>
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="v2-widget__title">{lang==='en'?'Revenue opportunities':'Opportunità di vendita'}</h3>
          <div className="v2-widget__sub">{lang==='en'?'Sellable nights, upsells, price tweaks':'Notti vendibili, upsell, ritocchi tariffa'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="bb-num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--vo-gold-deep)', fontFamily: 'Playfair Display, serif' }}>{fmtEurShort(total)}</div>
          <div style={{ fontSize: 10.5, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            {lang==='en'?'potential':'potenziale'}
          </div>
        </div>
      </div>
      <div className="v2-widget__body" style={{ padding: '6px 8px' }}>
        {opps.map((o, i) => (
          <div key={i} className="v2-li">
            <span className={`v2-dot v2-dot--${o.severity === 'hot' ? 'hot' : o.severity === 'warn' ? 'warn' : 'info'}`}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="v2-li__title">
                {o.lodge} <span style={{ color: 'var(--bb-mute)', fontWeight: 500 }}>· {o.when} · {o.nights} {lang==='en'?'nights':'notti'}</span>
              </div>
              <div className="v2-li__sub">{o.reason}</div>
            </div>
            <div className="v2-li__amount">{fmtEur(o.value)}</div>
            <button className="bb-btn bb-btn--gold bb-btn--sm" onClick={() => onAction && onAction(o)}>
              {o.kind === 'gap' ? (lang==='en'?'Push':'Spingi') : o.kind === 'upsell' ? 'Upsell' : (lang==='en'?'Adjust':'Ritocca')}
            </button>
          </div>
        ))}
      </div>
      <div className="v2-widget__foot">
        <window.IconCheckCircle size={13} style={{ color: 'var(--vo-sage-deep)' }}/>
        <span style={{ color: 'var(--bb-mute)' }}>
          {lang==='en'?'Updated 2 minutes ago':'Aggiornato 2 minuti fa'}
        </span>
        <span style={{ flex: 1 }}/>
        <button className="bb-btn bb-btn--quiet bb-btn--sm">{lang==='en'?'See all':'Vedi tutto'} <window.IconChevRight size={12}/></button>
      </div>
    </div>
  );
};

// ============== SMART FOLLOW-UP ==============
window.V2SmartFollowup = function V2SmartFollowup({ lang }) {
  const [done, setDone] = useStateV2(new Set());

  const items = [
    { id: 'f1', kind: 'deposit', who: 'Famiglia Pellegrino',  what: lang==='en'?'Awaiting deposit · €414':'Acconto in attesa · €414', meta: lang==='en'?'Due 30 Jun':'Scadenza 30 giu', sev: 'hot',  channel: 'WhatsApp' },
    { id: 'f2', kind: 'option',  who: 'Famiglia De Luca',     what: lang==='en'?'Option expires today':'Opzione scade oggi',     meta: '€2.000 · 10nt', sev: 'hot',  channel: 'Telefono' },
    { id: 'f3', kind: 'quote',   who: 'Hoffmann, Ursula',     what: lang==='en'?'Quote sent 5 days ago':'Preventivo inviato da 5gg', meta: '€4.900 · Geranio', sev: 'warn', channel: 'Email' },
    { id: 'f4', kind: 'deposit', who: 'Wagner, Hans',         what: lang==='en'?'Reminder #2 needed':'Sollecito #2 necessario',    meta: '€378 · 11→18 lug', sev: 'warn', channel: 'Airbnb' },
    { id: 'f5', kind: 'review',  who: 'Famiglia Marchetti',   what: lang==='en'?'Ask for review (post check-out)':'Chiedi recensione (post check-out)', meta: lang==='en'?'Today':'Oggi', sev: 'info', channel: 'WhatsApp' },
    { id: 'f6', kind: 'quote',   who: 'Dubois, Henri',        what: lang==='en'?'Follow up on quote':'Richiama per preventivo', meta: '€1.260 · Fiordaliso', sev: 'info', channel: 'Email' },
  ];
  const remaining = items.filter(i => !done.has(i.id)).length;

  const toggle = (id) => {
    setDone(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="v2-widget">
      <div className="v2-widget__head">
        <div className="v2-widget__head-icon" style={{ background: 'rgba(0,119,190,0.10)', color: 'var(--vo-ocean)' }}>
          <window.IconBell size={16}/>
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="v2-widget__title">{lang==='en'?'Smart follow-up':'Da seguire oggi'}</h3>
          <div className="v2-widget__sub">{lang==='en'?'Auto-prioritized actions':'Azioni auto-prioritizzate'}</div>
        </div>
        <div className="bb-badge bb-badge--neutral">{remaining} {lang==='en'?'open':'aperte'}</div>
      </div>
      <div className="v2-widget__body" style={{ padding: '6px 8px', maxHeight: 320, overflowY: 'auto' }}>
        {items.map(it => {
          const isDone = done.has(it.id);
          return (
            <div key={it.id} className="v2-li" style={{ opacity: isDone ? 0.5 : 1 }}>
              <button
                onClick={() => toggle(it.id)}
                style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: '1.5px solid ' + (isDone ? 'var(--vo-sage-deep)' : 'var(--bb-line-strong)'),
                  background: isDone ? 'var(--vo-sage-deep)' : 'transparent',
                  color: 'white',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >{isDone && <window.IconCheck size={11}/>}</button>
              <span className={`v2-dot v2-dot--${it.sev === 'hot' ? 'hot' : it.sev === 'warn' ? 'warn' : 'info'}`}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="v2-li__title" style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{it.who}</div>
                <div className="v2-li__sub">{it.what} <span style={{ color: 'var(--bb-mute)' }}>· {it.meta}</span></div>
              </div>
              <span className="bb-badge bb-badge--neutral">{it.channel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============== WEATHER ==============
window.V2Weather = function V2Weather({ lang }) {
  const days = [
    { d: lang==='en'?'Wed':'Mer', t: 30, icon: '☀' },
    { d: lang==='en'?'Thu':'Gio', t: 31, icon: '☀' },
    { d: lang==='en'?'Fri':'Ven', t: 29, icon: '⛅' },
    { d: lang==='en'?'Sat':'Sab', t: 28, icon: '⛅' },
    { d: lang==='en'?'Sun':'Dom', t: 32, icon: '☀' },
  ];
  return (
    <div className="v2-widget">
      <div className="v2-widget__head">
        <div className="v2-widget__head-icon" style={{ background: 'rgba(75,163,199,0.15)', color: 'var(--vo-sea)' }}>
          <window.IconCloud size={16}/>
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="v2-widget__title">{lang==='en'?'Weather · Capo Rizzuto':'Meteo · Capo Rizzuto'}</h3>
          <div className="v2-widget__sub">{lang==='en'?'Useful for guest comms & ops':'Utile per comunicazioni e operatività'}</div>
        </div>
        <span className="bb-badge bb-badge--neutral">{lang==='en'?'live':'live'}</span>
      </div>
      <div className="v2-widget__body">
        <div className="v2-weather">
          <div>
            <div className="v2-weather__big">29<sup>°C</sup></div>
            <div className="v2-weather__cond">{lang==='en'?'Sunny · light breeze':'Sereno · brezza leggera'}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--bb-mute)', lineHeight: 1.6 }}>
            <div>{lang==='en'?'Wind':'Vento'} · 12 km/h NE</div>
            <div>{lang==='en'?'Sea':'Mare'} · 24°C · {lang==='en'?'calm':'calmo'}</div>
            <div>UV · 8 · {lang==='en'?'high':'alto'}</div>
          </div>
        </div>
        <div className="v2-weather__forecast">
          {days.map((day, i) => (
            <div key={i} className="v2-weather__day">
              <div className="v2-weather__day-label">{day.d}</div>
              <div style={{ fontSize: 18, lineHeight: 1.2 }}>{day.icon}</div>
              <div className="v2-weather__day-temp">{day.t}°</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============== FLIGHTS / ARRIVALS ==============
window.V2Flights = function V2Flights({ lang }) {
  const flights = [
    { time: '14:35', code: 'FR3214', from: 'Bergamo BGY',   guests: 'Famiglia Hartmann', lodge: 'Orchidea',  status: 'on-time',  delay: 0 },
    { time: '15:50', code: 'AZ1763', from: 'Roma FCO',      guests: 'Anderson, James',   lodge: 'Geranio',    status: 'delayed',  delay: 25 },
    { time: '16:20', code: 'FR8842', from: 'London STN',    guests: 'Anderson, J. (party)', lodge: 'Geranio', status: 'on-time',  delay: 0 },
    { time: '18:05', code: 'EZS5512',from: 'Berlin BER',    guests: 'Wagner, Hans',      lodge: 'Tulipano',   status: 'on-time',  delay: 0 },
    { time: '21:40', code: 'LH2418', from: 'Munich MUC',    guests: 'Schmidt, K.',       lodge: 'Frangipane', status: 'on-time',  delay: 0 },
  ];
  return (
    <div className="v2-widget">
      <div className="v2-widget__head">
        <div className="v2-widget__head-icon" style={{ background: 'rgba(15,59,87,0.08)', color: 'var(--vo-navy)' }}>
          <window.IconMapPin size={16}/>
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="v2-widget__title">{lang==='en'?'KR airport · today':'Aeroporto KR · oggi'}</h3>
          <div className="v2-widget__sub">{lang==='en'?'Inbound guests, transfers, late check-ins':'Arrivi ospiti, transfer, check-in serali'}</div>
        </div>
        <span className="bb-badge bb-badge--quote">{flights.length} {lang==='en'?'arrivals':'arrivi'}</span>
      </div>
      <div className="v2-widget__body" style={{ padding: 0 }}>
        <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
          <tbody>
            {flights.map((f, i) => (
              <tr key={i} style={{ borderBottom: i < flights.length - 1 ? '1px solid var(--bb-line-soft)' : 'none' }}>
                <td className="bb-num" style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--bb-ink)', whiteSpace: 'nowrap', width: 60 }}>{f.time}</td>
                <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--bb-mute)' }}>{f.code}</span>
                </td>
                <td style={{ padding: '10px 8px', color: 'var(--bb-mute)', whiteSpace: 'nowrap' }}>{f.from}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{f.guests}</td>
                <td style={{ padding: '10px 8px', color: 'var(--bb-ink-2)', whiteSpace: 'nowrap' }}>→ {f.lodge}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  {f.status === 'delayed'
                    ? <span className="bb-badge bb-badge--pending">+{f.delay}'</span>
                    : <span className="bb-badge bb-badge--confirmed">{lang==='en'?'on time':'in orario'}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="v2-widget__foot">
        <window.IconClock size={13} style={{ color: 'var(--bb-mute)' }}/>
        <span style={{ color: 'var(--bb-mute)' }}>
          {lang==='en'?'Synced 30s ago · auto-refresh every 5min':'Sincronizzato 30s fa · refresh ogni 5min'}
        </span>
      </div>
    </div>
  );
};

// ============== OWNER SNAPSHOT ==============
window.V2OwnerSnapshot = function V2OwnerSnapshot({ lang }) {
  const months = [
    { m: 'Mag', occ: 38, rev: 12400 },
    { m: 'Giu', occ: 67, rev: 31200 },
    { m: 'Lug', occ: 84, rev: 58900 },
    { m: 'Ago', occ: 92, rev: 71400 },
    { m: 'Set', occ: 58, rev: 24800 },
  ];
  const max = Math.max(...months.map(m => m.rev));

  return (
    <div className="v2-widget">
      <div className="v2-widget__head">
        <div className="v2-widget__head-icon" style={{ background: 'rgba(122,155,126,0.15)', color: 'var(--vo-sage-deep)' }}>
          <window.IconChartBar size={16}/>
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="v2-widget__title">{lang==='en'?'Owner snapshot · season':'Riepilogo proprietario · stagione'}</h3>
          <div className="v2-widget__sub">{lang==='en'?'Occupancy & revenue trend':'Andamento occupazione e ricavi'}</div>
        </div>
        <button className="bb-btn bb-btn--ghost bb-btn--sm">
          <window.IconDownload size={13}/> PDF
        </button>
      </div>
      <div className="v2-widget__body">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 130, padding: '0 4px' }}>
          {months.map((m, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div className="bb-num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--bb-ink)' }}>{fmtEurShort(m.rev)}</div>
              <div style={{
                width: '100%',
                height: `${(m.rev / max) * 100}%`,
                background: m.m === 'Lug' ? 'linear-gradient(180deg, var(--vo-ocean), var(--vo-navy))' : 'linear-gradient(180deg, var(--vo-sea), var(--vo-sea-700, #2f7a96))',
                borderRadius: '4px 4px 0 0',
                position: 'relative',
                boxShadow: m.m === 'Lug' ? '0 -3px 0 var(--vo-gold) inset' : 'none',
              }}>
                <div style={{
                  position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                }}>{m.occ}%</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--bb-mute)', fontWeight: 600 }}>{m.m}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--bb-line-soft)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{lang==='en'?'Net revenue YTD':'Ricavo netto YTD'}</div>
            <div className="bb-num" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--bb-ink)' }}>€198.700</div>
            <div style={{ fontSize: 11, color: 'var(--vo-sage-deep)', fontWeight: 600 }}>↑ 14% vs 2025</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>RevPAR</div>
            <div className="bb-num" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--bb-ink)' }}>€164</div>
            <div style={{ fontSize: 11, color: 'var(--vo-sage-deep)', fontWeight: 600 }}>↑ 8% vs 2025</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{lang==='en'?'Direct share':'Quota diretti'}</div>
            <div className="bb-num" style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Playfair Display, serif', color: 'var(--bb-ink)' }}>54%</div>
            <div style={{ fontSize: 11, color: 'var(--vo-sage-deep)', fontWeight: 600 }}>↑ 6 pt vs 2025</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== BUTTON STATES GALLERY ==============
window.V2ButtonStates = function V2ButtonStates({ lang }) {
  const variants = [
    { name: 'Primary',   cls: 'bb-btn--primary' },
    { name: 'Gold',      cls: 'bb-btn--gold' },
    { name: 'Ghost',     cls: 'bb-btn--ghost' },
    { name: 'Quiet',     cls: 'bb-btn--quiet' },
    { name: 'Danger',    cls: 'bb-btn--danger' },
  ];
  const states = [
    { name: lang==='en'?'Default':'Normale',    extra: '' },
    { name: 'Hover',                            extra: ' is-hover',  styleHack: { transform: 'translateY(-1px)', filter: 'brightness(0.97)' } },
    { name: 'Active',                           extra: '',           styleHack: { transform: 'translateY(0)', filter: 'brightness(0.92)' } },
    { name: 'Focus',                            extra: '',           styleHack: { boxShadow: '0 0 0 3px rgba(0, 119, 190, 0.22)' } },
    { name: 'Disabled',                         extra: ' bb-btn--disabled' },
    { name: 'Loading',                          extra: ' bb-btn--loading' },
    { name: 'Error',                            extra: ' bb-btn--error' },
    { name: 'Success',                          extra: ' bb-btn--success' },
    { name: 'In dev',                           extra: ' bb-btn--indev' },
  ];
  return (
    <div className="v2-widget">
      <div className="v2-widget__head">
        <div className="v2-widget__head-icon" style={{ background: 'rgba(15,59,87,0.08)', color: 'var(--vo-navy)' }}>
          <window.IconLayers size={16}/>
        </div>
        <div style={{ flex: 1 }}>
          <h3 className="v2-widget__title">{lang==='en'?'Button states · handoff reference':'Stati bottoni · riferimento handoff'}</h3>
          <div className="v2-widget__sub">{lang==='en'?'Every variant × every state. Frontend can copy classes 1:1.':'Ogni variante × ogni stato. Il frontend copia le classi 1:1.'}</div>
        </div>
      </div>
      <div className="v2-widget__body" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: 10.5, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, padding: '0 8px' }}></th>
              {states.map(s => (
                <th key={s.name} style={{ textAlign: 'left', fontSize: 10, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, padding: '0 8px' }}>{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map(v => (
              <tr key={v.name}>
                <td style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--bb-ink-2)', padding: '0 8px', whiteSpace: 'nowrap' }}>{v.name}</td>
                {states.map(s => (
                  <td key={s.name} style={{ padding: '0 6px' }}>
                    <button className={`bb-btn ${v.cls}${s.extra}`} style={{ ...s.styleHack, height: 32, padding: '0 12px', fontSize: 12 }}>
                      {s.name === 'Loading' ? '...' : 'Salva'}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="v2-widget__foot">
        <window.IconHelp size={13} style={{ color: 'var(--bb-mute)' }}/>
        <span style={{ color: 'var(--bb-mute)' }}>
          {lang==='en'?'Class names map directly to Tailwind variants in the handoff doc.':'I nomi classe corrispondono alle varianti Tailwind nel doc di handoff.'}
        </span>
      </div>
    </div>
  );
};

// ============== DASHBOARD V2 (richer composition) ==============
window.V2Dashboard = function V2Dashboard({ lang, onAction }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <window.V2RevenueOpp lang={lang} onAction={onAction}/>
        <window.V2OwnerSnapshot lang={lang}/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <window.V2SmartFollowup lang={lang}/>
        <window.V2Weather lang={lang}/>
        <window.V2Flights lang={lang}/>
      </div>
    </div>
  );
};
