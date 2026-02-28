"use client";

import { formatMoney } from "@/lib/utils";

export type KPIData = {
  bookingsCount: number;
  revenue: number;
  depositsReceived: number;
  occupancyPct: number;
  newBookingsCount: number;
};

type KPICardProps = {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  badge?: number;
};

function KPICard({ label, value, sub, accent, badge }: KPICardProps) {
  return (
    <div className="kpi-card" style={accent ? { "--kpi-accent": accent } as React.CSSProperties : {}}>
      <div className="kpi-label">
        {label}
        {badge != null && badge > 0 && (
          <span className="kpi-new-badge">{badge} nuov{badge === 1 ? "a" : "e"}</span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

type Props = {
  data: KPIData;
  monthLabel: string;
};

export function KPIPanel({ data, monthLabel }: Props) {
  const occupancyColor =
    data.occupancyPct >= 75
      ? "#16a34a"
      : data.occupancyPct >= 40
      ? "#d97706"
      : "#6b7280";

  return (
    <div className="kpi-panel">
      <KPICard
        label="Prenotazioni"
        value={String(data.bookingsCount)}
        sub={monthLabel}
        badge={data.newBookingsCount}
        accent="#1d4ed8"
      />
      <KPICard
        label="Fatturato"
        value={formatMoney(data.revenue)}
        sub="Totale mese"
        accent="#16a34a"
      />
      <KPICard
        label="Caparre ricevute"
        value={formatMoney(data.depositsReceived)}
        sub="Incassate"
        accent="#7c3aed"
      />
      <KPICard
        label="Occupancy"
        value={`${Math.round(data.occupancyPct)}%`}
        sub="Lodge × notti"
        accent={occupancyColor}
      />
    </div>
  );
}
