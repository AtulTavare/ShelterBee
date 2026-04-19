import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import config from './firebase-applet-config.json';

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    console.log("Checking Firestore Connection...");
    const testDoc = doc(db, 'properties', 'test_connection_doc');
    await getDoc(testDoc);
    console.log("Read Success");
    
    try {
      await updateDoc(testDoc, { lastCheck: new Date().toISOString() });
      console.log("Write Success");
    } catch (e: any) {
      console.error("Write Failed:", e.message);
    }
  } catch (e: any) {
    console.error("Read Failed:", e.message);
  }
}

check();
