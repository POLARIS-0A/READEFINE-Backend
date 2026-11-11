import { Router } from 'express';
import { env } from '../config/env.js';

const router = Router();

router.post('/check', async (req, res) => {
  const { question, studentAnswer, correctAnswer } = req.body;

  if (!question || !studentAnswer) {
    return res.status(400).json({ error: 'question and studentAnswer are required' });
  }

  const prompt = `You are a kind reading teacher for children and teens who are learning to read.
Question: ${question}
${correctAnswer ? 'Expected answer: ' + correctAnswer : ''}
Student's answer: ${studentAnswer}

Decide if the student's answer is correct. Accept answers with small spelling mistakes.
Reply ONLY with JSON: {"correct": true or false, "feedback": "one or two short, simple, encouraging sentences"}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: data.error?.message || 'Gemini request failed' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json(JSON.parse(text));
  } catch (err) {
    res.status(500).json({ error: 'Could not check the answer' });
  }
});

export default router;