/** Sezioni stampabili (modulare). Preset «Completa Carlo» = tutte true. */
export type PrintSections = {
  anagraficaCompleta: boolean;
  datiSoggiorno: boolean;
  dettaglioPrenotazione: boolean;
  riepilogoEconomicoDettagliato: boolean;
  totalePrenotazione: boolean;
  caparra: boolean;
  saldo: boolean;
  note: boolean;
};

export const PRINT_SECTIONS_FULL: PrintSections = {
  anagraficaCompleta: true,
  datiSoggiorno: true,
  dettaglioPrenotazione: true,
  riepilogoEconomicoDettagliato: true,
  totalePrenotazione: true,
  caparra: true,
  saldo: true,
  note: true,
};

/** Preset rapida: soggiorno + dettaglio + totali essenziali, senza anagrafica estesa né note. */
export const PRINT_SECTIONS_RAPIDA: PrintSections = {
  ...PRINT_SECTIONS_FULL,
  anagraficaCompleta: false,
  riepilogoEconomicoDettagliato: false,
  note: false,
};

export function mergePrintSections(partial?: Partial<PrintSections>): PrintSections {
  return { ...PRINT_SECTIONS_FULL, ...partial };
}
