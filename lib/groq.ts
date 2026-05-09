import OpenAI from "openai";

export { CHARACTER_SYSTEM_PROMPT } from "./prompts/character-system-prompt";

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

export function createGroqClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}
