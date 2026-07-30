import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const app = initializeApp({apiKey:"AIzaSyC_b21wRYQNFmDYvOcAlcMmbqvRU1kAjVo",authDomain:"liga-afas-a554c.firebaseapp.com",projectId:"liga-afas-a554c",storageBucket:"liga-afas-a554c.firebasestorage.app",messagingSenderId:"264727553284",appId:"1:264727553284:web:35dbcfe9a67e7db6c01c51"});
const db = getFirestore(app);
const t = await getDocs(collection(db,'teams'));
console.log('TEAMS', t.size);
t.docs.forEach(d=>console.log(d.id,'|',d.data().name,'| seasonNames:',JSON.stringify(d.data().seasonNames||null),'| active:',JSON.stringify(d.data().activeSeasons||null)));
for (const c of ['matchdays_2026_2027','match_reports_2026_2027']) {
  const s = await getDocs(collection(db,c));
  console.log(c, s.size, s.docs.map(d=>d.id).join(','));
}
process.exit(0);
