import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Villa Olimpia — Booking Board",
  description: "Board prenotazioni mensile per 9 lodge",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
