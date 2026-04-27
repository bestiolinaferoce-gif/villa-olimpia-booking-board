import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

const quoteSans = Inter({
  subsets: ["latin"],
  variable: "--font-quote-sans",
  display: "swap",
});

const quoteSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-quote-serif",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Preventivi — Villa Olimpia",
  description: "Preventivi PDF personalizzati Villa Olimpia",
};

export default function PreventiviLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${quoteSans.variable} ${quoteSerif.variable}`}>{children}</div>
  );
}
