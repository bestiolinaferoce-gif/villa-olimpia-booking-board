# Dati prenotazioni

## File consigliato

- **`bookings-canonical.json`** — copia qui il tuo export completo e affidabile (array di prenotazioni oppure `{ "bookings": [ ... ] }`).
- Se non esiste, lo script usa `bookings.json` se presente.

## Comandi (da cartella progetto, con app in esecuzione o URL produzione)

| Comando | Effetto |
|--------|---------|
| `npm run data:merge` | **Sicuro:** aggiunge sul cloud solo prenotazioni con `id` nuovi. Non cancella nulla. **Non aggiorna** righe già presenti (stesso `id`): per quelle usa la board o un export completo + `data:replace` consapevole. |
| `VILLA_OLIMPIA_CONFIRM_REPLACE_ALL=yes npm run data:replace` | **Distruttivo:** il cloud diventa **solo** il contenuto del file. Usa solo se il JSON è l’elenco completo voluto. |

Esempi con URL esplicito:

```bash
npm run data:merge -- https://villa-olimpia-booking-board.vercel.app data/bookings-canonical.json
```

Correzioni: modifica il JSON o segnala le righe da cambiare; gli agenti applicano patch mirate senza toccare il resto del codice.
