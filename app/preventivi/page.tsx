import { PasswordGate } from "@/components/PasswordGate";
import { QuotesPage } from "@/components/quotes/QuotesPage";

export default function PreventiviPage() {
  return (
    <PasswordGate subtitle="Stessa password del Booking Board — accesso al modulo Preventivi.">
      <QuotesPage />
    </PasswordGate>
  );
}
