// Villa Olimpia — Booking Board · Gantt Calendar (the priority screen)

const { useState: useStateG, useMemo: useMemoG, useRef: useRefG, useEffect: useEffectG } = React;

window.BBGantt = function BBGantt({ view = 'month', onSelectBooking, onSelectGap, lang, monthOffset = 0 }) {
  // Base month from CURRENT_MONTH (default: luglio 2026). Navigazione ±offset.
  const baseY = window.CURRENT_MONTH.year, baseM = window.CURRENT_MONTH.month;
  const targetM = baseM + monthOffset;
  const year = baseY + Math.floor(targetM / 12);
  const month = ((targetM % 12) + 12) % 12;

  const today = window.TODAY;
  const lodges = window.LODGES;

  // Determine column count based on view
  let cols, startDate;
  if (view === 'week') {
    // 7 days starting from today's monday-ish (we anchor to today for simplicity)
    cols = 7;
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    startDate.setDate(startDate.getDate() - 3); // 3 days before, 4 days after
  } else if (view === 'fortnight') {
    cols = 14;
    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    startDate.setDate(startDate.getDate() - 4);
  } else {
    cols = daysInMonth(year, month);
    startDate = new Date(year, month, 1);
  }

  const days = [];
  for (let i = 0; i < cols; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }

  // Compute bookings per lodge with column positions
  const bookingsByLodge = useMemoG(() => {
    const map = {};
    lodges.forEach(l => map[l.id] = []);
    window.BOOKINGS.forEach(b => {
      // intersect with visible range
      const rangeStart = days[0];
      const rangeEnd = days[days.length - 1];
      const rangeEndExcl = new Date(rangeEnd); rangeEndExcl.setDate(rangeEndExcl.getDate()+1);
      if (b.departure <= rangeStart || b.arrival >= rangeEndExcl) return;
      const startCol = Math.max(0, daysBetween(rangeStart, b.arrival));
      const endCol = Math.min(cols, daysBetween(rangeStart, b.departure));
      map[b.lodge].push({ ...b, startCol, endCol, span: endCol - startCol });
    });
    return map;
  }, [view, cols, monthOffset]);

  const lodgeColW = 168;
  const monthLabel = startDate.toLocaleDateString(lang==='en'?'en-GB':'it-IT', { month: 'long', year: 'numeric' });

  return (
    <div className="bb-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Day-of-week / day-number header */}
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--bb-line)', background: 'var(--bb-surface-2)', position: 'sticky', top: 0, zIndex: 4 }}>
        <div style={{
          width: lodgeColW, padding: '10px 16px',
          borderRight: '1px solid var(--bb-line)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div className="bb-display" style={{ fontSize: 15, textTransform: 'capitalize' }}>{monthLabel}</div>
          <div style={{ fontSize: 10.5, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {view === 'month' ? `${cols} ${lang==='en'?'days':'giorni'}` : view === 'fortnight' ? (lang==='en'?'2 weeks':'2 settimane') : (lang==='en'?'Week':'Settimana')}
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1 }}>
          {days.map((d, i) => {
            const isToday = sameDay(d, today);
            const we = isWeekend(d);
            return (
              <div key={i} style={{
                flex: 1, minWidth: 'var(--cal-col-w)', maxWidth: view === 'month' ? 'none' : 90,
                padding: '6px 0', textAlign: 'center',
                borderRight: i < cols-1 ? '1px solid var(--bb-line-soft)' : 'none',
                background: isToday ? 'rgba(0,119,190,0.08)' : (we ? 'rgba(201,164,92,0.06)' : 'transparent'),
                position: 'relative',
              }}>
                <div style={{ fontSize: 9.5, color: isToday ? 'var(--vo-ocean)' : 'var(--bb-mute)', fontWeight: isToday ? 700 : 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {fmtDow(d).slice(0,3)}
                </div>
                <div className="bb-num" style={{ fontSize: 13, fontWeight: isToday ? 700 : 600, color: isToday ? 'var(--vo-ocean)' : 'var(--bb-ink)', marginTop: 1 }}>
                  {d.getDate()}
                </div>
                {isToday && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 18, height: 2, borderRadius: 2, background: 'var(--vo-ocean)' }}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lodge rows */}
      <div style={{ position: 'relative' }}>
        {lodges.map((lodge, idx) => (
          <GanttRow
            key={lodge.id}
            lodge={lodge}
            days={days}
            today={today}
            bookings={bookingsByLodge[lodge.id]}
            cols={cols}
            lodgeColW={lodgeColW}
            view={view}
            onSelectBooking={onSelectBooking}
            onSelectGap={onSelectGap}
            lang={lang}
          />
        ))}
      </div>

      {/* Footer legend (sticky) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 16px', borderTop: '1px solid var(--bb-line)',
        background: 'var(--bb-surface-2)', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--bb-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {lang==='en'?'Legend':'Legenda'}
        </span>
        <LegendDot color="var(--st-paid-bar)" label={lang==='en'?'Paid':'Pagata'} />
        <LegendDot color="var(--st-confirmed-bar)" label={lang==='en'?'Confirmed':'Confermata'} />
        <LegendDot color="var(--st-pending-bar)" label={lang==='en'?'Awaiting deposit':'In attesa acconto'} />
        <LegendDot color="var(--st-option-bar)" label={lang==='en'?'Option':'Opzionata'} />
        <LegendDot color="var(--st-quote-bar)" label={lang==='en'?'Quote sent':'Preventivo'} />
        <LegendDot color="var(--st-cancelled-bar)" label={lang==='en'?'Cancelled':'Cancellata'} striped />
        <span style={{ flex: 1 }}/>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--bb-mute)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(0,119,190,0.18)', border: '1px solid var(--vo-ocean)' }}/>
          {lang==='en'?'Today':'Oggi'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--bb-mute)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(201,164,92,0.15)' }}/>
          {lang==='en'?'Weekend':'Weekend'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--bb-mute)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'repeating-linear-gradient(45deg, var(--vo-sage) 0 3px, transparent 3px 6px)' }}/>
          {lang==='en'?'Period free to sell':'Periodo libero da vendere'}
        </span>
      </div>
    </div>
  );
};

function LegendDot({ color, label, striped }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--bb-ink-2)' }}>
      <span style={{
        width: 14, height: 8, borderRadius: 3,
        background: striped ? `repeating-linear-gradient(-45deg, ${color} 0 4px, rgba(255,255,255,0.4) 4px 7px)` : color
      }}/>
      {label}
    </span>
  );
}

function GanttRow({ lodge, days, today, bookings, cols, lodgeColW, view, onSelectBooking, onSelectGap, lang }) {
  // build "free" segments between bookings to show "buchi da vendere"
  const sortedB = [...(bookings || [])].sort((a, b) => a.startCol - b.startCol)
    .filter(b => b.status !== 'cancelled');
  const gaps = [];
  let cursor = 0;
  for (const b of sortedB) {
    if (b.startCol > cursor) gaps.push({ start: cursor, end: b.startCol });
    cursor = Math.max(cursor, b.endCol);
  }
  if (cursor < cols) gaps.push({ start: cursor, end: cols });

  // Show only meaningful gaps (>= 2 days for month view)
  const minGap = view === 'month' ? 2 : 1;
  const sellableGaps = gaps.filter(g => g.end - g.start >= minGap);

  const cancelledB = (bookings || []).filter(b => b.status === 'cancelled');

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderBottom: '1px solid var(--bb-line-soft)',
      background: lodge.premium ? 'linear-gradient(90deg, rgba(201,164,92,0.05), transparent 30%)' : 'transparent',
      position: 'relative',
      minHeight: 'calc(var(--cal-row-h) + 8px)',
    }}>
      {/* Lodge label */}
      <div style={{
        width: lodgeColW, padding: '10px 14px',
        borderRight: '1px solid var(--bb-line)',
        display: 'flex', alignItems: 'center', gap: 10,
        position: 'sticky', left: 0, background: 'var(--bb-surface)', zIndex: 2,
        boxShadow: lodge.premium ? 'inset 3px 0 0 var(--vo-gold)' : 'none',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: getLodgeStatusColor(lodge, today),
        }}/>
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--bb-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {lodge.name}
            {lodge.premium && <span className="bb-badge bb-badge--premium" style={{ fontSize: 9, padding: '1px 6px' }}>★ Premium</span>}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--bb-mute)' }}>{lodge.floor} · {lodge.capacity}p · {lodge.sqm}mq</div>
        </div>
      </div>

      {/* Track */}
      <div style={{
        flex: 1, position: 'relative',
        display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
        background: 'var(--bb-surface)',
      }}>
        {/* Day grid background */}
        {days.map((d, i) => {
          const isToday = sameDay(d, today);
          const we = isWeekend(d);
          return (
            <div key={i} style={{
              borderRight: i < cols - 1 ? '1px solid var(--bb-line-soft)' : 'none',
              background: isToday ? 'rgba(0,119,190,0.05)' : (we ? 'rgba(201,164,92,0.04)' : 'transparent'),
            }}/>
          );
        })}

        {/* Gaps (buchi da vendere) — placed below bars */}
        {sellableGaps.map((g, i) => (
          <button key={'g'+i}
            onClick={() => onSelectGap && onSelectGap({ lodge: lodge.id, start: days[g.start], end: days[Math.min(g.end, days.length)-1], days: g.end - g.start })}
            style={{
              position: 'absolute',
              left: `calc(${(g.start/cols)*100}% + 3px)`,
              width: `calc(${((g.end - g.start)/cols)*100}% - 6px)`,
              top: '50%', transform: 'translateY(-50%)',
              height: 'var(--cal-bar-h)',
              border: '1.5px dashed var(--bb-line-strong)',
              borderRadius: 'var(--cal-bar-r)',
              background: 'repeating-linear-gradient(45deg, transparent 0 3px, rgba(122,155,126,0.06) 3px 6px)',
              color: 'var(--vo-sage-deep)',
              fontSize: 10.5, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontFamily: 'inherit',
              zIndex: 1,
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(122,155,126,0.12)';
              e.currentTarget.style.borderColor = 'var(--vo-sage-deep)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'repeating-linear-gradient(45deg, transparent 0 3px, rgba(122,155,126,0.06) 3px 6px)';
              e.currentTarget.style.borderColor = 'var(--bb-line-strong)';
            }}
            title={`${g.end - g.start} ${lang==='en'?'nights free':'notti libere'} · ${lang==='en'?'click to create':'click per creare'}`}>
            {(g.end - g.start) >= 4 && <span>+ {g.end - g.start} {lang==='en'?'free':'libere'}</span>}
          </button>
        ))}

        {/* Bookings (active) */}
        {sortedB.map(b => <GanttBar key={b.id} b={b} cols={cols} today={today} days={days} onSelect={onSelectBooking} lang={lang}/>)}

        {/* Cancelled overlays */}
        {cancelledB.map(b => <GanttBar key={b.id} b={b} cols={cols} today={today} days={days} onSelect={onSelectBooking} lang={lang}/>)}
      </div>
    </div>
  );
}

function getLodgeStatusColor(lodge, today) {
  const ongoing = window.BOOKINGS.find(b =>
    b.lodge === lodge.id && b.status !== 'cancelled' &&
    b.arrival <= today && b.departure > today
  );
  if (ongoing) return 'var(--vo-coral)'; // occupied
  return 'var(--vo-sage-deep)'; // free
}

function GanttBar({ b, cols, today, days, onSelect, lang }) {
  const lodge = window.LODGES.find(l => l.id === b.lodge) || { name: b.lodge, premium: false };
  const ch = window.CHANNELS[b.channel] || window.CHANNELS.diretto;
  const status = b.status;
  const isCheckInToday = sameDay(b.arrival, today);
  const isCheckOutToday = sameDay(b.departure, today);
  const left = (b.startCol / cols) * 100;
  const width = (b.span / cols) * 100;

  const showAmount = b.span >= 3;
  const showFull = b.span >= 4;

  return (
    <div
      onClick={() => onSelect && onSelect(b)}
      className={`bb-bar bb-bar--${status}`}
      style={{
        position: 'absolute',
        left: `calc(${left}% + 2px)`,
        width: `calc(${width}% - 4px)`,
        top: '50%', transform: 'translateY(-50%)',
        zIndex: 3,
        boxShadow: (isCheckInToday || isCheckOutToday) ? '0 0 0 2px var(--vo-ocean), 0 4px 10px -4px rgba(15,59,87,0.4)' : 'none',
      }}
      title={`${b.guest} · ${fmtDate(b.arrival)} → ${fmtDate(b.departure)} · ${fmtEur(b.total)}`}
    >
      {/* Channel chip */}
      <span style={{
        fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
        background: 'rgba(255,255,255,0.25)',
        color: 'inherit', flexShrink: 0,
        letterSpacing: '0.04em',
      }}>{ch.short}</span>

      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {showFull ? b.guest : b.guest.split(' ')[0]}
      </span>

      {showAmount && (
        <>
          <span className="bb-bar__channel-sep" style={{ opacity: 0.5, fontSize: 10 }}>·</span>
          <span className="bb-bar__amount" style={{ fontSize: 11, fontWeight: 600, opacity: 0.92 }}>{fmtEurShort(b.total)}</span>
        </>
      )}

      {(isCheckInToday || isCheckOutToday) && (
        <span style={{
          position: 'absolute', top: -8, right: 6,
          background: 'var(--vo-ocean)', color: 'white',
          fontSize: 8.5, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
          letterSpacing: '0.06em',
        }}>{isCheckInToday ? (lang==='en'?'CHECK-IN':'CHECK-IN') : (lang==='en'?'CHECK-OUT':'CHECK-OUT')}</span>
      )}
    </div>
  );
}
