import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc } from 'firebase/firestore';
import config from './firebase-applet-config.json';

const app = initializeApp(config);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

async function check() {
  try {
    console.log("Checking Firestore Write for project:", config.projectId);
    const testDoc = doc(db, 'test_permissions', 'test_doc_' + Date.now());
    await setDoc(testDoc, { status: 'testing', time: new Date().toISOString() });
    console.log("Write Success!");
  } catch (e: any) {
    console.error("Write Failed:", e.message);
  }
}

check();
