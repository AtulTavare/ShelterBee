import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/firebase';

async function check() {
  const snapshot = await getDocs(collection(db, 'properties'));
  console.log(`Found ${snapshot.docs.length} properties.`);
  snapshot.docs.forEach(doc => {
    console.log(doc.id, doc.data().title, 'Status:', doc.data().status);
  });
  process.exit(0);
}
check();
