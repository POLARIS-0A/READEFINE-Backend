import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

if (!env.geminiApiKey) {
  console.warn("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
const RETRYABLE_STATUS = new Set([429, 503]);

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

export async function checkAnswer({ question, correctAnswer, userAnswer }) {
  if (!env.geminiApiKey) {
    if (correctAnswer && normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)) {
      return { correct: true, feedback: "Correct! Great job." };
    }
    return { correct: false, feedback: "That answer is close, but check it and try again." };
  }

  if (correctAnswer && normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)) {
    return { correct: true, feedback: "Correct! Great job." };
  }

  const prompt = `You are a kind reading teacher for children and teens who are learning to read.
Question: ${question}
${correctAnswer ? `Expected answer: ${correctAnswer}` : ""}
Student's answer: ${userAnswer}

Judge if the student's answer is correct. Accept small spelling mistakes and different wording with the same meaning.
Reply ONLY with JSON: {"correct": true or false, "feedback": "one or two short, simple, encouraging sentences"}`;

  let lastError;
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

      return JSON.parse(response.text);
    } catch (error) {
      lastError = error;
      if (!RETRYABLE_STATUS.has(error.status) || attempt === 2) {
        throw error;
      }
      await wait(500 * 2 ** attempt);
    }
  }

  throw lastError;
}