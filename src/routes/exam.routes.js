import { Router } from "express";
import { readFileSync } from "node:fs";
import { checkAnswer } from "../services/gemini.service.js";
import { supabase as admin } from "../config/supabase.js";
import { requireUser } from "../middlewares/require-user.middleware.js";

const router = Router();
const answerSheets = JSON.parse(
  readFileSync(new URL("../data/exam-answer-sheets.json", import.meta.url), "utf8")
);

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
    res.status(err.status === 429 || err.status === 503 ? 502 : 500).json({
      error: err.status === 429 || err.status === 503
        ? "AI checker is temporarily unavailable"
        : "AI check failed",
    });
  }
});

router.post("/submit", requireUser, async (req, res) => {
  const {
    lessonId,
    identificationAnswers,
    multipleChoiceAnswers,
    essayQuestion,
    essayAnswer,
  } = req.body;

  const answerSheet = answerSheets[String(lessonId)];
  if (!answerSheet) {
    return res.status(404).json({ error: "Exam answer sheet not found" });
  }
  if (!Array.isArray(identificationAnswers) ||
      identificationAnswers.length !== answerSheet.identification.length ||
      !Array.isArray(multipleChoiceAnswers) ||
      multipleChoiceAnswers.length !== answerSheet.multipleChoice.length ||
      typeof essayAnswer !== "string" ||
      !essayAnswer.trim()) {
    return res.status(400).json({ error: "Complete exam answers are required" });
  }

  const normalize = (value) => String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

  const identificationCorrect = answerSheet.identification.map((expected, index) => {
    const answer = normalize(identificationAnswers[index]);
    const accepted = String(expected)
      .split(/\s*(?:\/|\bor\b)\s*/i)
      .some((option) => {
        const expectedAnswer = normalize(option);
        return answer === expectedAnswer ||
          (answer.length >= 4 && expectedAnswer.includes(answer));
      });
    return accepted;
  });
  const multipleChoiceCorrect = answerSheet.multipleChoice.map((expected, index) => {
    const answer = normalize(multipleChoiceAnswers[index]);
    return String(expected)
      .split(/\s*(?:\/|\bor\b)\s*/i)
      .some((option) => normalize(option) === answer);
  });

  let essayResult;
  try {
    essayResult = await checkAnswer({
      question: essayQuestion || "Read the student's essay response and judge it against the exam question.",
      correctAnswer: "",
      userAnswer: String(essayAnswer).slice(0, 2000),
    });
  } catch (err) {
    console.error("Essay Gemini error:", err.status, err.message);
    essayResult = {
      correct: false,
      feedback: "The AI checker could not review the essay, so it was not awarded essay points.",
    };
  }

  const identificationScore = identificationCorrect.filter(Boolean).length;
  const multipleChoiceScore = multipleChoiceCorrect.filter(Boolean).length;
  const essayScore = essayResult.correct ? 5 : 0;
  const score = identificationScore + multipleChoiceScore + essayScore;
  const total = answerSheet.identification.length + answerSheet.multipleChoice.length + 5;
  const passed = score === total;
  const { error: saveError } = await admin.rpc("record_exam_attempt", {
    p_user_id: req.user.id,
    p_lesson_id: String(lessonId),
    p_identification_answers: identificationAnswers,
    p_multiple_choice_answers: multipleChoiceAnswers,
    p_essay_answer: String(essayAnswer).slice(0, 2000),
    p_score: score,
    p_total: total,
    p_passed: passed,
  });

  if (saveError) {
    console.error("Could not save exam attempt:", saveError.message);
    const migrationMissing = ["PGRST202", "PGRST205", "42P01"].includes(saveError.code);
    return res.status(500).json({
      error: migrationMissing
        ? "Exam answer storage is not set up. Run the latest sql/progress.sql in Supabase."
        : "The exam was graded but its answers could not be saved.",
    });
  }

  res.json({
    passed,
    answersSaved: true,
    progressSaved: passed,
    score,
    total,
    identificationCorrect,
    multipleChoiceCorrect,
    essay: essayResult,
  });
});

router.get("/attempt/:lessonId", requireUser, async (req, res) => {
  const lessonNumber = Number(req.params.lessonId);
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > 40) {
    return res.status(400).json({ error: "lessonId must be between 1 and 40" });
  }

  const [{ data: attempt, error: attemptError }, { data: passedAttempt, error: passedError }] = await Promise.all([
    admin
      .from("exam_attempts")
      .select("identification_answers, multiple_choice_answers, essay_answer, score, total, passed, created_at")
      .eq("user_id", req.user.id)
      .eq("lesson_id", String(lessonNumber))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("exam_attempts")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("lesson_id", String(lessonNumber))
      .eq("passed", true)
      .limit(1)
      .maybeSingle(),
  ]);

  if (attemptError || passedError) {
    const error = attemptError || passedError;
    console.error("Could not load exam attempt:", error.message);
    const migrationMissing = ["PGRST202", "PGRST205", "42P01"].includes(error.code);
    return res.status(500).json({
      error: migrationMissing
        ? "Exam answer storage is not set up. Run the latest sql/progress.sql in Supabase."
        : "Could not load your saved exam answers.",
    });
  }

  res.json({ attempt, lessonCompleted: Boolean(passedAttempt) });
});

export default router;