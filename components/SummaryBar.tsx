"use client";

import * as Popover from "@radix-ui/react-popover";
import { CalendarDays, CircleHelp, Filter } from "lucide-react";
import { BOOKING_STATUSES } from "@/lib/types";
import { formatMoney, statusColors } from "@/lib/utils";

type SummaryBarProps = {
  count: number;
  total: number;
  deposits: number;
};

export function SummaryBar({ count, total, deposits }: SummaryBarProps) {
  return (
    <div className="meta-row">
      <div className="summary-card">
        <CalendarDays size={16} />
        <span>Prenotazioni visibili: {count}</span>
      </div>
      <div className="summary-card">
        <Filter size={16} />
        <span>Totale: {formatMoney(total)}</span>
      </div>
      <div className="summary-card">
        <Filter size={16} />
        <span>Caparre: {formatMoney(deposits)}</span>
      </div>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button type="button" className="ghost-btn">
            <CircleHelp size={15} />
            Legenda
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content sideOffset={8} className="popover-content">
            <strong>Legenda stati</strong>
            <ul>
              {BOOKING_STATUSES.map((status) => (
                <li key={status}>
                  <span className="dot" style={{ background: statusColors[status] }} />
                  {status}
                </li>
              ))}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
