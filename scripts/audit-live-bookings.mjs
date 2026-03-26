const target = process.argv[2] || 'https://villa-olimpia-booking-board.vercel.app';
const auditUrl = `${target.replace(/\/$/, '')}/api/bookings/audit`;

const res = await fetch(auditUrl, { cache: 'no-store' });
if (!res.ok) {
  const text = await res.text();
  console.error(`Audit failed (${res.status}) on ${auditUrl}`);
  console.error(text);
  process.exit(1);
}

const audit = await res.json();

console.log(`Audit URL: ${auditUrl}`);
console.log(`Versione dati: ${audit.v ?? 'n/d'}`);
console.log(`Record totali: ${audit.total}`);
console.log(`Record canonici: ${audit.canonical}`);
console.log(`Duplicati normalizzati: ${audit.duplicatesCollapsed}`);
console.log(`Sovrapposizioni da verificare: ${audit.overlapsDetected}`);

if (Array.isArray(audit.conflicts) && audit.conflicts.length > 0) {
  console.log('\nConflitti rilevati:');
  for (const conflict of audit.conflicts) {
    console.log(
      `- [${conflict.kind}] ${conflict.lodge}: kept ${conflict.keptGuest} (${conflict.keptId}) vs ${conflict.otherGuest} (${conflict.otherId})`
    );
  }
} else {
  console.log('\nNessun conflitto rilevato.');
}
