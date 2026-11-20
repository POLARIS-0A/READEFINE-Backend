import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const authClient = createClient(env.supabaseUrl, env.supabaseAnonKey);

export async function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  const { data, error } = await authClient.auth.getUser(token);
  if (error) {
    if (error.status === 401 || error.status === 403) {
      return res.status(401).json({ error: 'Session is invalid or expired. Please log in again.' });
    }
    console.error('Could not verify access token:', error.message);
    return res.status(502).json({ error: 'Could not verify your session. Please try again.' });
  }
  if (!data.user) {
    return res.status(401).json({ error: 'Session is invalid or expired. Please log in again.' });
  }

  req.user = data.user;
  next();
}
