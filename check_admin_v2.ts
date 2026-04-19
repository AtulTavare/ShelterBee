import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp();
const db = getFirestore(app);

async function check() {
  try {
    const project = app.options.projectId || 'unspecified';
    console.log("Admin Check for project:", project);
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
