import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import config from './firebase-applet-config.json';

// In this environment, initializeApp() should work without args if service account is present
// or we can try to use the project ID from config
const app = initializeApp({
  projectId: config.projectId
});
const db = getFirestore(app);

async function check() {
  try {
    console.log("Checking Firestore with ADMIN SDK...");
    const snapshot = await db.collection('properties').limit(1).get();
    console.log("Admin Read Success, count:", snapshot.size);
    if (snapshot.size > 0) {
      console.log("First property ID:", snapshot.docs[0].id);
      console.log("First property Data keys:", Object.keys(snapshot.docs[0].data()));
    }
  } catch (e: any) {
    console.error("Admin Read Failed:", e.message);
  }
}

check();
