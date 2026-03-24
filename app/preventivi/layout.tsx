import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preventivi — Villa Olimpia",
  description: "Preventivi PDF personalizzati Villa Olimpia",
};

export default function PreventiviLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
