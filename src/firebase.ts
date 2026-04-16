import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCsYf9lhYsooehj_erJmKWGsIWtRJwinFA",
  authDomain: "sheterbee.firebaseapp.com",
  projectId: "sheterbee",
  storageBucket: "sheterbee.firebasestorage.app",
  messagingSenderId: "163120567862",
  appId: "1:163120567862:web:d9cca4625a1cd83adbaa97",
  measurementId: "G-2VH2G36VGZ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
