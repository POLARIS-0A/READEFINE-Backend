import { Router } from "express";
import { checkAnswer } from "../services/gemini.service.js";

const router = Router();

router.post("/check", async (req, res) => {
  const { question, correctAnswer, userAnswer } = req.body;

  if (!question || !userAnswer) {
    return res.status(400).json({ error: "question and userAnswer are required" });
  }

  try {
    const result = await checkAnswer({
      question,
      correctAnswer,
      userAnswer: String(userAnswer).slice(0, 500),
    });
    res.json(result);
  } catch (err) {
    console.error("Gemini error:", err.status, err.message);
    res.status(500).json({ error: "AI check failed" });
  }
});

export default router;