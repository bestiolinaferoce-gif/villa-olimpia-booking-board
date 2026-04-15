import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./board-theme.css";

export const metadata: Metadata = {
  title: "Villa Olimpia — Booking Board",
  description: "Board prenotazioni mensile per 9 lodge",
};

const BOARD_UI_BOOT = `(function(){try{var th=localStorage.getItem("vob-board-theme");document.documentElement.setAttribute("data-theme",th==="dark"?"dark":"light");var ac=localStorage.getItem("vob-board-accent")||"blue";var ok={blue:1,petrol:1,sand:1,turquoise:1,plum:1};document.documentElement.setAttribute("data-accent",ok[ac]?ac:"blue");}catch(e){document.documentElement.setAttribute("data-theme","light");document.documentElement.setAttribute("data-accent","blue");}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <Script id="board-ui-boot" strategy="beforeInteractive">
          {BOARD_UI_BOOT}
        </Script>
        {children}
      </body>
    </html>
  );
}
