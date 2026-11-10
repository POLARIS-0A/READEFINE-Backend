import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

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
  res.status(201).json({ user: data.user });
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
export default router;