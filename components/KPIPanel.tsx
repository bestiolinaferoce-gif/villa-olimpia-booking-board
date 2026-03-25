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
  iconColor: string | ((d: KPIData) => string);
  iconBg: string | ((d: KPIData) => string);
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

function resolve(val: string | ((d: KPIData) => string), data: KPIData): string {
  return typeof val === "function" ? val(data) : val;
}

type Props = { data: KPIData; monthLabel: string };

export function KPIPanel({ data, monthLabel }: Props) {
  return (
    <div className="kpi-panel no-print" role="region" aria-label={`KPI ${monthLabel}`}>
      {CARDS.map((card) => {
        const Icon = card.icon;
        const iconColor = resolve(card.iconColor, data);
        const iconBg = resolve(card.iconBg, data);
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
