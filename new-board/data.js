// Villa Olimpia — Booking Board · Data layer
// Prenotazioni reali importate da bookings-canonical.json (50 prenotazioni effettive)
// Schema: schemaVersion 1 · exportedAt 2026-04-27 · sourceVersion 530
// Last sync: 2026-04-27

window.LODGES = [
  { id: 'frangipane', name: 'Frangipane', floor: 'Piano Terra', capacity: 4, sqm: 45, rate: 180, premium: false, image: 'assets/lodge-frangipane.jpg', description: 'Bilocale con patio privato, vista giardino' },
  { id: 'fiordaliso', name: 'Fiordaliso', floor: 'Piano Terra', capacity: 4, sqm: 45, rate: 180, premium: false, image: 'assets/lodge-fiordaliso.jpg', description: 'Bilocale con cucina abitabile, accesso piscina' },
  { id: 'giglio',     name: 'Giglio',     floor: 'Piano Terra', capacity: 4, sqm: 48, rate: 190, premium: false, image: 'assets/lodge-giglio.jpg',     description: 'Bilocale luminoso — camera doppia collegata, vicino piscina' },
  { id: 'tulipano',   name: 'Tulipano',   floor: 'Piano Terra', capacity: 4, sqm: 45, rate: 180, premium: false, image: 'assets/lodge-tulipano.jpg',   description: 'Bilocale con divano letto matrimoniale' },
  { id: 'orchidea',   name: 'Orchidea',   floor: 'Primo Piano', capacity: 5, sqm: 50, rate: 210, premium: false, image: 'assets/lodge-orchidea.jpg',   description: '1 camera + 2 bagni — punto di forza raro' },
  { id: 'lavanda',    name: 'Lavanda',    floor: 'Primo Piano', capacity: 4, sqm: 48, rate: 200, premium: false, image: 'assets/lodge-lavanda.jpg',    description: 'Bilocale con balcone vista giardino' },
  { id: 'geranio',    name: 'Geranio',    floor: 'Attico',      capacity: 6, sqm: 65, rate: 320, premium: true,  image: 'assets/lodge-geranio.jpg',    description: 'Attico premium 65 mq · 2 camere · 2 bagni · terrazza semipanoramica' },
  { id: 'gardenia',   name: 'Gardenia',   floor: 'Primo Piano', capacity: 4, sqm: 46, rate: 195, premium: false, image: 'assets/lodge-gardenia.jpg',   description: 'Bilocale tranquillo con doppio balcone' },
  { id: 'azalea',     name: 'Azalea',     floor: 'Primo Piano', capacity: 4, sqm: 48, rate: 200, premium: false, image: 'assets/lodge-azalea.jpg',     description: 'Bilocale con terrazzo semipanoramico serale' },
];

window.CHANNELS = {
  diretto:  { label: 'Diretto',     short: 'DIR', color: '#7a9b7e', commission: 0    },
  airbnb:   { label: 'Airbnb',      short: 'AIR', color: '#c2604f', commission: 0.03 },
  vrbo:     { label: 'Vrbo',        short: 'VRB', color: '#4ba3c7', commission: 0.05 },
  whatsapp: { label: 'WhatsApp',    short: 'WA',  color: '#5b7d61', commission: 0    },
  telefono: { label: 'Telefono',    short: 'TEL', color: '#c9a45c', commission: 0    },
  booking:  { label: 'Booking.com', short: 'BKG', color: '#003580', commission: 0.15 },
};

window.STATUS_META = {
  paid:      { label: 'Pagata',            color: 'paid',      dotColor: 'var(--st-paid-bar)'      },
  confirmed: { label: 'Confermata',        color: 'confirmed', dotColor: 'var(--st-confirmed-bar)' },
  option:    { label: 'Opzionata',         color: 'option',    dotColor: 'var(--st-option-bar)'    },
  quote:     { label: 'Preventivo',        color: 'quote',     dotColor: 'var(--st-quote-bar)'     },
  pending:   { label: 'In attesa acconto', color: 'pending',   dotColor: 'var(--st-pending-bar)'   },
  cancelled: { label: 'Cancellata',        color: 'cancelled', dotColor: 'var(--st-cancelled-bar)' },
};

window.QUOTE_STATUS_META = {
  draft:    { label: 'Bozza',     color: 'neutral'   },
  sent:     { label: 'Inviato',   color: 'quote'     },
  accepted: { label: 'Accettato', color: 'confirmed' },
  expired:  { label: 'Scaduto',   color: 'cancelled' },
};

// Oggi reale · Vista default: giugno 2026 (inizio stagione)
window.TODAY = new Date();
window.CURRENT_MONTH = { year: 2026, month: 5 }; // giugno 2026 (0-indexed)

// Helper: crea Date da anno/mese/giorno con mese 1-indexed
const D = (y, m, d) => new Date(y, m - 1, d);

// ================================================================
// SEED DATA — 50 prenotazioni reali · bookings-canonical.json
// schemaVersion 1 · exportedAt 2026-04-27 · sourceVersion 530
// ================================================================
const SEED_BOOKINGS = [
  { id: '1418fb94e984-670936abf074da55f298b013e38f8ce4', lodge: 'geranio', guest: 'Christiane Singler', arrival: D(2026,5,8), departure: D(2026,5,14), nights: 6, adults: 4, children: 0, pets: false, channel: 'airbnb', total: 811.18, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: 'b87e3067-9eca-4021-af24-bc3f64fd3fd5', lodge: 'azalea', guest: 'Elena Scuteri', arrival: D(2026,6,20), departure: D(2026,6,27), nights: 7, adults: 2, children: 0, pets: false, channel: 'diretto', total: 650, deposit: 300, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: 'c79d5f54-07ab-4e75-8b6a-1fa16e3a1f38', lodge: 'geranio', guest: 'Alessandro Lanza', arrival: D(2026,6,23), departure: D(2026,6,27), nights: 4, adults: 4, children: 0, pets: false, channel: 'diretto', total: 560, deposit: 168, paid: 168, status: 'confirmed', city: 'Castenaso (BO)', country: '—', phone: '+39 335427362', email: '', notes: '' },
  { id: '09ac0aa3-bc31-4952-b7e6-654e17d78a21', lodge: 'frangipane', guest: 'Yana Abrosimova', arrival: D(2026,6,25), departure: D(2026,7,1), nights: 6, adults: 5, children: 0, pets: false, channel: 'diretto', total: 870, deposit: 261, paid: 261, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: 'HM4XSWJTKE', lodge: 'geranio', guest: 'Evgueni Spassov', arrival: D(2026,6,25), departure: D(2026,6,30), nights: 5, adults: 2, children: 0, pets: false, channel: 'airbnb', total: 750, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: 'HMRWRTKKWH', lodge: 'geranio', guest: 'Roberto Bagatti', arrival: D(2026,6,30), departure: D(2026,7,15), nights: 15, adults: 2, children: 1, pets: false, channel: 'airbnb', total: 2278, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: 'cef18af1-c814-427e-8cf7-8aebdb3a417b', lodge: 'frangipane', guest: 'Alessio Davide', arrival: D(2026,7,1), departure: D(2026,7,10), nights: 9, adults: 4, children: 0, pets: false, channel: 'diretto', total: 1125, deposit: 337.5, paid: 337.5, status: 'confirmed', city: 'San Giovanni in Fiore', country: 'Svizzera', phone: '—', email: '', notes: '' },
  { id: '7b17e631-aa40-40b7-aa44-837831f9e4aa', lodge: 'lavanda', guest: 'Mirella Furia', arrival: D(2026,7,4), departure: D(2026,7,18), nights: 14, adults: 2, children: 0, pets: false, channel: 'airbnb', total: 2100, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: '0c0b4138-a0d0-4a03-8fe2-87268a9f6867', lodge: 'giglio', guest: 'Francesca Fratini', arrival: D(2026,7,11), departure: D(2026,7,18), nights: 7, adults: 5, children: 1, pets: false, channel: 'airbnb', total: 876.69, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: 'HMBXDH4EMJ', lodge: 'geranio', guest: 'Christophe Roux', arrival: D(2026,7,16), departure: D(2026,7,18), nights: 2, adults: 2, children: 1, pets: false, channel: 'airbnb', total: 306.36, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: 'HMXMEPZ5KJ', lodge: 'lavanda', guest: 'Stefano Canaglia', arrival: D(2026,7,18), departure: D(2026,7,25), nights: 7, adults: 2, children: 0, pets: false, channel: 'airbnb', total: 1021.48, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: '2fd2ad50-1e36-4837-8e2f-8343ab658d7c', lodge: 'azalea', guest: 'Kimmo Pitkanen', arrival: D(2026,7,19), departure: D(2026,7,29), nights: 10, adults: 2, children: 0, pets: false, channel: 'diretto', total: 1350, deposit: 405, paid: 0, status: 'confirmed', city: '—', country: 'Finlandia', phone: '—', email: '', notes: '' },
  { id: 'HMDKAT5QCE', lodge: 'geranio', guest: 'Camilla Saletti', arrival: D(2026,7,20), departure: D(2026,7,25), nights: 5, adults: 2, children: 0, pets: false, channel: 'airbnb', total: 612.72, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '1418fb94e984-c57220718e846f7a7730f892a9444b1d', lodge: 'geranio', guest: 'Ospite Airbnb', arrival: D(2026,7,21), departure: D(2026,7,25), nights: 4, adults: 4, children: 0, pets: false, channel: 'airbnb', total: 0, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: '1418fb94e984-87fff796d2c681d24aa08c79d1dc8266', lodge: 'lavanda', guest: 'Ospite Airbnb', arrival: D(2026,7,25), departure: D(2026,7,28), nights: 3, adults: 4, children: 0, pets: false, channel: 'airbnb', total: 0, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: '50eedb33-8820-4de7-a922-5afe11533e84', lodge: 'azalea', guest: 'Marion Eberhart', arrival: D(2026,7,26), departure: D(2026,7,28), nights: 2, adults: 4, children: 0, pets: false, channel: 'airbnb', total: 317.92, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: '7b80ee00-d475-4275-865c-0410f60609cf', lodge: 'gardenia', guest: 'Marion Eberhart', arrival: D(2026,7,26), departure: D(2026,7,28), nights: 2, adults: 3, children: 1, pets: false, channel: 'airbnb', total: 317.92, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: 'import_vandaele_giglio_2026-07-26', lodge: 'giglio', guest: 'Carl Van Daele', arrival: D(2026,7,26), departure: D(2026,8,2), nights: 7, adults: 3, children: 0, pets: false, channel: 'diretto', total: 1050, deposit: 315, paid: 315, status: 'confirmed', city: '—', country: 'Belgio', phone: '—', email: '', notes: 'Prenotazione per la sig. Liesbeth. Bonifico da Carl Van Daele. Tassa di soggiorno da incassare al check-in.\n💶 Totale: €1.050. Acconto 30% ricevuto: €315. Saldo: €735. Tassa soggiorno: €2/persona/notte.' },
  { id: 'HMCECEDTNB', lodge: 'lavanda', guest: 'Michela De Munari', arrival: D(2026,7,26), departure: D(2026,8,2), nights: 7, adults: 2, children: 0, pets: false, channel: 'airbnb', total: 1021.48, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '8dc88890-e1b9-4354-aeb6-a5ef418d0fe0', lodge: 'geranio', guest: 'Michael Francesco Loscavo', arrival: D(2026,7,27), departure: D(2026,8,2), nights: 6, adults: 4, children: 1, pets: false, channel: 'airbnb', total: 1030, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: 'Fornire culla + biancheria.\n⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: 'a16f62f3-932c-4932-85d9-d63da692f98a', lodge: 'frangipane', guest: 'Pietro Miele', arrival: D(2026,8,1), departure: D(2026,8,7), nights: 6, adults: 4, children: 0, pets: false, channel: 'diretto', total: 1085, deposit: 325.5, paid: 325.5, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '59e34993-2641-43dc-beeb-b0d190a6cb27', lodge: 'fiordaliso', guest: 'Carlo Lauria', arrival: D(2026,8,1), departure: D(2026,8,7), nights: 6, adults: 3, children: 0, pets: false, channel: 'diretto', total: 1030, deposit: 309, paid: 309, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '983b4796-76ad-417c-8d61-209150da6ce2', lodge: 'frangipane', guest: 'Pietro Miele', arrival: D(2026,8,1), departure: D(2026,8,8), nights: 7, adults: 4, children: 0, pets: false, channel: 'diretto', total: 1085, deposit: 325.5, paid: 325.5, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '0b87b032-bb16-4d78-86d4-04783386c327', lodge: 'fiordaliso', guest: 'Carlo Lauria', arrival: D(2026,8,1), departure: D(2026,8,8), nights: 7, adults: 3, children: 0, pets: false, channel: 'diretto', total: 1030, deposit: 309, paid: 309, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '0bca6af6-295a-4caf-8a0f-daae568ac466', lodge: 'gardenia', guest: 'Aurelio Agrippino', arrival: D(2026,8,1), departure: D(2026,8,22), nights: 21, adults: 3, children: 0, pets: false, channel: 'diretto', total: 2970, deposit: 897, paid: 897, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: 'f57b678a-bcf8-426a-aad4-9d47ecc4bb7d', lodge: 'azalea', guest: 'Aurelio Agrippino', arrival: D(2026,8,1), departure: D(2026,8,16), nights: 15, adults: 3, children: 0, pets: false, channel: 'diretto', total: 2120, deposit: 630, paid: 630, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: 'import_mazza_tulipano_2026-08-01', lodge: 'tulipano', guest: 'Giuseppina Mazza', arrival: D(2026,8,1), departure: D(2026,8,9), nights: 8, adults: 2, children: 0, pets: true, channel: 'diretto', total: 1100, deposit: 330, paid: 330, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: 'Prenotazione collegata con Lavanda. 🐾 Animale domestico. Tassa di soggiorno al check-in.\n💶 €1.100 + €25 sanificazione animale. Tassa soggiorno: €2/persona/notte.' },
  { id: 'import_mazza_lavanda_2026-08-01', lodge: 'lavanda', guest: 'Giuseppina Mazza', arrival: D(2026,8,1), departure: D(2026,8,9), nights: 8, adults: 2, children: 0, pets: true, channel: 'diretto', total: 1100, deposit: 330, paid: 330, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: 'Prenotazione collegata con Tulipano. 🐾 Animale domestico. Tassa di soggiorno al check-in.\n💶 €1.100 + €25 sanificazione animale. Tassa soggiorno: €2/persona/notte.' },
  { id: '2a46d871-1601-4d63-a74a-aa9114455b86', lodge: 'giglio', guest: 'Rinaldo Leone', arrival: D(2026,8,2), departure: D(2026,8,10), nights: 8, adults: 4, children: 0, pets: false, channel: 'diretto', total: 1264, deposit: 360, paid: 360, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '2c00c7d7-11d3-45af-b7a2-2f8ac7a4ece8', lodge: 'giglio', guest: 'Rinaldo Leone', arrival: D(2026,8,2), departure: D(2026,8,10), nights: 8, adults: 5, children: 0, pets: false, channel: 'diretto', total: 1200, deposit: 360, paid: 360, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: 'ece204e0-0029-4ef0-aa5d-c85e6e2ee888', lodge: 'orchidea', guest: 'Antonietta Leone', arrival: D(2026,8,2), departure: D(2026,8,9), nights: 7, adults: 4, children: 0, pets: false, channel: 'diretto', total: 964.25, deposit: 289.28, paid: 289.28, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '9bbbcdb6-de9b-4b69-b018-d3ef3ba3c56f', lodge: 'geranio', guest: 'Luca Capitanio', arrival: D(2026,8,2), departure: D(2026,8,14), nights: 12, adults: 4, children: 0, pets: false, channel: 'diretto', total: 2016, deposit: 604.08, paid: 604.08, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '49abaac7-f0bd-447b-8f0e-17e77c848405', lodge: 'lavanda', guest: 'Angelo Alfano', arrival: D(2026,8,9), departure: D(2026,8,20), nights: 11, adults: 4, children: 0, pets: false, channel: 'diretto', total: 1540, deposit: 462, paid: 462, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '1dc34420-7121-4431-8434-490560fc5a19', lodge: 'fiordaliso', guest: 'Michela Di Lorenzo', arrival: D(2026,8,9), departure: D(2026,8,20), nights: 11, adults: 2, children: 0, pets: false, channel: 'diretto', total: 1485, deposit: 446.5, paid: 446.5, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '5bc3cb09-00b7-4f3e-948c-efe86d28757a', lodge: 'frangipane', guest: 'Antonio Di Lorenzo', arrival: D(2026,8,9), departure: D(2026,8,20), nights: 11, adults: 4, children: 0, pets: false, channel: 'diretto', total: 1540, deposit: 462, paid: 462, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '66c51d62-d26e-46e6-bb1c-7dd3848fd0ab', lodge: 'tulipano', guest: 'Fattoruso', arrival: D(2026,8,9), departure: D(2026,8,16), nights: 7, adults: 2, children: 0, pets: false, channel: 'diretto', total: 980, deposit: 294, paid: 294, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: 'f33860d1-ea08-4490-813d-c6546a33661a', lodge: 'fiordaliso', guest: 'Raimo Antonio', arrival: D(2026,8,9), departure: D(2026,8,20), nights: 11, adults: 2, children: 0, pets: false, channel: 'diretto', total: 1485, deposit: 445.5, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '10ef42ec-72f8-4b96-9cd3-c4e09146b1d5', lodge: 'giglio', guest: 'Valentina Di Gioia', arrival: D(2026,8,10), departure: D(2026,8,27), nights: 17, adults: 5, children: 0, pets: false, channel: 'diretto', total: 2516, deposit: 754.8, paid: 754.8, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '38552399-2c60-4957-b4e0-5c6ec06c676b', lodge: 'orchidea', guest: 'Alessandra Blasco', arrival: D(2026,8,11), departure: D(2026,8,24), nights: 13, adults: 2, children: 0, pets: false, channel: 'diretto', total: 1960, deposit: 588, paid: 588, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '0cd8013f-262d-4fe1-b347-9a70b1fde79a', lodge: 'orchidea', guest: 'Alessandra Horoba', arrival: D(2026,8,11), departure: D(2026,8,23), nights: 12, adults: 4, children: 0, pets: false, channel: 'diretto', total: 1960, deposit: 588, paid: 588, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: 'f72d188a-f59e-4552-8c64-488141c499c0', lodge: 'geranio', guest: 'Renato Bamonte', arrival: D(2026,8,14), departure: D(2026,8,26), nights: 12, adults: 4, children: 0, pets: false, channel: 'diretto', total: 2264, deposit: 679.2, paid: 679.2, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '853533d8-063b-4b4d-ba8f-ef44437c4422', lodge: 'tulipano', guest: 'Cinzia Curzi', arrival: D(2026,8,16), departure: D(2026,8,22), nights: 6, adults: 2, children: 0, pets: false, channel: 'diretto', total: 870, deposit: 261, paid: 261, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '3193c872-85d1-47c3-b43f-7848f8151c59', lodge: 'azalea', guest: 'Valeria Elia', arrival: D(2026,8,16), departure: D(2026,8,23), nights: 7, adults: 2, children: 0, pets: false, channel: 'diretto', total: 1015, deposit: 303.5, paid: 303.5, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '25010c30-3b47-4a76-a3b6-434ce6f2e23d', lodge: 'frangipane', guest: 'Claudio Trezzi', arrival: D(2026,8,20), departure: D(2026,8,26), nights: 6, adults: 5, children: 0, pets: false, channel: 'diretto', total: 930, deposit: 279, paid: 279, status: 'confirmed', city: 'Lecco', country: '—', phone: '—', email: '', notes: '' },
  { id: '1fb2314f-0241-4e20-9fcd-42a71844d746', lodge: 'lavanda', guest: 'Roberto Panzieri', arrival: D(2026,8,20), departure: D(2026,8,26), nights: 6, adults: 4, children: 0, pets: false, channel: 'diretto', total: 840, deposit: 252, paid: 252, status: 'confirmed', city: 'Lecco', country: '—', phone: '—', email: '', notes: '' },
  { id: 'f3d7f85b-5a3d-4092-92c9-0277dec8811b', lodge: 'tulipano', guest: 'Irene Sallusti', arrival: D(2026,8,22), departure: D(2026,8,29), nights: 7, adults: 4, children: 2, pets: false, channel: 'airbnb', total: 910.41, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: '1418fb94e984-d72928ba8c82ec31c1cd37e7fe73fce5', lodge: 'geranio', guest: 'Daniele Pegoraro', arrival: D(2026,8,26), departure: D(2026,8,30), nights: 4, adults: 3, children: 1, pets: true, channel: 'airbnb', total: 751.45, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.\n🐾 Animale domestico — incassare €50 quota sanificazione.' },
  { id: '21b895e8-1b80-4d57-891e-daa882771233', lodge: 'fiordaliso', guest: 'Pegoraro', arrival: D(2026,8,26), departure: D(2026,8,30), nights: 4, adults: 2, children: 0, pets: false, channel: 'airbnb', total: 751.45, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '' },
  { id: '9de39ee7-37d8-45e1-8646-c0738ee9af6c', lodge: 'lavanda', guest: 'Cuzzoni', arrival: D(2026,8,28), departure: D(2026,9,1), nights: 4, adults: 3, children: 1, pets: false, channel: 'airbnb', total: 635.84, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
  { id: '3d7ab53a-d347-44e7-9612-d8869c813ab6', lodge: 'frangipane', guest: 'Claudio Bettella', arrival: D(2026,9,14), departure: D(2026,9,18), nights: 4, adults: 3, children: 0, pets: true, channel: 'airbnb', total: 500, deposit: 0, paid: 0, status: 'confirmed', city: '—', country: '—', phone: '—', email: '', notes: '🐾 Animale domestico — sanificazione a carico struttura per accordi.\n⚠️ Indirizzo, documento e telefono non disponibili via Airbnb. Raccogliere dall\'ospite.' },
];

// Preventivi (non toccati dalla canonical export)
const SEED_QUOTES = [
  { id: 'Q001', lodge: 'geranio', guest: 'Famiglia De Luca', email: 'deluca@example.com', phone: '+39 333 1234567', arrival: D(2026,8,15), departure: D(2026,8,25), nights: 10, adults: 4, children: 0, total: 3200, deposit: 960, status: 'sent', channel: 'diretto', lang: 'it', notes: 'Richiedono terrazza con vista, cena benvenuto', createdAt: D(2026,4,20) },
  { id: 'Q002', lodge: 'geranio', guest: 'Hoffmann, Ursula', email: 'hoffmann@gmail.de', phone: '+49 172 5553344', arrival: D(2026,8,15), departure: D(2026,8,29), nights: 14, adults: 2, children: 0, total: 4480, deposit: 1344, status: 'sent', channel: 'diretto', lang: 'en', notes: 'German couple, premium package', createdAt: D(2026,4,22) },
  { id: 'Q003', lodge: 'orchidea', guest: 'Famiglia Vitale', email: 'vitale@example.it', phone: '+39 347 9988776', arrival: D(2026,9,8), departure: D(2026,9,15), nights: 7, adults: 3, children: 1, total: 1568, deposit: 470, status: 'draft', channel: 'whatsapp', lang: 'it', notes: 'Bambino 5 anni, culla richiesta', createdAt: D(2026,4,25) },
  { id: 'Q004', lodge: 'lavanda', guest: 'Russo, Marco', email: 'm.russo@email.it', phone: '+39 340 1122334', arrival: D(2026,9,20), departure: D(2026,9,27), nights: 7, adults: 2, children: 0, total: 1400, deposit: 420, status: 'draft', channel: 'diretto', lang: 'it', notes: 'Luna di miele — richiesta decorazione arrivo', createdAt: D(2026,4,26) },
  { id: 'Q005', lodge: 'frangipane', guest: 'Smith, John', email: 'john.smith@email.co.uk', phone: '+44 7911 123456', arrival: D(2026,10,5), departure: D(2026,10,12), nights: 7, adults: 4, children: 2, total: 1260, deposit: 378, status: 'sent', channel: 'diretto', lang: 'en', notes: 'Family with children, late season', createdAt: D(2026,4,24) },
  { id: 'Q006', lodge: 'azalea', guest: 'Ferrari, Giulia', email: 'giulia.ferrari@email.it', phone: '+39 335 7654321', arrival: D(2026,7,10), departure: D(2026,7,17), nights: 7, adults: 2, children: 0, total: 1400, deposit: 420, status: 'expired', channel: 'whatsapp', lang: 'it', notes: 'Attesa risposta da 15 giorni', createdAt: D(2026,4,10) },
];

// ================================================================
// PERSISTENZA — localStorage key 'vo-bb-v2'
// ================================================================
const BB_KEY = 'vo-bb-v2';

// Serializza: Date → ISO string
function _bbSerialize(bookings, quotes) {
  return JSON.stringify({
    bookings: bookings.map(b => ({
      ...b,
      arrival:   b.arrival   instanceof Date ? b.arrival.toISOString()   : b.arrival,
      departure: b.departure instanceof Date ? b.departure.toISOString() : b.departure,
    })),
    quotes: (quotes || []).map(q => ({
      ...q,
      arrival:   q.arrival   instanceof Date ? q.arrival.toISOString()   : q.arrival,
      departure: q.departure instanceof Date ? q.departure.toISOString() : q.departure,
      createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
    })),
    savedAt: new Date().toISOString(),
    version: 2,
  });
}

// Deserializza: ISO string → Date
function _bbParse(json) {
  const data = JSON.parse(json);
  const toDate = s => (s && typeof s === 'string') ? new Date(s) : s;
  if (data.bookings) {
    data.bookings.forEach(b => {
      b.arrival   = toDate(b.arrival);
      b.departure = toDate(b.departure);
    });
  }
  if (data.quotes) {
    data.quotes.forEach(q => {
      q.arrival   = toDate(q.arrival);
      q.departure = toDate(q.departure);
      q.createdAt = toDate(q.createdAt);
    });
  }
  return data;
}

// Salva su localStorage — chiamare dopo ogni modifica
window.BB_SAVE = function() {
  try {
    localStorage.setItem(BB_KEY, _bbSerialize(window.BOOKINGS, window.QUOTES));
  } catch(e) {
    console.warn('[BB] Save failed:', e);
  }
};

// Reset ai dati seed — ricarica la pagina
window.BB_RESET = function() {
  localStorage.removeItem(BB_KEY);
  console.log('[BB] Reset effettuato. Ricarica la pagina per ripristinare i dati originali.');
  location.reload();
};

// Carica da localStorage; se assente, usa il seed e salva subito
(function _bbInit() {
  try {
    const raw = localStorage.getItem(BB_KEY);
    if (raw) {
      const data = _bbParse(raw);
      if (data.bookings && data.bookings.length > 0) {
        window.BOOKINGS = data.bookings;
        window.QUOTES   = data.quotes && data.quotes.length > 0 ? data.quotes : SEED_QUOTES;
        console.log('[BB] Dati caricati da localStorage:', window.BOOKINGS.length, 'prenotazioni');
        return;
      }
    }
  } catch(e) {
    console.warn('[BB] Errore lettura localStorage, uso seed:', e);
  }
  // Prima volta o storage vuoto: usa seed e persisti subito
  window.BOOKINGS = SEED_BOOKINGS;
  window.QUOTES   = SEED_QUOTES;
  window.BB_SAVE();
  console.log('[BB] Seed caricato e salvato:', window.BOOKINGS.length, 'prenotazioni');
})();

// Auto-save prima della chiusura del tab
window.addEventListener('beforeunload', window.BB_SAVE);

// ================================================================
// HELPERS globali
// ================================================================
window.fmtEur = function(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
};
window.fmtEurShort = function(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1000) return '€' + (n / 1000).toFixed(1).replace('.0','') + 'k';
  return '€' + Math.round(n);
};
window.fmtDate = function(d) {
  if (!(d instanceof Date) || isNaN(d)) return '—';
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
};
window.fmtDateShort = function(d) {
  if (!(d instanceof Date) || isNaN(d)) return '—';
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
};
window.sameDay = function(a, b) {
  if (!(a instanceof Date) || !(b instanceof Date)) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};
window.daysBetween = function(a, b) {
  if (!(a instanceof Date) || !(b instanceof Date)) return 0;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
};
window.fmtDow = function(d) {
  if (!(d instanceof Date) || isNaN(d)) return '—';
  return d.toLocaleDateString('it-IT', { weekday: 'short' });
};
window.daysInMonth = function(year, month) {
  return new Date(year, month + 1, 0).getDate();
};
window.isWeekend = function(d) {
  if (!(d instanceof Date) || isNaN(d)) return false;
  const dow = d.getDay();
  return dow === 0 || dow === 6;
};
window.isToday = function(d) {
  return window.sameDay(d, window.TODAY);
};

// Alias var per compatibilità con chiamate dirette in JSX (scope globale)
var fmtEur       = window.fmtEur;
var fmtEurShort  = window.fmtEurShort;
var fmtDate      = window.fmtDate;
var fmtDateShort = window.fmtDateShort;
var sameDay      = window.sameDay;
var daysBetween  = window.daysBetween;
var fmtDow       = window.fmtDow;
var daysInMonth  = window.daysInMonth;
var isWeekend    = window.isWeekend;
var isToday      = window.isToday;
