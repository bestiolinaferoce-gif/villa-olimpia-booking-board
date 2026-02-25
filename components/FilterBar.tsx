"use client";

import { BOOKING_CHANNELS, BOOKING_STATUSES, type BookingFilters } from "@/lib/types";
import { channelLabels } from "@/lib/utils";

type FilterBarProps = {
  filters: BookingFilters;
  monthTheme: boolean;
  onSearch: (v: string) => void;
  onStatusFilter: (v: BookingFilters["status"]) => void;
  onChannelFilter: (v: BookingFilters["channel"]) => void;
  onShowCancelled: (v: boolean) => void;
  onMonthTheme: (v: boolean) => void;
};

export function FilterBar({
  filters,
  monthTheme,
  onSearch,
  onStatusFilter,
  onChannelFilter,
  onShowCancelled,
  onMonthTheme,
}: FilterBarProps) {
  return (
    <div className="group grow">
      <input
        value={filters.search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Cerca ospite"
        className="grow"
      />
      <select
        value={filters.status}
        onChange={(e) => onStatusFilter(e.target.value as BookingFilters["status"])}
      >
        <option value="all">Status: tutti</option>
        {BOOKING_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <select
        value={filters.channel}
        onChange={(e) => onChannelFilter(e.target.value as BookingFilters["channel"])}
      >
        <option value="all">Canale: tutti</option>
        {BOOKING_CHANNELS.map((channel) => (
          <option key={channel} value={channel}>
            {channelLabels[channel]}
          </option>
        ))}
      </select>
      <label className="checkbox-line">
        <input
          type="checkbox"
          checked={filters.showCancelled}
          onChange={(e) => onShowCancelled(e.target.checked)}
        />
        Mostra cancellate
      </label>
      <label className="checkbox-line">
        <input
          type="checkbox"
          checked={monthTheme}
          onChange={(e) => onMonthTheme(e.target.checked)}
        />
        Tema mese: {monthTheme ? "ON" : "OFF"}
      </label>
    </div>
  );
}
