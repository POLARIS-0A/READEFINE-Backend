import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { requireUser } from '../middlewares/require-user.middleware.js';

const router = Router();

const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

router.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({
    user: data.user,
    accessToken: data.session?.access_token ?? null,
    requiresEmailConfirmation: !data.session,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: error.message });

  res.json({
    user: data.user,
    accessToken: data.session.access_token,
  });
});

router.patch('/profile', requireUser, async (req, res) => {
  const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  if (!fullName || !email) {
    return res.status(400).json({ error: 'Full name and email are required' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await client.auth.updateUser({
    email,
    data: { full_name: fullName },
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user });
});
export default router;