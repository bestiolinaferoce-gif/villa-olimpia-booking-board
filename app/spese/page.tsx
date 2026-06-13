"use client";

import { PasswordGate } from "@/components/PasswordGate";
import { ExpensesPage } from "@/components/expenses/ExpensesPage";

export default function SpesePage() {
  return (
    <PasswordGate>
      <ExpensesPage />
    </PasswordGate>
  );
}
