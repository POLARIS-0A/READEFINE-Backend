import { Router } from 'express';
import { supabase as admin } from '../config/supabase.js';
import { requireUser } from '../middlewares/require-user.middleware.js';

const router = Router();

// Save or update progress for one lesson
router.post('/', requireUser, async (req, res) => {
  const { lessonId, completed, score } = req.body;
  const lessonNumber = Number(lessonId);
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > 40) {
    return res.status(400).json({ error: 'lessonId must be between 1 and 40' });
  }
  if (typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'completed must be a boolean' });
  }
  if (score !== undefined && score !== null &&
      (typeof score !== 'number' || !Number.isFinite(score) || score < 0)) {
    return res.status(400).json({ error: 'score must be a non-negative number' });
  }

  const progressRecord = {
    user_id: req.user.id,
    lesson_id: String(lessonNumber),
    completed,
    updated_at: new Date().toISOString(),
  };
  if (score !== undefined && score !== null) progressRecord.score = score;

  const { error } = await admin
    .from('progress')
    .upsert(progressRecord, {
      onConflict: 'user_id,lesson_id',
      defaultToNull: false,
    });

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