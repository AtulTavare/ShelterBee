import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as admin from 'firebase-admin'

// Initialize Admin SDK once
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount))
      });
    } else {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON is missing");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, email, newPassword, uid } = req.body

  try {
    if (action === 'check-user') {
      if (!email) return res.status(400).json({ error: 'Email is required' })
      // Check if user exists in Firebase Auth
      const user = await admin.auth().getUserByEmail(email)
      return res.status(200).json({ 
        exists: true, 
        uid: user.uid,
        emailVerified: user.emailVerified
      })
    }

    if (action === 'update-password') {
      if (!uid || !newPassword) return res.status(400).json({ error: 'UID and new password are required' })
      // Update password after OTP verified
      await admin.auth().updateUser(uid, { password: newPassword })
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Invalid action' })

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ exists: false, error: 'No account found with this email' })
    }
    console.error('Reset password error:', error)
    return res.status(500).json({ error: error.message })
  }
}
