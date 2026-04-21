import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function initAdmin() {
  try {
    if (getApps().length > 0) return;
    
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env variable is not set');
    }
    
    const serviceAccount = JSON.parse(raw);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    
    initializeApp({
      credential: cert(serviceAccount)
    });
    
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initAdmin();
  } catch (error: any) {
    return res.status(500).json({ error: 'Server configuration error: ' + error.message });
  }

  const auth = getAuth();
  const { action, email, newPassword, uid } = req.body;

  try {
    if (action === 'check-user') {
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const user = await auth.getUserByEmail(email);
      return res.status(200).json({ 
        exists: true, 
        uid: user.uid,
        emailVerified: user.emailVerified
      });
    }

    if (action === 'update-password') {
      if (!uid || !newPassword) {
        return res.status(400).json({ error: 'UID and new password are required' });
      }
      await auth.updateUser(uid, { password: newPassword });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ exists: false, error: 'No account found with this email' });
    }
    console.error('Reset password error:', error);
    return res.status(500).json({ error: error.message });
  }
}
