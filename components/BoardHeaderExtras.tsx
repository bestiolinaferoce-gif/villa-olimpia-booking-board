"use client";

import { CloudSun, Moon, Palette, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  applyBoardAppearance,
  BOARD_ACCENT_OPTIONS,
  readBoardAccentFromDocument,
  readBoardThemeFromDocument,
  STORAGE_ACCENT_KEY,
  STORAGE_THEME_KEY,
  type BoardAccentId,
  type BoardThemeMode,
} from "@/lib/boardUiPreferences";
import { CAPO_RIZZUTO_WEATHER_MOCK } from "@/lib/capoRizzutoWeatherMock";

type BoardHeaderExtrasProps = {
  /** Se true, l’accento è gestito dal “tema mese” sulla board: il selettore accento è disabilitato. */
  monthTheme: boolean;
};

export function BoardHeaderExtras({ monthTheme }: BoardHeaderExtrasProps) {
  const [now, setNow] = useState(() => new Date());
  const [theme, setTheme] = useState<BoardThemeMode>("light");
  const [accent, setAccent] = useState<BoardAccentId>("blue");

  useEffect(() => {
    setTheme(readBoardThemeFromDocument());
    setAccent(readBoardAccentFromDocument());
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_THEME_KEY && e.key !== STORAGE_ACCENT_KEY) return;
      setTheme(readBoardThemeFromDocument());
      setAccent(readBoardAccentFromDocument());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: BoardThemeMode = theme === "dark" ? "light" : "dark";
    applyBoardAppearance(next, readBoardAccentFromDocument());
    setTheme(next);
  }, [theme]);

  const onAccentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (monthTheme) return;
      const v = e.target.value as BoardAccentId;
      applyBoardAppearance(readBoardThemeFromDocument(), v);
      setAccent(v);
    },
    [monthTheme]
  );

  const wx = CAPO_RIZZUTO_WEATHER_MOCK;

  return (
    <div className="toolbar-meta-strip">
      <div className="board-clock" title={format(now, "EEEE d MMMM yyyy", { locale: it })}>
        <span className="board-clock-time">{format(now, "HH:mm:ss")}</span>
        <span className="board-clock-date">{format(now, "d MMM", { locale: it })}</span>
      </div>

      <div
        className="board-weather"
        title={`${wx.locationLabel} — dati dimostrativi (${wx.dataSource}), sostituibili con API`}
      >
        <CloudSun size={17} strokeWidth={1.75} aria-hidden />
        <span>
          {wx.locationLabel} · {wx.condition} · {wx.tempHighC}° / {wx.tempLowC}°
        </span>
      </div>

      <div className="board-appearance">
        <button
          type="button"
          className="board-theme-toggle"
          onClick={toggleTheme}
          title={theme === "dark" ? "Passa a tema chiaro" : "Passa a tema scuro"}
          aria-label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <label className="board-accent-label">
          <Palette size={14} aria-hidden />
          <span className="board-accent-label-text">Accento</span>
          <select
            className="board-accent-select"
            value={accent}
            onChange={onAccentChange}
            disabled={monthTheme}
            title={
              monthTheme
                ? "Disattiva «Tema mese» nei filtri per usare un accento fisso"
                : "Colore di interfaccia"
            }
            aria-label="Colore accento interfaccia"
          >
            {BOARD_ACCENT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
