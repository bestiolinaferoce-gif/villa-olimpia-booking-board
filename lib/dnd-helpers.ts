import type { Booking, Lodge } from "@/lib/types";
import { overlaps } from "@/lib/utils";

export type DropState = "valid" | "invalid" | "swap";

/**
 * Calcola lo stato del drop di `activeBooking` sopra `targetLodge`.
 * - "valid": lodge target libero per il periodo, drop ammesso.
 * - "swap": esiste UNA prenotazione sul lodge target che cabe esattamente
 *           nel periodo di activeBooking (overlap completo o B ⊆ A).
 * - "invalid": almeno una collisione che non è un candidato swap.
 *
 * Le prenotazioni di tipo whole_villa/event NON sono draggable (handled upstream),
 * ma se per qualche motivo arriva una collisione con esse → invalid.
 */
export function computeDropState(
  activeBooking: Booking,
  targetLodge: Lodge,
  allBookings: Booking[],
): DropState {
  if (activeBooking.lodge === targetLodge) return "valid";

  const colliding = allBookings.filter((b) => {
    if (b.id === activeBooking.id) return false;
    if (b.status === "cancelled") return false;
    if (b.lodge !== targetLodge) return false;
    return overlaps(b, activeBooking);
  });

  if (colliding.length === 0) return "valid";

  // Candidato swap: esattamente 1 collisione single_lodge contenuta nel periodo dell'attiva.
  if (colliding.length === 1) {
    const other = colliding[0];
    const otherType = other.bookingType ?? "single_lodge";
    if (otherType === "single_lodge" && rangeContains(activeBooking, other)) {
      return "swap";
    }
  }
  return "invalid";
}

function rangeContains(outer: Booking, inner: Booking): boolean {
  // outer.checkIn <= inner.checkIn AND outer.checkOut >= inner.checkOut
  return outer.checkIn <= inner.checkIn && outer.checkOut >= inner.checkOut;
}

/**
 * Restituisce, per ogni lodge, le prenotazioni che si sovrappongono fra loro
 * (overbooking). Utile per evidenziare bordo rosso sulle barre coinvolte.
 */
export function detectOverbooking(bookings: Booking[]): Map<string, Booking[]> {
  const byLodge = new Map<Lodge, Booking[]>();
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const t = b.bookingType ?? "single_lodge";
    if (t !== "single_lodge") continue;
    const arr = byLodge.get(b.lodge) ?? [];
    arr.push(b);
    byLodge.set(b.lodge, arr);
  }
  const overbookedIds = new Map<string, Booking[]>();
  for (const [, arr] of byLodge) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (overlaps(arr[i], arr[j])) {
          push(overbookedIds, arr[i].id, arr[j]);
          push(overbookedIds, arr[j].id, arr[i]);
        }
      }
    }
  }
  return overbookedIds;
}

function push(map: Map<string, Booking[]>, key: string, value: Booking): void {
  const arr = map.get(key) ?? [];
  arr.push(value);
  map.set(key, arr);
}
