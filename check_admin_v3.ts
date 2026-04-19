import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import config from './firebase-applet-config.json';

const app = initializeApp({
  projectId: config.projectId
});
const db = getFirestore(app);

async function check() {
  try {
    console.log("Admin Check for project:", config.projectId);
    const collections = await db.listCollections();
    console.log("Collections count:", collections.length);
    for (const col of collections) {
      console.log("Found Collection:", col.id);
    }
  } catch (e: any) {
    console.error("Admin Check Failed:", e.message);
  }
}

check();
