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
  createdAt: string;
  updatedAt: string;
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
