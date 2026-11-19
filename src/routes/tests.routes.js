import { Router } from 'express';
import { checkAnswer } from '../services/gemini.service.js';

const router = Router();

router.post('/check', async (req, res) => {
  const { question, studentAnswer, correctAnswer } = req.body;

  if (!question || !studentAnswer) {
    return res.status(400).json({ error: 'question and studentAnswer are required' });
  }

  try {
    const result = await checkAnswer({
      question,
      correctAnswer,
      userAnswer: String(studentAnswer).slice(0, 500),
    });
    res.json(result);
  } catch (err) {
    console.error("Gemini error:", err.status, err.message);
    res.status(err.status === 429 || err.status === 503 ? 502 : 500).json({
      error: err.status === 429 || err.status === 503
        ? "AI checker is temporarily unavailable"
        : "Could not check the answer",
    });
  }
});

export default router;