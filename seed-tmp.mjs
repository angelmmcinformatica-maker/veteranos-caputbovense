import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
const app = initializeApp({apiKey:"AIzaSyC_b21wRYQNFmDYvOcAlcMmbqvRU1kAjVo",projectId:"liga-afas-a554c"});
const db = getFirestore(app);
const COL='matchdays_2026_2027';
const cal = JSON.parse(fs.readFileSync('./cal-tmp.json','utf8'));
const fmt = (iso) => { const [y,m,d]=iso.split('-'); return `${d}-${m}-${y}`; };

// 1) Wipe existing docs of the season collection (fictitious playoffs included)
const snap = await getDocs(collection(db, COL));
for (const d of snap.docs) { await deleteDoc(doc(db, COL, d.id)); console.log('deleted', d.id); }

// 2) Write the 25 regular matchdays
for (const j of cal) {
  const date = fmt(j.date);
  await setDoc(doc(db, COL, String(j.jornada)), {
    jornada: j.jornada,
    date,
    rest: null,
    matches: j.matches.map(m => ({
      home: m.home, away: m.away, homeGoals: 0, awayGoals: 0,
      date, time: '', status: 'PENDING', referee: null, refereeName: null,
    })),
  });
}
console.log('wrote', cal.length, 'jornadas');

// 3) Per-season team names
await updateDoc(doc(db,'teams','transtello-miajadas'), { 'seasonNames.2026-2027': 'CLINICA DENT. DOCTOR DOBLADO' });
await updateDoc(doc(db,'teams','h0erSpboSHNwSgC8HlXQ'), { 'seasonNames.2026-2027': 'GIMNASTICO D.B. VETERANOS' });
console.log('renames ok');
process.exit(0);
