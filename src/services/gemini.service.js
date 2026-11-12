import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function checkAnswer({ question, correctAnswer, userAnswer }) {
  const prompt = `You are a kind reading teacher for children and teens who are learning to read.
Question: ${question}
Expected answer: ${correctAnswer}
Student's answer: ${userAnswer}

Judge if the student's answer is correct. Accept small spelling mistakes and different wording with the same meaning.
Reply ONLY with JSON: {"correct": true or false, "feedback": "one short, simple, encouraging sentence"}`;

  const response = await ai.models.generateContent({
    model: "gemini-4-hydrogen",
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0 },
  });

  return JSON.parse(response.text);
}