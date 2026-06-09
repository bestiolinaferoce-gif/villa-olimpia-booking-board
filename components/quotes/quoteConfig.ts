/**
 * Configurazione modulo Preventivi — modificabile senza toccare la booking board.
 * Temi e testi centralizzati; dati lodge: solo elementi indicati dal gestore.
 */

export const quoteThemeIds = ["blu-oro", "avorio-navy", "smeraldo-oro"] as const;
export type QuoteThemeId = (typeof quoteThemeIds)[number];

/** Palette per tema (UI preventivi + variabili template) */
/** Palette documento preventivo: caldo, leggibile, mai navy a piena sezione. */
const mediterraneanTemplateVars: Record<string, string> = {
  "--qt-body-bg": "#FAFAF8",
  "--qt-body-text": "#1B2A4A",
  "--qt-header-1": "#FAFAF8",
  "--qt-header-2": "#FAFAF8",
  "--qt-header-text": "#1B2A4A",
  "--qt-badge-text": "#1B2A4A",
  "--qt-badge-bg-1": "transparent",
  "--qt-badge-bg-2": "transparent",
  "--qt-section-accent": "#1B2A4A",
  "--qt-section-border": "#C9A84C",
  "--qt-accent-turquoise": "#00A896",
  "--qt-box-bg": "#ffffff",
  "--qt-box-border": "rgba(27, 42, 74, 0.12)",
  "--qt-box-label": "#4a5568",
  "--qt-econ-bg": "#ffffff",
  "--qt-econ-row-border": "rgba(27, 42, 74, 0.08)",
  "--qt-econ-text": "#1B2A4A",
  "--qt-econ-total-bg": "rgba(201, 168, 76, 0.14)",
  "--qt-econ-total": "#1B2A4A",
  "--qt-cta-bg": "#FAFAF8",
  "--qt-footer": "#64748b",
  "--qt-bank-bg": "#ffffff",
  "--qt-bank-text": "#1B2A4A",
  "--qt-bank-iban-bg": "#F3F1EC",
  "--qt-bank-accent": "#C9A84C",
};

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
      "--q-navy": "#1B2A4A",
      "--q-navy-mid": "#2d3f5c",
      "--q-gold": "#C9A84C",
      "--q-gold-soft": "#d4b86a",
      "--q-cream": "#FAFAF8",
      "--q-text": "#1B2A4A",
      "--q-muted": "#5c6b8a",
      "--q-border": "rgba(201, 168, 76, 0.45)",
      ...mediterraneanTemplateVars,
    },
  },
  "avorio-navy": {
    label: "Avorio / navy",
    vars: {
      "--q-navy": "#1B2A4A",
      "--q-navy-mid": "#2d3f5c",
      "--q-gold": "#C9A84C",
      "--q-gold-soft": "#d4b86a",
      "--q-cream": "#FAFAF8",
      "--q-text": "#1B2A4A",
      "--q-muted": "#5c6b8a",
      "--q-border": "rgba(27, 42, 74, 0.15)",
      ...mediterraneanTemplateVars,
    },
  },
  "smeraldo-oro": {
    label: "Smeraldo / oro",
    vars: {
      "--q-navy": "#1B2A4A",
      "--q-navy-mid": "#0f766e",
      "--q-gold": "#C9A84C",
      "--q-gold-soft": "#d4b86a",
      "--q-cream": "#FAFAF8",
      "--q-text": "#1B2A4A",
      "--q-muted": "#5c6b8a",
      "--q-border": "rgba(0, 168, 150, 0.25)",
      ...mediterraneanTemplateVars,
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
  /** URL sito ufficiale (senza barra finale). */
  websiteUrl: "https://villaolimpiacaporizzuto.com",
  /** Cifre internazionali senza + (es. "393331234567"). Stringa vuota = nessun link WhatsApp nel PDF. */
  whatsappDigits: "393335773390",
  /** Numero visualizzato testualmente. Stringa vuota = non mostrato nel PDF. */
  phoneDisplay: "+39 333 577 3390 · +39 329 047 9193",
  addressLine: "Località Capo Piccolo, 88841 Isola di Capo Rizzuto (KR), Calabria",
  websiteNote: "Prenotazioni e informazioni su villaolimpiacaporizzuto.com, via email o WhatsApp.",
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

/**
 * Lodge: metadati strutturali e descrizioni allineati alla scheda ufficiale
 * Villa Olimpia (sito villaolimpiacaporizzuto.com — fonte aggiornata).
 * Capienza, camere e caratteristiche distintive verificate. floor = piano,
 * sqm = metratura (dove dichiarata).
 */
export const quoteLodges = [
  {
    id: "Frangipane",
    name: "Frangipane",
    shortDescription:
      "Piano terra, 45 mq, 2 camere matrimoniali e veranda privata: fino a 6 ospiti, ideale per famiglie o gruppi.",
    floor: "Piano terra",
    sqm: 45,
    maxGuests: 6,
    bedrooms: 2,
  },
  {
    id: "Fiordaliso",
    name: "Fiordaliso",
    shortDescription:
      "Piano terra con balcone vista piscina: ambienti luminosi, ideale per coppie e famiglie 2+2 (fino a 4 ospiti).",
    floor: "Piano terra",
    maxGuests: 4,
    bedrooms: 1,
  },
  {
    id: "Giglio",
    name: "Giglio",
    shortDescription:
      "Piano terra con due camere (una collegata) e gazebo esterno: 5/6 posti, perfetto per famiglie e piccoli gruppi.",
    floor: "Piano terra",
    maxGuests: 6,
    bedrooms: 2,
  },
  {
    id: "Tulipano",
    name: "Tulipano",
    shortDescription:
      "Piano terra con accesso diretto al giardino e patio privato, vicino alla piscina: fino a 4 ospiti.",
    floor: "Piano terra",
    maxGuests: 4,
    bedrooms: 1,
  },
  {
    id: "Orchidea",
    name: "Orchidea",
    shortDescription:
      "Primo piano con doppi servizi (1 camera + 2 bagni) e vista mare: comfort raro, fino a 4 ospiti.",
    floor: "Primo piano",
    maxGuests: 4,
    bedrooms: 1,
  },
  {
    id: "Lavanda",
    name: "Lavanda",
    shortDescription:
      "Primo piano con veranda e portico privati: soluzione tranquilla per coppie e piccole famiglie (fino a 4 ospiti).",
    floor: "Primo piano",
    maxGuests: 4,
    bedrooms: 1,
  },
  {
    id: "Geranio",
    name: "Geranio",
    shortDescription:
      "Attico premium 65 mq: 2 camere, 2 bagni e 2 balconcini semipanoramici arredati. La soluzione di punta, fino a 6 ospiti.",
    floor: "Attico",
    sqm: 65,
    maxGuests: 6,
    bedrooms: 2,
    premium: true,
  },
  {
    id: "Gardenia",
    name: "Gardenia",
    shortDescription:
      "Primo piano con 2 balconi vista mare Ionio: ambienti luminosi, ideale per coppie e famiglie 2+2 (fino a 4 ospiti).",
    floor: "Primo piano",
    maxGuests: 4,
    bedrooms: 1,
  },
  {
    id: "Azalea",
    name: "Azalea",
    shortDescription:
      "Primo piano con terrazza semipanoramica vista mare: soluzione luminosa per coppie e famiglie 2+2 (fino a 4 ospiti).",
    floor: "Primo piano",
    maxGuests: 4,
    bedrooms: 1,
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
    premiumLead: "Piano terra spazioso con due camere matrimoniali e veranda privata — ideale per famiglie e gruppi fino a 6 ospiti.",
    compositionDetail:
      "45 mq al piano terra: due camere matrimoniali, zona giorno con cucina attrezzata e veranda privata. Soluzione comoda per famiglie o gruppi fino a 6 ospiti, con accesso facile e spazi ben distribuiti.",
    outdoorNote:
      "Veranda privata per relax e pasti all’aperto, affacciata sul giardino della struttura.",
    distinctive: [
      "Due camere matrimoniali (fino a 6 ospiti)",
      "Veranda privata sul giardino",
      "Piano terra comodo, ideale per soggiorni lunghi",
    ],
    amenities: [
      "Cucina completa attrezzata",
      "Climatizzazione",
      "Wi-Fi e posto auto riservato",
    ],
  },
  Giglio: {
    premiumLead: "Piano terra con due camere (una collegata) e gazebo esterno — 5/6 posti, perfetto per famiglie e piccoli gruppi.",
    compositionDetail:
      "Piano terra con due camere da letto, di cui una collegata all’altra — distribuzione comoda per famiglie con bambini o gruppi che vogliono restare vicini (5/6 posti). Zona living, cucina ampia e zona pranzo interna. Vicino alla piscina.",
    outdoorNote:
      "Gazebo esterno dedicato: ideale per colazioni e cene all’aperto. A pochi passi dalla piscina.",
    distinctive: [
      "Due camere, di cui una collegata (5/6 posti)",
      "Gazebo esterno privato",
      "Posizione comoda, vicino alla piscina",
    ],
    amenities: [
      "Cucina attrezzata con zona cottura e ripiani ampi",
      "Climatizzazione",
      "Zona living separata dalla zona notte",
    ],
  },
  Orchidea: {
    premiumLead: "Primo piano con doppi servizi e vista mare: una camera e due bagni completi — un comfort raro a questo livello.",
    compositionDetail:
      "Primo piano con una camera da letto, due bagni completi, cucina attrezzata e zona giorno, con vista mare. Soluzione pensata per chi privilegia praticità e comfort in bagno per più ospiti (fino a 4).",
    outdoorNote: "Affaccio con vista mare dal primo piano.",
    distinctive: [
      "Doppi servizi (1 camera + 2 bagni): comfort raro",
      "Vista mare dal primo piano",
      "Ideale per coppie e famiglie 2+2",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Wi-Fi e posto auto riservato",
    ],
  },
  Geranio: {
    premiumLead: "Attico premium 65 mq: 2 camere, 2 bagni e 2 balconcini semipanoramici arredati — la soluzione di punta di Villa Olimpia, fino a 6 ospiti.",
    compositionDetail:
      "Attico di 65 mq con due camere da letto, due bagni, cucina attrezzata e zona giorno. Due balconcini semipanoramici arredati. Soluzione premium della villa: posizione elevata, maggiore riservatezza e ambienti ampi, fino a 6 ospiti.",
    outdoorNote: "Due balconcini semipanoramici arredati, affacciati sul contesto della struttura.",
    distinctive: [
      "Attico premium: la soluzione di punta della villa",
      "65 mq, 2 camere e 2 bagni (fino a 6 ospiti)",
      "Due balconcini semipanoramici arredati",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Wi-Fi e posto auto riservato",
    ],
  },
  Gardenia: {
    premiumLead: "Primo piano luminoso con due balconi vista mare Ionio — ideale per coppie e famiglie 2+2.",
    compositionDetail:
      "Primo piano con due balconi affacciati sul mare Ionio, cucina attrezzata, zona giorno e camera curata. Ambienti luminosi pensati per chi ama alternare vita in lodge e momenti all’aperto sul proprio balcone (fino a 4 ospiti).",
    outdoorNote: "Due balconi con vista sul mare Ionio.",
    distinctive: [
      "Due balconi con vista mare Ionio",
      "Ambienti luminosi",
      "Ideale per coppie e famiglie 2+2",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Wi-Fi e posto auto riservato",
    ],
  },
  Azalea: {
    premiumLead: "Primo piano con terrazza semipanoramica vista mare: luminosa e ben posizionata, per coppie e famiglie 2+2.",
    compositionDetail:
      "Primo piano con terrazza semipanoramica affacciata sul mare, cucina attrezzata, zona notte e giorno organizzata per soggiorni rilassanti. Soluzione luminosa e ben posizionata (fino a 4 ospiti).",
    outdoorNote: "Terrazza semipanoramica con vista mare, attrezzata per il relax all’aperto.",
    distinctive: [
      "Terrazza semipanoramica con vista mare",
      "Ambiente luminoso ed elegante",
      "Ideale per coppie e famiglie 2+2",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Wi-Fi e posto auto riservato",
    ],
  },
  Tulipano: {
    premiumLead: "Piano terra con accesso diretto al giardino e patio privato, a pochi passi dalla piscina.",
    compositionDetail:
      "Piano terra con accesso diretto al giardino e patio privato, cucina attrezzata e zona notte. Posizione comoda vicino alla piscina, ideale per famiglie e coppie (fino a 4 ospiti).",
    outdoorNote: "Patio privato con accesso diretto al giardino, vicino alla piscina.",
    distinctive: [
      "Accesso diretto al giardino + patio privato",
      "Posizione comoda vicino alla piscina",
      "Ideale per famiglie e coppie",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Wi-Fi e posto auto riservato",
    ],
  },
  Lavanda: {
    premiumLead: "Primo piano con veranda e portico privati: soluzione tranquilla per coppie e piccole famiglie.",
    compositionDetail:
      "Primo piano con veranda e portico privati, cucina attrezzata e zona notte. Ambiente riservato e tranquillo, ideale per coppie e piccole famiglie (fino a 4 ospiti).",
    outdoorNote: "Veranda e portico privati per il relax all’aperto.",
    distinctive: [
      "Veranda e portico privati",
      "Atmosfera tranquilla e riservata",
      "Ideale per coppie e piccole famiglie",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Wi-Fi e posto auto riservato",
    ],
  },
  Fiordaliso: {
    premiumLead: "Piano terra con balcone vista piscina: ambienti luminosi per coppie e famiglie 2+2.",
    compositionDetail:
      "Piano terra con balcone affacciato sulla piscina, cucina attrezzata, zona giorno e camera luminosa. Soluzione ideale per coppie e famiglie 2+2 (fino a 4 ospiti).",
    outdoorNote: "Balcone con vista sulla piscina.",
    distinctive: [
      "Balcone vista piscina",
      "Ambienti luminosi e ordinati",
      "Ideale per coppie e famiglie 2+2",
    ],
    amenities: [
      "Cucina attrezzata",
      "Climatizzazione",
      "Wi-Fi e posto auto riservato",
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

/** Riga riassuntiva strutturale (piano · metratura · capienza · camere). */
export function lodgeStructuralLine(lodge: QuoteLodge): string | null {
  const row = lodge as Record<string, unknown>;
  const parts: string[] = [];
  const floor = row.floor;
  const sqm = row.sqm;
  const mg = row.maxGuests;
  const br = row.bedrooms;
  if (typeof floor === "string" && floor.trim()) {
    parts.push(floor);
  }
  if (typeof sqm === "number" && Number.isFinite(sqm)) {
    parts.push(`${sqm} mq`);
  }
  if (typeof mg === "number" && Number.isFinite(mg)) {
    parts.push(`fino a ${mg} ospiti`);
  }
  if (typeof br === "number" && Number.isFinite(br)) {
    parts.push(br === 1 ? "1 camera da letto" : `${br} camere da letto`);
  }
  return parts.length ? parts.join(" · ") : null;
}

/**
 * Mappa digitale della villa mostrata nei preventivi.
 * `src` punta a un file in public/. Se il file non esiste, la sezione si
 * nasconde automaticamente (onError). Per attivarla: copia il PNG in
 * public/mappa-villa.png (o cambia src qui).
 */
export const villaMap = {
  src: "/mappa-villa.png",
  caption:
    "Disposizione dei 9 lodge di Villa Olimpia a Capo Piccolo, con piscina, giardino e accesso alla Spiaggia dei Gigli (~100 m).",
} as const;

export const villaIntro = {
  title: "Perché Villa Olimpia",
  paragraph:
    "Villa Olimpia è una struttura ricettiva immersa nel verde, con gestione diretta: prenotazioni, pagamenti e assistenza in soggiorno con risposte chiare. Pensata per chi cerca tranquillità, spazi esterni curati e un’accoglienza professionale sul territorio di Capo Rizzuto.",
} as const;

export const villaStructure = {
  pool: "Piscina della struttura, condivisa tra gli ospiti dei lodge, con solarium e gazebo (utilizzo secondo regolamento interno e stagionalità).",
  garden: "Giardino di circa 3.000 mq e spazi esterni curati per vivere l’aperto in sicurezza.",
  /** Contesto verde struttura (cifra indicativa del complesso; verificare in struttura se necessario). */
  gardenScale:
    "Il complesso si sviluppa tra ampi spazi verdi (ordine di grandezza indicativo ~3.000 mq di giardino e aree esterne condivise e curate), ideali per relax tra una giornata al mare e il rientro in lodge.",
  beach:
    "A circa 100 metri dalla Spiaggia dei Gigli (~1 minuto a piedi), nell'Area Marina Protetta di Capo Rizzuto — Bandiera Blu 2026. Nei dintorni: Spiaggia di Capo Piccolo (5 min auto), Spiagge Rosse (10 min), Le Castella (20 min).",
  territory:
    "Capo Rizzuto (KR): territorio tra mare Ionio, natura e borghi. In prossimità: Area Marina Protetta Capo Rizzuto, il borgo e il castello di Le Castella, itinerari verso spiagge e servizi locali.",
  sea: "Posizione favorevole verso il litorale ionico; tempi di percorrenza verso spiagge e punti di interesse variabili in base alla destinazione scelta.",
} as const;

/** Punti territorio con chiave icona (lucide) per il template */
export const villaTerritoryPoints = [
  {
    key: "gigli",
    icon: "waves" as const,
    title: "Spiaggia dei Gigli — a ~100 m",
    text: "La struttura dista circa 100 metri dalla Spiaggia dei Gigli (~1 minuto a piedi), nell'Area Marina Protetta di Capo Rizzuto — Bandiera Blu 2026.",
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
