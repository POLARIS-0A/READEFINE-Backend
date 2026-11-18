import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const ai = env.geminiApiKey
  ? new GoogleGenAI({ apiKey: env.geminiApiKey })
  : null;

export async function checkAnswer({ question, correctAnswer, userAnswer }) {
  if (!ai) {
    return {
      correct: false,
      feedback: "AI checking is unavailable because the Gemini API key is not configured.",
    };
  }

  const prompt = `You are a kind reading teacher for children and teens who are learning to read.
Question: ${question}
${correctAnswer ? `Expected answer: ${correctAnswer}` : "Grade the response using the question, its reading-lesson context, and a clear understanding of the topic."}
Student's answer: ${userAnswer}

Judge if the student's answer is correct. Accept small spelling mistakes and different wording with the same meaning.
Reply ONLY with JSON: {"correct": true or false, "feedback": "one short, simple, encouraging sentence"}`;

  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0 },
  });

  return JSON.parse(response.text);
}