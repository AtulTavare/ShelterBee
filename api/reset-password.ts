import { Request, Response } from 'express';
import { supabase } from './supabaseClient';

export async function resetPassword(req: Request, res: Response) {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  // Basic password policy (mirror frontend rules)
  const lengthOk = newPassword.length >= 8;
  const uppercase = /[A-Z]/.test(newPassword);
  const number = /[0-9]/.test(newPassword);
  const special = /[^A-Za-z0-9]/.test(newPassword);
  if (!(lengthOk && uppercase && number && special)) {
    return res.status(400).json({ error: 'Password does not meet the required policy' });
  }

  try {
    // Find user id by email in profiles
    const { data, error } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = data.id;

    // Update password using Supabase Admin REST API
    const adminUrl = `${process.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`;
    const fetchFn = globalThis.fetch ? globalThis.fetch : (await import('node-fetch')).default as any;
    const resp = await fetchFn(adminUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return res.status(500).json({ error: errData?.message || 'Password reset failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}

export default resetPassword;
