/**
 * Meteo dimostrativo — Villa Olimpia / Capo Rizzuto.
 * Sostituire questo modulo (o solo l’export) con dati da API quando disponibili.
 */
export const CAPO_RIZZUTO_WEATHER_MOCK = {
  locationLabel: "Capo Rizzuto",
  condition: "Sereno",
  tempHighC: 24,
  tempLowC: 18,
  /** Flag interno per audit / future integrazioni */
  dataSource: "mock_static" as const,
} as const;
