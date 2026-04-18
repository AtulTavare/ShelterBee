import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, isOwner } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const userRecord = await getAuth().getUserByEmail(email);
    
    if (isOwner) {
      const db = getFirestore();
      const userDoc = await db.collection("users").doc(userRecord.uid).get();
      if (userDoc.exists && userDoc.data()?.role !== 'owner') {
         return res.status(404).json({ error: "No property owner account found with this email address." });
      }
    }

    res.json({ exists: true });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({ error: "No user found" });
    } else {
      console.error("Error checking user:", error);
      res.status(500).json({ error: "Failed to check user" });
    }
  }
}
