/**
 * ROSS1000 — payload builder stub.
 *
 * ROSS1000 is the management system used by some accommodation operators in
 * Calabria for registration and reporting. This file is a stub: it defines
 * the data shape and readiness check. Actual HTTP transport requires
 * credentials and endpoint URL which are not yet available.
 *
 * When credentials are available:
 *   1. Fill in `ROSS1000_ENDPOINT` and `ROSS1000_API_KEY` env vars.
 *   2. Implement `sendToRoss1000()` using `buildRoss1000Payload()`.
 *   3. Set `reportingStatus: "sent_ross1000"` on success.
 */

import type { Booking, GuestProfile } from "@/lib/types";

export type Ross1000GuestPayload = {
  /** Codice struttura assegnato da ROSS1000 */
  propertyCode: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  guest: {
    surname: string;
    firstName: string;
    gender: "M" | "F" | "";
    birthDate?: string;
    birthPlace?: string;
    birthCountry?: string;
    nationality?: string;
    fiscalCode?: string;
    documentType?: string;
    documentNumber?: string;
    documentIssuePlace?: string;
    documentIssueDate?: string;
    email?: string;
    phone?: string;
  };
  lodge: string;
  channel: string;
  totalAmount: number;
  touristTax?: number;
};

/**
 * Builds a structured payload for ROSS1000 from a booking.
 * Returns null if minimum required data is absent.
 */
export function buildRoss1000Payload(
  booking: Booking,
  propertyCode: string
): Ross1000GuestPayload | null {
  const p: GuestProfile = booking.guestProfile ?? {};
  const surname = p.surname ?? booking.guestName;
  if (!surname) return null;

  return {
    propertyCode,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guestsCount: booking.guestsCount,
    guest: {
      surname,
      firstName: p.firstName ?? "",
      gender: p.gender ?? "",
      birthDate: p.birthDate,
      birthPlace: p.birthPlace,
      birthCountry: p.birthCountry,
      nationality: p.nationality,
      fiscalCode: p.fiscalCode,
      documentType: p.documentType,
      documentNumber: p.documentNumber,
      documentIssuePlace: p.documentIssuePlace,
      documentIssueDate: p.documentIssueDate,
      email: p.email,
      phone: p.phone,
    },
    lodge: booking.lodge,
    channel: booking.channel,
    totalAmount: booking.totalAmount,
    touristTax: booking.touristTax,
  };
}

/** Returns true when data is sufficient for ROSS1000 submission. */
export function isRoss1000Ready(booking: Booking): boolean {
  const p = booking.guestProfile ?? {};
  return !!(
    p.surname &&
    p.firstName &&
    p.birthDate &&
    p.nationality &&
    p.documentType &&
    p.documentNumber
  );
}

/**
 * Stub: future implementation will POST to the ROSS1000 API.
 * Requires: ROSS1000_ENDPOINT and ROSS1000_API_KEY env vars.
 */
export async function sendToRoss1000(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _booking: Booking,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _propertyCode: string
): Promise<{ ok: false; reason: "not_configured" }> {
  // Not yet implemented — credentials and endpoint not available.
  return { ok: false, reason: "not_configured" };
}
