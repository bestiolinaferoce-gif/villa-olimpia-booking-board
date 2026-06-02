import { LODGES } from "@/lib/types";

/** Target di una spesa: un lodge specifico oppure la struttura nel suo complesso. */
export const EXPENSE_GENERAL = "Generale" as const;
export const EXPENSE_TARGETS = [...LODGES, EXPENSE_GENERAL] as const;
export type ExpenseTarget = (typeof EXPENSE_TARGETS)[number];

export const EXPENSE_CATEGORIES = [
  "pulizie",
  "manutenzione",
  "utenze",
  "forniture",
  "biancheria",
  "tasse_imposte",
  "commissioni_ota",
  "marketing",
  "personale",
  "assicurazioni",
  "altro",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  pulizie: "Pulizie",
  manutenzione: "Manutenzione",
  utenze: "Utenze (luce/acqua/gas)",
  forniture: "Forniture",
  biancheria: "Biancheria",
  tasse_imposte: "Tasse e imposte",
  commissioni_ota: "Commissioni OTA",
  marketing: "Marketing",
  personale: "Personale",
  assicurazioni: "Assicurazioni",
  altro: "Altro",
};

export const EXPENSE_PAYMENT_METHODS = [
  "contanti",
  "bonifico",
  "carta",
  "altro",
] as const;
export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

export const EXPENSE_PAYMENT_LABELS: Record<ExpensePaymentMethod, string> = {
  contanti: "Contanti",
  bonifico: "Bonifico",
  carta: "Carta",
  altro: "Altro",
};

/** Documento allegato (fattura, scontrino, ricevuta) caricato su Vercel Blob. */
export type ExpenseAttachment = {
  /** Nome file originale mostrato all'utente. */
  name: string;
  /** URL pubblico del file su Vercel Blob. */
  url: string;
  /** Dimensione in byte. */
  size: number;
  /** MIME type (es. application/pdf, image/jpeg). */
  contentType: string;
  uploadedAt: string;
};

export type Expense = {
  id: string;
  /** Data della spesa (yyyy-MM-dd). */
  date: string;
  target: ExpenseTarget;
  category: ExpenseCategory;
  description: string;
  /** Importo in euro (lordo). */
  amount: number;
  paymentMethod?: ExpensePaymentMethod;
  /** Fornitore / esercente. */
  supplier?: string;
  /** Spesa pagata oppure ancora da saldare. */
  paid?: boolean;
  notes?: string;
  attachments: ExpenseAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type ExpenseInput = Omit<Expense, "id" | "createdAt" | "updatedAt">;

export function emptyExpenseInput(target: ExpenseTarget = EXPENSE_GENERAL): ExpenseInput {
  return {
    date: new Date().toISOString().slice(0, 10),
    target,
    category: "manutenzione",
    description: "",
    amount: 0,
    paymentMethod: "bonifico",
    supplier: "",
    paid: true,
    notes: "",
    attachments: [],
  };
}
