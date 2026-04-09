import { Request, Response } from 'express';
import { supabase } from './supabaseClient';

export async function checkUser(req: Request, res: Response) {
  const { email, isOwner } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    // Look up user profile by email in Supabase (profiles table)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = data.role;
    if (Boolean(isOwner)) {
      if (role !== 'owner') {
        return res.status(400).json({ error: 'User is not an owner' });
      }
    } else {
      if (!['visitor', 'admin', 'owner'].includes(role)) {
        return res.status(400).json({ error: 'Invalid user role' });
      }
    }

    return res.status(200).json({ ok: true, uid: data.id, role });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}

export default checkUser;
