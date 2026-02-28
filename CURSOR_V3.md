# VILLA OLIMPIA — CURSOR V3
## Gantt Legibility · iCal Export · WOW Factor · Sync Robustness

---

## STACK
Next.js 14 App Router · TypeScript strict · Zustand 5 · Vercel KV · lucide-react (già installato, v0.575.0) · date-fns

---

## REGOLE FERREE

**NON TOCCARE MAI** questi file (sono già corretti e funzionanti):
- `app/api/bookings/route.ts` ← versioning KV già implementato
- `app/api/bookings/version/route.ts` ← polling endpoint già implementato
- `lib/store.ts` ← polling ogni 30s già implementato
- `lib/types.ts`
- `components/BookingDialog.tsx`
- `components/PasswordGate.tsx`
- `components/MonthSummary.tsx`
- `components/KPIPanel.tsx`
- Qualunque file non citato esplicitamente in questo documento

**ZERO LIBRERIE NUOVE** — tutto si fa con l'esistente.
**ZERO BREAKING CHANGES** — ogni modifica è additiva o un override CSS.
**NESSUN `tsc --noEmit` deve produrre errori** prima e dopo.

---

## PARTE 1 — GANTT: LEGGIBILITÀ CRITICA

### 1a. `app/globals.css` — Modifica SOLO le regole esistenti del Gantt

Sostituisci le seguenti regole CSS con i valori aggiornati.
**Non aggiungere nuove classi ancora, solo aggiorna i valori.**

```css
/* Altezza riga: da 52px a 68px */
.gantt-row {
  display: grid;
  border-bottom: 1px solid var(--line);
  min-height: 68px;
}

/* Area celle: altezza adeguata */
.gantt-cells-area {
  display: grid;
  position: relative;
  min-height: 68px;
}

/* Cella singola: allineata */
.gantt-cell {
  min-height: 68px;
  border-right: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Barra prenotazione: più alta, più visibile */
.gantt-bar {
  position: absolute;
  height: 48px;
  top: 10px;
  border-radius: 10px;
  border-left: 4px solid;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 10px;
  overflow: hidden;
  min-width: 56px;
  color: var(--text);
  transition: box-shadow 0.15s, transform 0.12s;
  backdrop-filter: none;
}

.gantt-bar:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  z-index: 10;
}

/* Nome ospite: leggibile */
.gantt-bar-name {
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

/* Meta (notti · importo): più visibile */
.gantt-bar-meta {
  font-size: 0.78rem;
  color: var(--muted);
  white-space: nowrap;
  font-weight: 500;
}

/* Badge canale: leggermente più grande */
.gantt-bar-channel {
  font-size: 0.68rem;
  padding: 2px 7px;
  border-radius: 5px;
  font-weight: 700;
  white-space: nowrap;
}
```

### 1b. `components/GanttBoard.tsx` — Migliora sfondo barre e struttura inner

Modifica SOLO il blocco JSX delle barre (il `bars.map(...)`, righe ~145-193).

**Obiettivo**: sfondo barra più saturo e leggibile, testo colorato con il colore della lodge.

```tsx
{bars.map(({ booking, startCol, spanCols, totalNights }) => {
  const statusColor = statusColors[booking.status] ?? statusColors.confirmed;
  const cBadge = channelBadge[booking.channel] ?? channelBadge.direct;
  const lc = LODGE_COLORS[lodge];
  const colCount = monthDays.length;
  const leftPct = (startCol / colCount) * 100;
  const widthPct = (spanCols / colCount) * 100;
  return (
    <div
      key={booking.id}
      className="gantt-bar"
      title={bookingTooltip(booking)}
      onClick={() => onEdit(booking)}
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        borderLeftColor: statusColor,
        background: `linear-gradient(135deg, ${lc.bg} 0%, ${statusColor}20 100%)`,
        color: lc.text,
      }}
    >
      <div className="gantt-bar-inner">
        <span className="gantt-bar-name">{booking.guestName}</span>
        {spanCols > 2 && (
          <span className="gantt-bar-meta">
            {totalNights}n
            {spanCols > 3 && ` · ${formatMoney(booking.totalAmount)}`}
            {booking.depositReceived
              ? " ✓"
              : booking.depositAmount > 0
              ? " ⚠"
              : ""}
          </span>
        )}
        {spanCols > 5 && (
          <span
            className="gantt-bar-channel"
            style={{ background: cBadge.bg, color: cBadge.text }}
          >
            {booking.channel}
          </span>
        )}
      </div>
      {booking.isNew && (
        <span className="gantt-bar-new-badge">NUOVO</span>
      )}
    </div>
  );
})}
```

---

## PARTE 2 — iCAL EXPORT (feature nuova)

### 2a. Crea `app/api/calendar/route.ts` (file NUOVO)

Questo endpoint genera un feed iCal RFC 5545 con tutte le prenotazioni non cancellate.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { Booking } from '@/lib/types';

const BASE = process.env.KV_REST_API_URL ?? '';
const TOKEN = process.env.KV_REST_API_TOKEN ?? '';
const KEY = 'vob_bookings';

function toIcalDate(iso: string): string {
  // "2025-06-15" → "20250615"
  return iso.slice(0, 10).replace(/-/g, '');
}

function escapeIcal(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
  // iCal RFC 5545: lines must be ≤75 octets, fold with CRLF + space
  const MAX = 74;
  if (line.length <= MAX) return line;
  let out = '';
  let pos = 0;
  while (pos < line.length) {
    if (pos === 0) {
      out += line.slice(0, MAX);
      pos = MAX;
    } else {
      out += '\r\n ' + line.slice(pos, pos + MAX - 1);
      pos += MAX - 1;
    }
  }
  return out;
}

const STATUS_MAP: Record<string, string> = {
  confirmed: 'CONFIRMED',
  option: 'TENTATIVE',
  blocked: 'CONFIRMED',
  cancelled: 'CANCELLED',
};

export async function GET(req: NextRequest) {
  // Optional: ?lodge=Frangipane to filter by lodge
  const lodgeFilter = req.nextUrl.searchParams.get('lodge');

  let bookings: Booking[] = [];

  if (BASE && TOKEN) {
    try {
      const res = await fetch(`${BASE}/get/${KEY}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        cache: 'no-store',
      });
      const json = (await res.json()) as { result: string | null };
      if (json.result) {
        const parsed = JSON.parse(json.result);
        bookings = Array.isArray(parsed) ? parsed : (parsed.data ?? []);
      }
    } catch {
      // se KV non raggiungibile, ritorna feed vuoto ma valido
    }
  }

  const filtered = bookings.filter((b) => {
    if (lodgeFilter && b.lodge !== lodgeFilter) return false;
    return b.status !== 'cancelled';
  });

  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const events = filtered.map((b) => {
    const lines = [
      'BEGIN:VEVENT',
      foldLine(`UID:vob-${b.id}@villa-olimpia.it`),
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toIcalDate(b.checkIn)}`,
      `DTEND;VALUE=DATE:${toIcalDate(b.checkOut)}`,
      foldLine(`SUMMARY:${escapeIcal(b.guestName)} — ${escapeIcal(b.lodge)}`),
      foldLine(
        `DESCRIPTION:${escapeIcal(b.guestsCount + ' ospiti')}${
          b.notes ? '\\n' + escapeIcal(b.notes) : ''
        }${b.totalAmount ? '\\n€' + b.totalAmount : ''}`
      ),
      foldLine(`LOCATION:Villa Olimpia — ${escapeIcal(b.lodge)}`),
      `STATUS:${STATUS_MAP[b.status] ?? 'CONFIRMED'}`,
      `CATEGORIES:${escapeIcal(b.channel)}`,
      'END:VEVENT',
    ];
    return lines.join('\r\n');
  });

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Villa Olimpia//Booking Board//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine('X-WR-CALNAME:Villa Olimpia — Booking Board'),
    'X-WR-TIMEZONE:Europe/Rome',
    'X-WR-CALDESC:Prenotazioni Villa Olimpia',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(cal, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="villa-olimpia.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
```

### 2b. `components/Toolbar.tsx` — Aggiungi pulsante iCal

Trova la props interface di Toolbar e aggiungi:
```typescript
onCopyIcal: () => void;
```

Trova il JSX del toolbar e aggiungi il pulsante iCal **vicino al pulsante export** (in fondo al gruppo azioni). Importa `Calendar` da `lucide-react`:

```tsx
import { Calendar } from 'lucide-react';

// Nel JSX, vicino al bottone export:
<button
  className="ghost-btn"
  title="Copia link iCal (per Airbnb, Google Calendar, ecc.)"
  onClick={onCopyIcal}
>
  <Calendar size={15} />
  iCal
</button>
```

### 2c. `app/page.tsx` — Collega la callback iCal

Trova la funzione `onExport` e DOPO di essa aggiungi:

```typescript
function onCopyIcal() {
  const url = `${window.location.origin}/api/calendar`;
  navigator.clipboard.writeText(url).then(() => {
    showToast("Link iCal copiato! Incollalo in Google Calendar / Airbnb / iPhone.", "success");
  });
}
```

Poi passa `onCopyIcal={onCopyIcal}` al componente `<Toolbar />`.

---

## PARTE 3 — WOW FACTOR: CSS ENHANCEMENTS

### 3a. `app/globals.css` — Aggiungi queste regole NUOVE in fondo al file

```css
/* ── WOW: KPI panel entrance animation ─────────────────── */
@keyframes kpiSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.kpi-card:nth-child(1) { animation: kpiSlideUp 0.35s ease both; }
.kpi-card:nth-child(2) { animation: kpiSlideUp 0.35s 0.06s ease both; }
.kpi-card:nth-child(3) { animation: kpiSlideUp 0.35s 0.12s ease both; }
.kpi-card:nth-child(4) { animation: kpiSlideUp 0.35s 0.18s ease both; }

/* ── WOW: Toolbar glassmorphism upgrade ─────────────────── */
.toolbar {
  background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,249,247,0.94) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(229,231,235,0.8);
  border-top: 3px solid var(--accent);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07), 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* ── WOW: KPI card premium shadow ─────────────────────── */
.kpi-card {
  background: linear-gradient(160deg, var(--panel) 0%, rgba(249,250,251,0.9) 100%);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.kpi-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 12px 40px rgba(0,0,0,0.08);
  transform: translateY(-3px);
}

/* ── WOW: Gantt wrap premium ─────────────────────────── */
.gantt-wrap {
  --lodge-col: 180px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* ── WOW: Gantt header premium ───────────────────────── */
.gantt-header {
  background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 85%, #000) 100%);
  color: #fff;
  border-bottom: none;
  position: sticky;
  top: 0;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* ── WOW: Gantt lodge label premium ─────────────────── */
.gantt-lodge-label {
  min-width: 150px;
  max-width: 180px;
  width: 180px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  overflow: hidden;
  position: sticky;
  left: 0;
  z-index: 2;
  background: inherit;
  border-right: 1px solid var(--line);
}

/* ── WOW: Today line più visibile ────────────────────── */
.gantt-today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
  background: var(--today-bg);
  border-left: 2px solid var(--accent);
  border-right: 1px solid var(--today-border);
  opacity: 0.7;
}

/* ── WOW: Page background premium ───────────────────── */
body {
  background: linear-gradient(160deg, #f0ede8 0%, #e8e4dc 50%, #ede9e2 100%);
  min-height: 100vh;
}

/* ── WOW: Sync badge premium ─────────────────────────── */
.sync-error-badge {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #fffbeb;
  border: 1px solid #f59e0b;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #92400e;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: kpiSlideUp 0.3s ease both;
}
```

---

## PARTE 4 — SYNC ROBUSTNESS: Pulsante "Carica su cloud"

### 4a. `lib/store.ts` — Aggiungi `forceSyncToCloud`

Nella type `BookingState`, aggiungi:
```typescript
forceSyncToCloud: () => Promise<void>;
```

Nell'implementazione dello store (nel `return { ... }`), aggiungi DOPO `exportBookings`:
```typescript
forceSyncToCloud: async () => {
  if (typeof window === "undefined") return;
  const cur = get().bookings;
  if (cur.length === 0) {
    get().showToast("Nessuna prenotazione da caricare.", "error");
    return;
  }
  try {
    const r = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookings: cur }),
    });
    if (r.ok) {
      const res = await r.json() as { ok: boolean; v?: number };
      if (typeof res.v === "number") set({ serverVersion: res.v, syncError: false });
      get().showToast(`✓ ${cur.length} prenotazioni caricate sul cloud (v${res.v ?? '?'}).`);
    } else {
      get().showToast("Errore durante il caricamento sul cloud.", "error");
    }
  } catch {
    set({ syncError: true });
    get().showToast("Errore di rete durante il sync.", "error");
  }
},
```

### 4b. `components/Toolbar.tsx` — Aggiungi pulsante sync

Aggiungi alla props interface:
```typescript
onForceSync: () => void;
syncError: boolean;
```

Aggiungi nel JSX del toolbar (vicino al pulsante iCal o export), importando `CloudUpload` da lucide-react:
```tsx
import { CloudUpload } from 'lucide-react';

// Nel JSX:
<button
  className={syncError ? "ghost-btn danger-btn" : "ghost-btn"}
  title={syncError ? "Sync offline — clicca per ritentare il caricamento" : "Forza caricamento dati sul cloud"}
  onClick={onForceSync}
>
  <CloudUpload size={15} />
  {syncError ? "Sync ⚠" : "Sync"}
</button>
```

### 4c. `app/page.tsx` — Collega forceSyncToCloud

Nel destructuring dello store (blocco `useShallow` che contiene `load, startPolling, ...`):
```typescript
const { load, startPolling, syncError, addBooking, updateBooking, deleteBooking,
        importBookingsMerge, exportBookings, showToast, forceSyncToCloud } = useBookingStore(
  useShallow((s) => ({
    ...
    forceSyncToCloud: s.forceSyncToCloud,
  }))
);
```

Poi passa al `<Toolbar />`:
```tsx
onForceSync={() => forceSyncToCloud()}
syncError={syncError}
```

---

## CHECKLIST PRE-COMMIT

Prima di committare, verifica tutti questi punti:

- [ ] `npx tsc --noEmit` → 0 errori
- [ ] Tutti i file modificati sono SOLO quelli citati in questo documento
- [ ] `app/api/calendar/route.ts` esiste ed è TypeScript valido
- [ ] `GanttBoard.tsx`: le barre usano `lc.bg` come sfondo + `lc.text` come colore testo
- [ ] `globals.css`: `.gantt-row { min-height: 68px }` e `.gantt-bar { height: 48px }`
- [ ] Il pulsante iCal nella Toolbar chiama `onCopyIcal`
- [ ] Il pulsante Sync nella Toolbar chiama `onForceSync`
- [ ] Nessuna libreria npm nuova installata

---

## NOTE FINALI PER L'AGENTE

**Priorità di esecuzione:**
1. Prima: PARTE 1 (CSS Gantt leggibilità) — è il fix più critico e visivamente immediato
2. Poi: PARTE 3 (WOW CSS) — solo CSS, zero rischi
3. Poi: PARTE 2 (iCal) — nuovo file + toolbar
4. Infine: PARTE 4 (Sync) — piccola modifica store + toolbar

**Regola d'oro:** Se qualcosa non compile o causa errori TypeScript, skip quella sezione e vai avanti. Non bloccare tutto per un dettaglio. Un file non modificato è meglio di un file rotto.
