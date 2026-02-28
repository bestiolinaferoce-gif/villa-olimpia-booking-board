# VILLA OLIMPIA — CURSOR TASK DEFINITIVO
## Sync multi-utente + Design System KPI Panel

---

## CONTESTO

Stack: Next.js 14 App Router · TypeScript strict · Zustand · Vercel KV · lucide-react (già installato)

**NON TOCCARE MAI:**
- `components/BookingDialog.tsx`
- `components/GanttBoard.tsx`
- `components/PasswordGate.tsx`
- `components/MonthSummary.tsx`
- `components/Toolbar.tsx`
- `lib/types.ts`
- Qualunque file non citato in questo prompt

---

## PARTE 1 — SYNC MULTI-UTENTE (bug critico)

### Problema
`load()` chiama Vercel KV una volta sola al mount. Se Francesco salva una prenotazione,
Carlo che ha la pagina già aperta non la vede mai finché non ricarica manualmente.

### Soluzione: polling a version token

#### 1a. `app/api/bookings/route.ts` — RISCRIVI COMPLETAMENTE

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { Booking } from '@/lib/types';

const BASE = process.env.KV_REST_API_URL ?? '';
const TOKEN = process.env.KV_REST_API_TOKEN ?? '';
const KEY = 'vob_bookings';

type KVPayload = { v: number; ts: string; data: Booking[] };

async function readKV(): Promise<{ payload: KVPayload | null; raw: string | null }> {
  if (!BASE || !TOKEN) return { payload: null, raw: null };
  const res = await fetch(`${BASE}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  });
  const json = (await res.json()) as { result: string | null };
  if (!json.result) return { payload: null, raw: null };
  const parsed = JSON.parse(json.result) as KVPayload | Booking[];
  if (Array.isArray(parsed)) {
    // backward compat: vecchio formato array grezzo
    return { payload: { v: 1, ts: new Date().toISOString(), data: parsed }, raw: json.result };
  }
  return { payload: parsed as KVPayload, raw: json.result };
}

export async function GET() {
  if (!BASE || !TOKEN) return NextResponse.json({ v: 0, ts: '', data: [] });
  try {
    const { payload } = await readKV();
    return NextResponse.json(payload ?? { v: 0, ts: '', data: [] });
  } catch {
    return NextResponse.json({ v: 0, ts: '', data: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!BASE || !TOKEN) return NextResponse.json({ ok: false });
  try {
    const body = (await req.json()) as Booking[] | { bookings: Booking[] };
    const bookings: Booking[] = Array.isArray(body) ? body : (body.bookings ?? []);
    const { payload: current } = await readKV();
    const newPayload: KVPayload = {
      v: (current?.v ?? 0) + 1,
      ts: new Date().toISOString(),
      data: bookings,
    };
    await fetch(`${BASE}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['SET', KEY, JSON.stringify(newPayload)]]),
    });
    return NextResponse.json({ ok: true, v: newPayload.v, ts: newPayload.ts });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
```

#### 1b. CREA `app/api/bookings/version/route.ts` (nuovo file)

```typescript
import { NextResponse } from 'next/server';

const BASE = process.env.KV_REST_API_URL ?? '';
const TOKEN = process.env.KV_REST_API_TOKEN ?? '';
const KEY = 'vob_bookings';

// Endpoint leggero: ritorna solo { v, ts } senza i dati — usato per il polling
export async function GET() {
  if (!BASE || !TOKEN) return NextResponse.json({ v: 0, ts: '' });
  try {
    const res = await fetch(`${BASE}/get/${KEY}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: 'no-store',
    });
    const json = (await res.json()) as { result: string | null };
    if (!json.result) return NextResponse.json({ v: 0, ts: '' });
    const parsed = JSON.parse(json.result) as { v?: number; ts?: string };
    if (Array.isArray(parsed)) return NextResponse.json({ v: 1, ts: '' });
    return NextResponse.json({ v: parsed.v ?? 0, ts: parsed.ts ?? '' });
  } catch {
    return NextResponse.json({ v: 0, ts: '' });
  }
}
```

#### 1c. `lib/store.ts` — AGGIUNGI (non riscrivere l'intero file, solo le parti indicate)

**Aggiungi al tipo `BookingState`** (dopo `monthTheme: boolean`):
```typescript
serverVersion: number;
syncError: boolean;
startPolling: () => () => void;
stopPolling: () => void;
```

**Aggiungi ai valori iniziali** (`create<BookingState>((set, get) => ({`):
```typescript
serverVersion: 0,
syncError: false,
```

**Sostituisci `load()`** con questa versione che:
- mostra subito i dati da localStorage (non blocca la UI)
- poi aggiorna da KV (autoritativo)
- salva la serverVersion

```typescript
load: () => {
  if (typeof window === 'undefined') return;
  const rawSettings = window.localStorage.getItem(SETTINGS_KEY);
  if (rawSettings) {
    try {
      const s = JSON.parse(rawSettings) as { monthTheme?: boolean };
      if (typeof s.monthTheme === 'boolean') set({ monthTheme: s.monthTheme });
    } catch { /* ignore */ }
  }
  // Mostra subito i dati locali
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const cached = JSON.parse(raw) as Array<Booking & { guestsCount?: number }>;
      set({ bookings: migrateBookings(cached) });
    } catch { /* ignore */ }
  }
  // Sincronizza con KV (authoritativo)
  fetch('/api/bookings', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((payload: { v: number; ts: string; data: Booking[] } | null) => {
      if (!payload) return;
      const data = Array.isArray(payload) ? payload : (payload.data ?? []);
      if (data.length > 0) {
        const migrated = migrateBookings(data);
        set({ bookings: migrated, serverVersion: payload.v ?? 0, syncError: false });
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } else {
        const cur = get().bookings;
        if (cur.length > 0) {
          fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookings: cur }),
          }).catch(() => {});
        }
      }
    })
    .catch(() => set({ syncError: true }));
},
```

**Aggiungi `startPolling`** (dopo `clearToast`):
```typescript
startPolling: () => {
  const INTERVAL = 30_000;
  let active = true;

  const poll = async () => {
    if (!active || typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/bookings/version', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const { v } = (await res.json()) as { v: number };
      if (v > get().serverVersion) {
        const full = await fetch('/api/bookings', { cache: 'no-store' });
        if (!full.ok) throw new Error();
        const payload = (await full.json()) as { v: number; ts: string; data: Booking[] };
        const data = Array.isArray(payload) ? payload : (payload.data ?? []);
        const migrated = migrateBookings(data);
        set({ bookings: migrated, serverVersion: payload.v ?? v, syncError: false });
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
    } catch { /* silent — non aggiornare syncError da polling */ }
    if (active) setTimeout(poll, INTERVAL);
  };

  const t = setTimeout(poll, 5_000);
  return () => { active = false; clearTimeout(t); };
},
stopPolling: () => { /* gestito via active flag in startPolling */ },
```

**Modifica `persist()`** — aggiorna `serverVersion` sulla risposta POST:
```typescript
// Sostituisci la riga:
fetch('/api/bookings', { method: 'POST', ... }).catch(() => {});
// Con:
fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bookings }),
})
  .then(async (r) => {
    if (r.ok) {
      const res = (await r.json()) as { ok: boolean; v?: number };
      if (typeof res.v === 'number') set({ serverVersion: res.v, syncError: false });
    }
  })
  .catch(() => {});
```

#### 1d. `app/page.tsx` — AGGIUNGI avvio polling

Aggiunge questo useEffect dopo quello del caricamento (`useEffect(() => { load(); }, [load])`):

```typescript
const { startPolling, syncError } = useBookingStore(
  useShallow((s) => ({ startPolling: s.startPolling, syncError: s.syncError }))
);

useEffect(() => {
  const stop = startPolling();
  return stop;
}, [startPolling]);
```

Aggiungi nell'JSX, subito prima di `<Toast />`:
```tsx
{syncError && (
  <div className="sync-error-badge" role="status">
    ⚠ Sincronizzazione offline
  </div>
)}
```

---

## PARTE 2 — KPI PANEL: DESIGN SYSTEM COMPLETO

### Principi guida
- **Sistema**: usa SOLO i token CSS già definiti in `:root` (`--bg`, `--panel`, `--text`, `--muted`, `--line`, `--accent`, `--accent-faint`)
- **Icone**: usa `lucide-react` (già in package.json) — NESSUNA emoji, NESSUNA SVG inline
- **Nessun framework UI esterno** — solo CSS puro + CSS custom properties
- **Responsive**: 4 colonne desktop → 2 tablet → 1 mobile
- **Zero sfondo colorato pieno** — i colori vivaci vanno sulle icone/accenti, non sul fondo card

### 2a. `components/KPIPanel.tsx` — RISCRIVI COMPLETAMENTE

```tsx
"use client";

import { BedDouble, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatMoney } from "@/lib/utils";

export type KPIData = {
  bookingsCount: number;
  revenue: number;
  depositsReceived: number;
  occupancyPct: number;
  newBookingsCount: number;
};

type CardDef = {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  getValue: (d: KPIData) => string;
  getSub: (d: KPIData) => string;
  badge?: (d: KPIData) => number | null;
};

const CARDS: CardDef[] = [
  {
    icon: BedDouble,
    iconColor: "#1d4ed8",
    iconBg: "rgba(29,78,216,0.10)",
    label: "Prenotazioni",
    getValue: (d) => String(d.bookingsCount),
    getSub: () => "Check-in nel mese",
    badge: (d) => (d.newBookingsCount > 0 ? d.newBookingsCount : null),
  },
  {
    icon: TrendingUp,
    iconColor: "#16a34a",
    iconBg: "rgba(22,163,74,0.10)",
    label: "Fatturato mese",
    getValue: (d) => formatMoney(d.revenue),
    getSub: () => "Totale incassabile",
  },
  {
    icon: Wallet,
    iconColor: "#7c3aed",
    iconBg: "rgba(124,58,237,0.10)",
    label: "Caparre ricevute",
    getValue: (d) => formatMoney(d.depositsReceived),
    getSub: () => "Già incassate",
  },
  {
    icon: BarChart3,
    iconColor: (d: KPIData) =>
      d.occupancyPct >= 75 ? "#16a34a" : d.occupancyPct >= 40 ? "#d97706" : "#6b7280",
    iconBg: (d: KPIData) =>
      d.occupancyPct >= 75
        ? "rgba(22,163,74,0.10)"
        : d.occupancyPct >= 40
        ? "rgba(217,119,6,0.10)"
        : "rgba(107,114,128,0.10)",
    label: "Occupancy",
    getValue: (d) => `${Math.round(d.occupancyPct)}%`,
    getSub: () => "Lodge × notti mese",
  },
];

// Risolve iconColor/iconBg che possono essere stringa fissa o funzione di KPIData
function resolve(val: string | ((d: KPIData) => string), data: KPIData): string {
  return typeof val === "function" ? val(data) : val;
}

type Props = { data: KPIData; monthLabel: string };

export function KPIPanel({ data, monthLabel }: Props) {
  return (
    <div className="kpi-panel" role="region" aria-label={`KPI ${monthLabel}`}>
      {CARDS.map((card) => {
        const Icon = card.icon;
        const iconColor = resolve(card.iconColor as string | ((d: KPIData) => string), data);
        const iconBg = resolve(card.iconBg as string | ((d: KPIData) => string), data);
        const badge = card.badge?.(data);
        return (
          <div key={card.label} className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon-wrap" style={{ background: iconBg }}>
                <Icon size={20} color={iconColor} strokeWidth={2} />
              </div>
              <span className="kpi-label">{card.label}</span>
              {badge != null && (
                <span className="kpi-new-badge">
                  +{badge} nuov{badge === 1 ? "a" : "e"}
                </span>
              )}
            </div>
            <div className="kpi-value" style={{ color: iconColor }}>
              {card.getValue(data)}
            </div>
            <div className="kpi-sub">{card.getSub(data)}</div>
          </div>
        );
      })}
    </div>
  );
}
```

### 2b. CSS da aggiungere in `app/globals.css` (sostituisce il blocco KPI precedente)

Trova il commento `/* ── KPI Panel` e sostituisci TUTTO il blocco fino al commento successivo con:

```css
/* ── KPI Panel ────────────────────────────────────────── */
.kpi-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 960px) {
  .kpi-panel { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 520px) {
  .kpi-panel { grid-template-columns: 1fr; }
}

.kpi-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04);
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}

.kpi-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 8px 28px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.kpi-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kpi-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  flex: 1;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  padding-left: 2px;
}

.kpi-sub {
  font-size: 11px;
  color: var(--muted);
  padding-left: 2px;
}

/* Badge "nuove" sui KPI */
.kpi-new-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(16,185,129,0.12);
  color: #059669;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 99px;
  border: 1px solid rgba(16,185,129,0.25);
  animation: badgePulse 1.4s ease-in-out infinite;
  white-space: nowrap;
}

/* Badge "Sync offline" */
.sync-error-badge {
  position: fixed;
  bottom: 16px;
  right: 20px;
  background: #fefce8;
  border: 1px solid #ca8a04;
  color: #854d0e;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 10px;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

@media print {
  .kpi-panel, .sync-error-badge { display: none; }
}
/* ── fine KPI Panel ─────────────────────────────────── */
```

---

## REGOLE FERREE DI QUALITÀ

### Icone
- Usa SEMPRE `lucide-react` — è già installato, basta importare
- Dimensioni: 18-22px per KPI, 14-16px per badge/UI inline
- `strokeWidth={2}` sempre

### Colori e token
- MAI `color: #abc123` hardcoded nel JSX — usa `style={{ color: iconColor }}` o CSS custom props
- MAI nuovi colori arbitrari — attieniti ai token in `:root`
- Il colore dell'occupancy cambia in base al valore (verde ≥75%, arancio ≥40%, grigio altrimenti)

### Tipografia
- `kpi-value`: 1.75rem, weight 800, tracking -0.03em — è il numero principale, deve dominare
- `kpi-label`: 11px, weight 700, uppercase, tracking 0.06em — etichetta discreta
- `kpi-sub`: 11px, muted — info secondaria

### Spacing
- Gap tra cards: 12px
- Padding interno card: 16px
- Gap interno card: 6px

### Animazioni
- Hover card: `translateY(-2px)` + shadow più forte — sottile, non eccessivo
- `transition: 0.18s ease` su hover states
- Il badge `.kpi-new-badge` usa `animation: badgePulse` già definita in globals.css

---

## VERIFICA FINALE (obbligatoria prima del commit)

```bash
npx tsc --noEmit     # DEVE dare zero errori
```

Poi test manuale:
1. Apri l'app su due tab diverse nello stesso browser
2. Tab A: aggiungi una prenotazione → salva
3. Tab B: aspetta 30 secondi senza ricaricare → la prenotazione compare automaticamente
4. Scollega internet (Network tab → Offline) → appare il badge "Sincronizzazione offline"
5. Riconnetti → badge sparisce al prossimo poll riuscito
6. Verifica visiva KPI: icone colorate, numeri grandi, label uppercase — NO emoji, NO sfondi colorati pieni sulle card
