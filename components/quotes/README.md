# Modulo Preventivi (Villa Olimpia)

## URL

- **Locale / produzione:** `/preventivi`  
  Esempio: `https://tuodominio.vercel.app/preventivi`

## Autenticazione

Stesso **PasswordGate** della home (`NEXT_PUBLIC_APP_PASSWORD` o default `.env`).

## File

| File | Ruolo |
|------|--------|
| `quoteConfig.ts` | Testi, contatti, IBAN, policy, lodge, colori tema |
| `quoteUtils.ts` | Calcoli (notti, tassa, acconto, saldo), formattazione |
| `QuoteForm.tsx` | Form laterale |
| `QuoteTemplate.tsx` | Layout brochure PDF (stampa + anteprima) |
| `QuotePreview.tsx` | Alias export di `QuoteTemplate` |
| `QuotePDF.tsx` | Export `jspdf` + `html2canvas` + stampa browser |
| `QuotesPage.tsx` | Pagina client: stato + layout |
| `quotes.css` | Stili isolati modulo |

## Integrazione

- **Nessuna modifica** a `app/page.tsx`, `Toolbar`, `GanttBoard`, store prenotazioni.
- Aggiunta solo: `app/preventivi/page.tsx` + `layout.tsx`.
- Link opzionale: aggiungere in futuro `Link` a `/preventivi` dalla toolbar (modifica esplicita).

## Personalizzazione

1. **WhatsApp:** in `quoteConfig.ts` sostituire `whatsappDigits` con il numero (solo cifre, es. `393XXXXXXXXX`).
2. **Telefono:** `phoneDisplay` in `quoteConfig.ts`.
3. **Testi** descrittivi: `villaIntro`, `villaStructure`, `quoteLodges`.

## Dipendenze

- `jspdf`, `html2canvas` (client-side, compatibile Vercel).
