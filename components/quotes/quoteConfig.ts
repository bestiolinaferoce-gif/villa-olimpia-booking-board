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
  /** Cifre internazionali senza + (es. "393331234567"). Stringa vuota = nessun link WhatsApp nel PDF. */
  whatsappDigits: "",
  /** Numero visualizzato testualmente. Stringa vuota = non mostrato nel PDF. */
  phoneDisplay: "",
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
    "La disponibilità del calendario lodge viene verificata in fase di compilazione del preventivo. La proposta viene formulata solo su periodi risultati liberi al momento della generazione del documento. Eventuali variazioni successive (nuove prenotazioni ricevute tra la generazione e la conferma) vengono comunicate tempestivamente: la prenotazione si considera confermata solo dopo versamento dell'acconto.",
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
  /** Copertina: messaggio breve prima del dettaglio pagine successive */
  coverIntro:
    "Ci pregiamo di presentarVi questa proposta di soggiorno presso Villa Olimpia, redatta con cura su misura per il periodo e la soluzione lodge indicate.",
  englishNote:
    "Su richiesta via email è disponibile una sintesi in inglese della presente proposta.",
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

/**
 * Profilo preventivo per lodge: testi specifici (non generici ripetuti).
 * Composizione e dotazioni allineate a nome lodge / metadati noti (maxGuests, bedrooms, shortDescription).
 */
export type LodgeQuoteProfile = {
  /** Sottotitolo hero (1 riga, specifico) */
  premiumLead: string;
  /** Composizione interna descritta in modo concreto */
  compositionDetail: string;
  /** Spazio esterno dedicato, se applicabile; null se non dichiarato */
  outdoorNote: string | null;
  /** Punti distintivi della soluzione */
  distinctive: readonly string[];
  /** Dotazioni principali */
  amenities: readonly string[];
};

const LODGE_QUOTE_PROFILES = {
  Frangipane: {
    premiumLead: "Lodge ampia e luminosa — la più capiente della villa, ideale per famiglie numerose.",
    compositionDetail:
      "Fino a 6 posti letto. Disposizione su più ambienti: zona giorno spaziosa, cucina attrezzata e camere da letto luminose. Layout pensato per gruppi che vogliono condividere gli spazi senza rinunciare al comfort.",
    outdoorNote:
      "Spazio esterno riservato alla lodge per relax all’aperto (dettagli su arredo esterno confermati in struttura).",
    distinctive: [
      "Massima capienza tra le lodge (6 ospiti)",
      "Ambienti luminosi e distribuzione su più stanze",
      "Adatta a soggiorni di una settimana o più",
    ],
    amenities: [
      "Cucina completa attrezzata",
      "Climatizzazione",
      "Bagni e camere secondo planimetria in struttura",
    ],
  },
  Giglio: {
    premiumLead: "Tra le lodge più richieste: bilanciamento perfetto tra spazio notte, cucina e vita all’aperto.",
    compositionDetail:
      "Fino a 5 posti letto. Due camere da letto (camera matrimoniale e camera con letto alla francese / una piazza e mezza), zona living, cucina ampia con spazio per la preparazione dei pasti e zona pranzo interna.",
    outdoorNote:
      "Spazio esterno con gazebo: ideale per colazioni e cene all’aperto nella stagione adatta.",
    distinctive: [
      "Doppia camera da letto con distribuzione chiara per famiglie",
      "Cucina generosa rispetto alla media lodge",
      "Gazebo per uso esterno dedicato",
    ],
    amenities: [
      "Cucina attrezzata con zona cottura e ripiani ampi",
      "Climatizzazione",
      "Zona living separata dalla zona notte",
    ],
  },
  Orchidea: {
    premiumLead: "Layout compatto con doppio servizio: una camera e due bagni completi.",
    compositionDetail:
      "Composizione con una camera da letto, due bagni completi, cucina attrezzata e zona giorno. Soluzione pensata per chi privilegia praticità mattutina e comfort in bagno per più ospiti.",
    outdoorNote: null,
    distinctive: [
      "Due bagni completi con una sola camera da letto",
      "Ottima per coppie che ospitano occasionalmente altri ospiti",
      "Spazi armoniosi e curati in contesto villa",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Secondo bagno con doccia / servizi secondo scheda struttura",
    ],
  },
  Geranio: {
    premiumLead: "Due camere e due bagni: organizzazione familiare senza compromessi.",
    compositionDetail:
      "Due camere da letto e due bagni, cucina attrezzata e zona giorno. Distribuzione classica per famiglie con bambini o due coppie che viaggiano insieme.",
    outdoorNote: null,
    distinctive: [
      "Simmetria 2 camere / 2 bagni",
      "Praticità per soggiorni di media durata",
      "Ambiente riservato all’interno della villa",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Dotazioni camere e bagni secondo scheda lodge",
    ],
  },
  Gardenia: {
    premiumLead: "Luce e aria: due balconi per godere del contesto verde della struttura.",
    compositionDetail:
      "Lodge con due balconi affacciati sugli spazi esterni della proprietà, cucina attrezzata, zona giorno e camere da letto curate. Pensata per chi ama alternare vita in lodge e momenti all’aperto sul proprio balcone.",
    outdoorNote: "Due balconi privativi (esposizione e arredo secondo planimetria in struttura).",
    distinctive: [
      "Doppio balcone",
      "Atmosfera luminosa",
      "Vicinanza agli spazi comuni e al verde della villa",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Accesso esterno su due livelli balcone",
    ],
  },
  Azalea: {
    premiumLead: "Terrazza semipanoramica: carattere forte e vista aperta sul contesto.",
    compositionDetail:
      "Lodge con terrazza semipanoramica, cucina attrezzata, zona notte e giorno organizzata per soggiorni rilassanti. Posizione privilegiata rispetto agli spazi comuni e al verde.",
    outdoorNote: "Terrazza semipanoramica attrezzata per relax all’aperto (dettagli in struttura).",
    distinctive: [
      "Terrazza con respiro panoramico",
      "Eleganza dell’insieme architettonico",
      "Adatta a coppie e piccoli nuclei",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Spazio esterno ampio sulla terrazza",
    ],
  },
  Tulipano: {
    premiumLead: "Lodge riservata, curata nei dettagli — perfetta per chi cerca tranquillità.",
    compositionDetail:
      "Ambiente riservato e curato; disposizione interna (camere, bagni, cucina) e dotazioni confermate al check-in secondo scheda struttura. Capienza e layout ottimali per nuclei contenuti.",
    outdoorNote: null,
    distinctive: [
      "Atmosfera intima e ordinata",
      "Ideale per soggiorni brevi o romantici",
      "Gestione diretta Villa Olimpia",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Layout interno su conferma in struttura",
    ],
  },
  Lavanda: {
    premiumLead: "Tra il verde della villa: lodge dalla forte identità rilassante.",
    compositionDetail:
      "Posizionata in stretto contatto con gli spazi verdi del complesso; interni curati con cucina attrezzata e zona notte. Organizzazione precisa delle stanze comunicata in fase di prenotazione / check-in.",
    outdoorNote: "Contesto verde immediato intorno alla lodge.",
    distinctive: [
      "Forte legame con giardino e natura circostante",
      "Atmosfera distensiva",
      "Adatta a chi ama quiete e outdoor",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Scheda dotazioni completa in struttura",
    ],
  },
  Fiordaliso: {
    premiumLead: "Accoglienza classica Villa Olimpia in una lodge dagli interni curati.",
    compositionDetail:
      "Lodge accogliente con ambienti ordinati; numero di camere, bagni e disposizione esatta secondo planimetria consegnata in struttura. Adatta a coppie e piccoli gruppi in base alla capienza indicata al momento della conferma.",
    outdoorNote: null,
    distinctive: [
      "Interni curati e funzionali",
      "Ottimo rapporto qualità / semplicità d’uso",
      "Supporto gestione diretta durante il soggiorno",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Dotazioni conformi alla scheda lodge",
    ],
  },
} as const satisfies Record<QuoteLodgeId, LodgeQuoteProfile>;

export function getLodgeQuoteProfile(lodge: QuoteLodge): LodgeQuoteProfile {
  return LODGE_QUOTE_PROFILES[lodge.id];
}

/** Per tabella confronto: stessi campi del profilo in forma tabellare */
export function lodgeQuotePresentation(lodge: QuoteLodge): {
  composition: string;
  strengths: string[];
  equipment: string[];
} {
  const p = getLodgeQuoteProfile(lodge);
  return {
    composition: p.compositionDetail,
    strengths: [...p.distinctive],
    equipment: [...p.amenities],
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
  /** Contesto verde struttura (cifra indicativa del complesso; verificare in struttura se necessario). */
  gardenScale:
    "Il complesso si sviluppa tra ampi spazi verdi (ordine di grandezza indicativo ~3.000 mq di giardino e aree esterne condivise e curate), ideali per relax tra una giornata al mare e il rientro in lodge.",
  beach:
    "Vicinanza al litorale ionico e alle spiagge della zona, con riferimento all’area di Spiaggia dei Gigli; tempi di percorrenza verso la spiaggia prescelta variabili in base alla destinazione.",
  territory:
    "Capo Rizzuto (KR): territorio tra mare Ionio, natura e borghi. In prossimità: Area Marina Protetta Capo Rizzuto, il borgo e il castello di Le Castella, itinerari verso spiagge e servizi locali.",
  sea: "Posizione favorevole verso il litorale ionico; tempi di percorrenza verso spiagge e punti di interesse variabili in base alla destinazione scelta.",
} as const;

/** Punti territorio con chiave icona (lucide) per il template */
export const villaTerritoryPoints = [
  {
    key: "gigli",
    icon: "waves" as const,
    title: "Spiaggia dei Gigli",
    text: "Riferimento balneare noto sulla costa ionica calabrese; distanze e tempi di percorrenza dipendono dal punto esatto prescelto.",
  },
  {
    key: "amp",
    icon: "anchor" as const,
    title: "Area Marina Protetta",
    text: "Patrimonio naturalistico e paesaggistico della costa di Capo Rizzuto, con possibilità di escursioni e attività legate al mare.",
  },
  {
    key: "castella",
    icon: "castle" as const,
    title: "Le Castella",
    text: "Borgo e arco storico sul mare, meta classica per una passeggiata serale o una giornata tra storia e panorami.",
  },
] as const;

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
