/**
 * Configurazione modulo Preventivi — modificabile senza toccare la booking board.
 * Temi e testi centralizzati; dati lodge: solo elementi indicati dal gestore.
 */

export const quoteThemeIds = ["blu-oro", "avorio-navy", "smeraldo-oro"] as const;
export type QuoteThemeId = (typeof quoteThemeIds)[number];

/** Palette per tema (UI preventivi + variabili template) */
export const quoteThemes: Record<
  QuoteThemeId,
  {
    label: string;
    /** Variabili CSS su .quotes-page[data-theme] */
    vars: Record<string, string>;
  }
> = {
  "blu-oro": {
    label: "Blu / oro",
    vars: {
      "--q-navy": "#0a1628",
      "--q-navy-mid": "#152a45",
      "--q-gold": "#c9a227",
      "--q-gold-soft": "#e8d48b",
      "--q-cream": "#f8f6f0",
      "--q-text": "#e8ecf4",
      "--q-muted": "#9ca8bc",
      "--q-border": "rgba(201, 162, 39, 0.35)",
      "--qt-body-bg": "#f8f6f0",
      "--qt-body-text": "#1a1f2e",
      "--qt-header-1": "#0a1628",
      "--qt-header-2": "#1a3352",
      "--qt-header-text": "#f8f6f0",
      "--qt-badge-text": "#0a1628",
      "--qt-badge-bg-1": "#e8d48b",
      "--qt-badge-bg-2": "#c9a227",
      "--qt-section-accent": "#0a1628",
      "--qt-section-border": "#c9a227",
      "--qt-box-bg": "#f1f4f8",
      "--qt-box-border": "#d9e2ec",
      "--qt-box-label": "#4a5568",
      "--qt-econ-1": "#0a1628",
      "--qt-econ-2": "#132337",
      "--qt-econ-text": "#f8f6f0",
      "--qt-econ-total": "#e8d48b",
      "--qt-cta-bg": "#fffdf8",
      "--qt-footer": "#718096",
      "--qt-bank-bg": "#0f172a",
      "--qt-bank-text": "#f1f5f9",
      "--qt-bank-iban-bg": "#020617",
      "--qt-bank-accent": "#c9a227",
    },
  },
  "avorio-navy": {
    label: "Avorio / navy",
    vars: {
      "--q-navy": "#1e293b",
      "--q-navy-mid": "#334155",
      "--q-gold": "#b45309",
      "--q-gold-soft": "#fcd34d",
      "--q-cream": "#faf8f3",
      "--q-text": "#1e293b",
      "--q-muted": "#64748b",
      "--q-border": "rgba(30, 41, 59, 0.2)",
      "--qt-body-bg": "#faf8f3",
      "--qt-body-text": "#1e293b",
      "--qt-header-1": "#1e293b",
      "--qt-header-2": "#334155",
      "--qt-header-text": "#faf8f3",
      "--qt-badge-text": "#faf8f3",
      "--qt-badge-bg-1": "#b45309",
      "--qt-badge-bg-2": "#92400e",
      "--qt-section-accent": "#1e293b",
      "--qt-section-border": "#b45309",
      "--qt-box-bg": "#f1f5f9",
      "--qt-box-border": "#cbd5e1",
      "--qt-box-label": "#475569",
      "--qt-econ-1": "#1e293b",
      "--qt-econ-2": "#0f172a",
      "--qt-econ-text": "#f8fafc",
      "--qt-econ-total": "#fcd34d",
      "--qt-cta-bg": "#fffbeb",
      "--qt-footer": "#64748b",
      "--qt-bank-bg": "#1e293b",
      "--qt-bank-text": "#f8fafc",
      "--qt-bank-iban-bg": "#0f172a",
      "--qt-bank-accent": "#fcd34d",
    },
  },
  "smeraldo-oro": {
    label: "Smeraldo / oro",
    vars: {
      "--q-navy": "#064e3b",
      "--q-navy-mid": "#065f46",
      "--q-gold": "#d4a574",
      "--q-gold-soft": "#ecd9b8",
      "--q-cream": "#f4f7f5",
      "--q-text": "#ecfdf5",
      "--q-muted": "#a7f3d0",
      "--q-border": "rgba(212, 165, 116, 0.4)",
      "--qt-body-bg": "#f4f7f5",
      "--qt-body-text": "#134e4a",
      "--qt-header-1": "#064e3b",
      "--qt-header-2": "#047857",
      "--qt-header-text": "#ecfdf5",
      "--qt-badge-text": "#064e3b",
      "--qt-badge-bg-1": "#ecd9b8",
      "--qt-badge-bg-2": "#d4a574",
      "--qt-section-accent": "#064e3b",
      "--qt-section-border": "#d4a574",
      "--qt-box-bg": "#ecfdf5",
      "--qt-box-border": "#a7f3d0",
      "--qt-box-label": "#115e59",
      "--qt-econ-1": "#064e3b",
      "--qt-econ-2": "#022c22",
      "--qt-econ-text": "#ecfdf5",
      "--qt-econ-total": "#ecd9b8",
      "--qt-cta-bg": "#f0fdf4",
      "--qt-footer": "#0f766e",
      "--qt-bank-bg": "#022c22",
      "--qt-bank-text": "#ecfdf5",
      "--qt-bank-iban-bg": "#011a15",
      "--qt-bank-accent": "#d4a574",
    },
  },
};

/** @deprecated usare quoteThemes[id].vars */
export const quoteTheme = {
  navy: "#0a1628",
  navyMid: "#132337",
  gold: "#c9a227",
  goldLight: "#e8d48b",
  cream: "#f8f6f0",
  text: "#e8ecf4",
  textMuted: "#9ca8bc",
} as const;

export const villaContact = {
  name: "Villa Olimpia",
  email: "villaolimpiacaporizzuto@gmail.com",
  whatsappDigits: "393XXXXXXXXX",
  phoneDisplay: "—",
  addressLine: "Capo Rizzuto (KR), Calabria",
  websiteNote: "Prenotazioni e informazioni su richiesta via email o WhatsApp.",
} as const;

export const bankDetails = {
  iban: "IT30S0344214239000049214802",
  bic: "WIDIITMM",
  accountHolder: "Nigro Francesco",
} as const;

export const policies = {
  depositPercent: 30,
  depositLabel: "Acconto alla prenotazione",
  balanceLabel: "Saldo al check-in",
  cancellationFreeDays: 30,
  cancellationFree:
    "Cancellazione gratuita se comunicata entro 30 giorni prima dell’arrivo.",
  cancellationAfter:
    "Oltre tale termine l’acconto versato non è rimborsabile, salvo diversa pattuizione scritta.",
  bookingNote:
    "La prenotazione si intende confermata dopo il versamento dell’acconto indicato e la ricezione di conferma da parte della struttura.",
  touristTaxNote:
    "Tassa di soggiorno: importo stimato in base a numero ospiti e notti; conferma definitiva al check-in secondo normativa locale.",
} as const;

/** Testi struttura documento preventivo / proposta (allineati al flusso commerciale reale). */
export const quoteDocument = {
  docTitle: "Proposta di soggiorno",
  docBadge: "Preventivo strutturato",
  /** Intestazione copertina: sottotitolo istituzionale */
  headerTagline: "Villa ricettiva — Capo Rizzuto (KR), Calabria",
  /** Intro personalizzata: il nome cliente viene interpolato in QuoteTemplate */
  clientGreetingLead: "Gentile",
  availabilityIntro:
    "In base al periodo e al numero di ospiti indicati, verifichiamo la disponibilità del calendario lodge e proponiamo la soluzione più coerente con le vostre esigenze. Eventuali alternative (date o tipologia alloggio) vengono comunicate in fase di confronto diretto.",
  choiceGuide:
    "Per orientare la scelta: lodge con maggiore capienza o più ambienti (es. Giglio, Frangipane, Geranio) sono spesso indicate per famiglie o gruppi; soluzioni più compatte possono risultare ideali per coppie o soggiorni brevi. La proposta economica sotto riportata si riferisce esclusivamente alla lodge selezionata nel modulo.",
  villaLead:
    "Villa Olimpia è una struttura ricettiva immersa nel verde, con gestione diretta: prenotazioni, pagamenti e assistenza in soggiorno con comunicazioni chiare e tempestive.",
  compareFootnote:
    "Il confronto è indicativo su composizione e caratteristiche descrittive. Tariffe e disponibilità della seconda lodge non sono incluse in questo preventivo salvo esplicita integrazione scritta.",
  economicSolutionLead:
    "Importi riferiti alla soluzione lodge indicata nel riquadro proposta. Acconto e saldo sono calcolati sul totale complessivo (soggiorno, extra selezionati, tassa di soggiorno stimata).",
  bookingSteps: [
    "Confermare via email o WhatsApp interesse per il periodo e la lodge proposta.",
    "Ricevere da Villa Olimpia conferma di disponibilità e istruzioni per l’acconto.",
    "Effettuare il bonifico dell’acconto (30%) e inviare la ricevuta.",
    "Ricevere conferma scritta di prenotazione; saldo (70%) al check-in come da condizioni.",
  ] as const,
} as const;

/** Lodge: descrizioni + metadati strutturali solo se indicati dal gestore (no supposizioni). */
export const quoteLodges = [
  {
    id: "Frangipane",
    name: "Frangipane",
    shortDescription:
      "Fino a 6 posti letto. Ambiente luminoso e curato, ideale per chi cerca comfort e spazio.",
    maxGuests: 6,
  },
  {
    id: "Fiordaliso",
    name: "Fiordaliso",
    shortDescription:
      "Lodge accogliente con ambienti curati; disposizione interna e dotazioni confermate in struttura.",
  },
  {
    id: "Giglio",
    name: "Giglio",
    shortDescription:
      "Fino a 5 posti letto. Soluzione equilibrata per famiglie o piccoli gruppi.",
    maxGuests: 5,
  },
  {
    id: "Tulipano",
    name: "Tulipano",
    shortDescription:
      "Ambiente riservato e curato; dettagli di layout e servizi su conferma diretta.",
  },
  {
    id: "Orchidea",
    name: "Orchidea",
    shortDescription:
      "Dotazione con 2 bagni. Spazi armoniosi per un soggiorno comodo in villa.",
  },
  {
    id: "Lavanda",
    name: "Lavanda",
    shortDescription:
      "Atmosfera rilassante tra gli spazi verdi della struttura; organizzazione interna su richiesta.",
  },
  {
    id: "Geranio",
    name: "Geranio",
    shortDescription:
      "Soluzione completa con 2 camere da letto e 2 bagni; adatta a famiglie che cercano praticità.",
    bedrooms: 2,
  },
  {
    id: "Gardenia",
    name: "Gardenia",
    shortDescription:
      "Due balconi. Spazi armoniosi per un soggiorno rilassante con affaccio esterno.",
  },
  {
    id: "Azalea",
    name: "Azalea",
    shortDescription:
      "Terrazza semipanoramica. Soluzione elegante vicino agli spazi comuni e al verde.",
  },
] as const;

export type QuoteLodgeId = (typeof quoteLodges)[number]["id"];
export type QuoteLodge = (typeof quoteLodges)[number];

/** Dettaglio descrittivo per sezione lodge / confronto (oltre a shortDescription). */
export const lodgeQuoteExtras: Partial<
  Record<
    QuoteLodgeId,
    {
      compositionNote: string;
      strengths: readonly string[];
      equipment: readonly string[];
    }
  >
> = {
  Frangipane: {
    compositionNote:
      "Fino a 6 posti letto. Ambiente luminoso e spazioso, adatto a famiglie numerose o gruppi che cercano comfort.",
    strengths: [
      "Elevata capienza",
      "Ambienti luminosi",
      "Adatta a soggiorni di media e lunga durata",
    ],
    equipment: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Dotazioni bagno e camere secondo planimetria in struttura",
    ],
  },
  Giglio: {
    compositionNote:
      "Fino a 5 posti letto. Soluzione equilibrata tra spazio e gestione pratica del soggiorno.",
    strengths: [
      "Bilanciamento spazio / comfort",
      "Adatta a famiglie e piccoli gruppi",
      "Soggiorno tranquillo in contesto villa",
    ],
    equipment: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Disposizione interna confermata al check-in",
    ],
  },
  Orchidea: {
    compositionNote:
      "Dotazione con 2 bagni; spazi armoniosi per un soggiorno comodo in villa.",
    strengths: [
      "Due bagni",
      "Spazi curati",
      "Adatta a nuclei che privilegiano praticità",
    ],
    equipment: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Secondo bagno per maggiore comodità",
    ],
  },
  Geranio: {
    compositionNote:
      "Due camere da letto e due bagni; organizzazione interna adatta a famiglie.",
    strengths: [
      "Layout con 2 camere e 2 bagni",
      "Praticità per famiglie",
      "Ambiente riservato in villa",
    ],
    equipment: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Camere e bagni secondo scheda struttura",
    ],
  },
};

export function lodgeQuotePresentation(lodge: QuoteLodge): {
  composition: string;
  strengths: string[];
  equipment: string[];
} {
  const extras = lodgeQuoteExtras[lodge.id];
  return {
    composition: extras?.compositionNote ?? lodge.shortDescription,
    strengths: extras?.strengths
      ? [...extras.strengths]
      : [lodge.shortDescription],
    equipment: extras?.equipment
      ? [...extras.equipment]
      : [
          "Dotazioni e disposizione interna confermate in struttura al momento del check-in.",
        ],
  };
}

/** Riga riassuntiva capienza / camere (solo campi presenti sulla lodge). */
export function lodgeStructuralLine(lodge: QuoteLodge): string | null {
  const row = lodge as Record<string, unknown>;
  const parts: string[] = [];
  const mg = row.maxGuests;
  const br = row.bedrooms;
  if (typeof mg === "number" && Number.isFinite(mg)) {
    parts.push(`Capienza massima: ${mg} posti letto`);
  }
  if (typeof br === "number" && Number.isFinite(br)) {
    parts.push(`${br} camere da letto`);
  }
  return parts.length ? parts.join(" · ") : null;
}

export const villaIntro = {
  title: "Perché Villa Olimpia",
  paragraph:
    "Villa Olimpia è una struttura ricettiva immersa nel verde, con gestione diretta: prenotazioni, pagamenti e assistenza in soggiorno con risposte chiare. Pensata per chi cerca tranquillità, spazi esterni curati e un’accoglienza professionale sul territorio di Capo Rizzuto.",
} as const;

export const villaStructure = {
  pool: "Area piscina per relax e tempo libero (utilizzo secondo regolamento interno e stagionalità).",
  garden: "Giardino e spazi esterni curati per vivere l’aperto in sicurezza.",
  beach:
    "Vicinanza al litorale ionico e alle spiagge della zona, inclusa l’area di Spiaggia dei Gigli; tempi di percorrenza verso la spiaggia prescelta variabili in base alla destinazione.",
  territory:
    "Territorio di Capo Rizzuto (KR): mare, natura e servizi locali raggiungibili in auto; suggerimenti su itinerari e spiagge su richiesta in fase di soggiorno.",
  sea: "Posizione favorevole verso il litorale ionico; tempi di percorrenza verso spiagge e punti di interesse variabili in base alla destinazione scelta.",
} as const;

/** Servizi con icona: nessuna promessa tecnica non verificabile */
export const villaAmenityLines = [
  {
    key: "wifi",
    label: "Wi‑Fi",
    detail: "Copertura e accesso confermati al check-in.",
  },
  {
    key: "parking",
    label: "Parcheggio",
    detail: "Disponibilità in base al periodo; dettagli in conferma prenotazione.",
  },
] as const;

export const pricingDefaults = {
  sanitizationExtra: 50,
  petEnvironmentSanitization: 50,
  touristTaxPerPersonPerNight: 2,
} as const;

export const discountOptions = [
  { value: 0, label: "Nessuno" },
  { value: 5, label: "Sconto 5%" },
  { value: 10, label: "Sconto 10%" },
] as const;
