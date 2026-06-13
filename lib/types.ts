export const LODGES = [
  "Frangipane",
  "Fiordaliso",
  "Giglio",
  "Tulipano",
  "Orchidea",
  "Lavanda",
  "Geranio",
  "Gardenia",
  "Azalea",
] as const;

export const BOOKING_STATUSES = ["confirmed", "option", "blocked", "cancelled"] as const;
export const BOOKING_CHANNELS = ["direct", "airbnb", "booking", "expedia", "other"] as const;

export type Lodge = (typeof LODGES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type BookingChannel = (typeof BOOKING_CHANNELS)[number];

/** Origine record (audit / n8n / merge). Opzionale per retrocompatibilità. */
export type BookingDataOrigin = "manual" | "import_json" | "import_email" | "sync" | "n8n";

export const BOOKING_DATA_ORIGINS: readonly BookingDataOrigin[] = [
  "manual",
  "import_json",
  "import_email",
  "sync",
  "n8n",
] as const;

export const BOOKING_TYPES = ["single_lodge", "whole_villa", "event"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const EVENT_TYPES = ["wedding", "reception", "birthday", "corporate", "other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: "Matrimonio",
  reception: "Ricevimento",
  birthday: "Compleanno",
  corporate: "Aziendale",
  other: "Altro",
};

export type GuestProfile = {
  surname?: string;
  firstName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  birthPlace?: string;
  birthProvince?: string;
  birthCountry?: string;
  nationality?: string;
  gender?: "M" | "F" | "";
  fiscalCode?: string;
  residence?: string;
  /** Indirizzo strutturato (opzionale, per stampa/archivio) */
  residenceCity?: string;
  residenceProvince?: string;
  residencePostalCode?: string;
  documentType?: "CARTA_IDENTITA" | "PASSAPORTO" | "PATENTE" | "PERMESSO_SOGGIORNO" | "";
  documentNumber?: string;
  documentIssuePlace?: string;
  documentIssueDate?: string;
};

export type Booking = {
  id: string;
  guestName: string;
  lodge: Lodge;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  channel: BookingChannel;
  notes: string;
  guestsCount: number;
  totalAmount: number;
  depositAmount: number;
  depositReceived: boolean;
  /** Dettaglio economico opzionale (stampa / confronto archivi) */
  extrasAmount?: number;
  cleaningFee?: number;
  touristTax?: number;
  childrenCount?: number;
  economicNotes?: string;
  createdAt: string;
  updatedAt: string;
  isNew?: boolean;
  guestProfile?: GuestProfile;
  /** Chi ha creato/ultimo merge noto (opzionale su dati legacy) */
  dataOrigin?: BookingDataOrigin;
  /** Stato pratica adempimenti (Alloggiati Web / ROSS1000) */
  reportingStatus?: GuestReportingStatus;
  /** Note operative sull'invio (es. errore ricevuto, data invio manuale) */
  reportingNotes?: string;
  /** Tipo di prenotazione. Assente = "single_lodge" per backward compatibility. */
  bookingType?: BookingType;
  /** Sottotipo evento. Valorizzato solo se bookingType === "event". */
  eventType?: EventType;
  /** ID condiviso tra i 9 record di una stessa Villa Intera. */
  wholeVillaGroupId?: string;
  /** Documenti allegati (documento ospite, ricevuta caparra, contratto, ecc.). */
  attachments?: BookingAttachment[];
};

/** Documento allegato a una prenotazione (es. documento ospite, ricevuta caparra). */
export type BookingAttachment = {
  name: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  /** Categoria opzionale. */
  kind?: "documento" | "ricevuta" | "contratto" | "altro";
};

export type BookingInput = Omit<Booking, "id" | "createdAt" | "updatedAt">;

export type BookingFilters = {
  search: string;
  status: BookingStatus | "all";
  channel: BookingChannel | "all";
  showCancelled: boolean;
};

export type BackupSnapshot = {
  createdAt: string;
  bookings: Booking[];
};

// ---------------------------------------------------------------------------
// Guest reporting pipeline (Alloggiati Web / ROSS1000)
// ---------------------------------------------------------------------------

export type GuestReportingStatus =
  | "not_ready"        // dati ospite incompleti
  | "ready"            // dati completi, pronto per invio
  | "sent_alloggiati"  // inviato ad Alloggiati Web
  | "sent_ross1000"    // inviato a ROSS1000
  | "error";           // errore ultimo tentativo

export const GUEST_REPORTING_STATUSES: readonly GuestReportingStatus[] = [
  "not_ready",
  "ready",
  "sent_alloggiati",
  "sent_ross1000",
  "error",
] as const;
