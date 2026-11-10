import { Router } from 'express';
import { supabase as admin } from '../config/supabase.js';

const router = Router();

// Check the token and find out who the user is
async function requireUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });

  req.user = data.user;
  next();
}

// Save or update progress for one lesson
router.post('/', requireUser, async (req, res) => {
  const { lessonId, completed, score } = req.body;
  if (!lessonId) return res.status(400).json({ error: 'lessonId is required' });

  const { error } = await admin.from('progress').upsert(
    {
      user_id: req.user.id,
      lesson_id: String(lessonId),
      completed: !!completed,
      score: score ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' }
  );

  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

// Get all progress for the logged-in user
router.get('/', requireUser, async (req, res) => {
  const { data, error } = await admin
    .from('progress')
    .select('lesson_id, completed, score')
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ progress: data });
});

export default router;