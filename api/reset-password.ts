import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required" });
    }

    // Get user by email
    const userRecord = await getAuth().getUserByEmail(email);
    
    // Update password
    await getAuth().updateUser(userRecord.uid, {
      password: newPassword
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({ error: "No account found with this email address." });
    } else {
      res.status(500).json({ error: "Failed to reset password" });
    }
  }
}
