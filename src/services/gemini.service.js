import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const ai = env.geminiApiKey
  ? new GoogleGenAI({ apiKey: env.geminiApiKey })
  : null;

const RETRYABLE_STATUS = new Set([429, 503, 504]);

function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function parseGradeResponse(text) {
  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned);

  if (typeof parsed.correct !== "boolean" || typeof parsed.feedback !== "string") {
    throw new Error("Gemini returned an invalid grade");
  }

  return {
    correct: parsed.correct,
    feedback: parsed.feedback.trim() || "Review your answer and try again.",
  };
}

function fallbackGradeAnswer(question, userAnswer) {
  const answer = normalizeAnswer(userAnswer);
  const words = answer.split(/\s+/).filter((word) => word.length > 2);
  const uniqueWords = new Set(words);
  const questionWords = new Set(
    normalizeAnswer(question).split(/\s+/).filter((word) => word.length > 3)
  );
  const relevantWords = [...uniqueWords].filter((word) => questionWords.has(word)).length;
  const hasEnoughDetail = uniqueWords.size >= 12 && words.length >= 20;
  const hasRelevantDetail = relevantWords >= 2 || uniqueWords.size >= 18;
  const correct = hasEnoughDetail && hasRelevantDetail;

  return {
    correct,
    feedback: correct
      ? "Good answer! It shows an understanding of the topic with relevant details."
      : "Add a clearer explanation and at least two relevant details or examples.",
  };
}

export async function checkAnswer({ question, correctAnswer, userAnswer }) {
  if (!ai) {
    if (correctAnswer && normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)) {
      return { correct: true, feedback: "Correct! Great job." };
    }
    return {
      correct: false,
      feedback: "AI checking is unavailable because the Gemini API key is not configured.",
    };
  }

  if (correctAnswer && normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)) {
    return { correct: true, feedback: "Correct! Great job." };
  }

  const prompt = `You are a kind reading teacher for children and teens who are learning to read.
Question: ${question}
${correctAnswer ? `Expected answer: ${correctAnswer}` : "Grade the response using the question, its reading-lesson context, and a clear understanding of the topic."}
Student's answer: ${userAnswer}

Judge if the student's answer is correct. Accept small spelling mistakes and different wording with the same meaning.
Reply ONLY with JSON: {"correct": true or false, "feedback": "one or two short, simple, encouraging sentences"}`;

  let lastError = new Error("Gemini request failed");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      let timeoutId;
      const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const error = new Error("Gemini check timed out");
          error.status = 504;
          reject(error);
        }, 12_000);
      });
      const response = await Promise.race([
        ai.models.generateContent({
          model: env.geminiModel,
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0 },
        }),
        timeout,
      ]).finally(() => clearTimeout(timeoutId));

      if (!response.text) {
        throw new Error("Gemini returned an empty response");
      }

      return parseGradeResponse(response.text);
    } catch (error) {
      lastError = error;
      if (!RETRYABLE_STATUS.has(error.status) || attempt === 2) {
        if (RETRYABLE_STATUS.has(error.status)) {
          return fallbackGradeAnswer(question, userAnswer);
        }
        throw error;
      }
      await wait(500 * 2 ** attempt);
    }
  }

  throw lastError;
}