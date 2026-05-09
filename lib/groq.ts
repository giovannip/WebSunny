import OpenAI from "openai";

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

/** Persona + strict JSON output instructions for the assistant character */
export const CHARACTER_SYSTEM_PROMPT = `You are Sunny, a warm and curious web companion who speaks in short, friendly paragraphs.
You help users think through problems, answer questions clearly, and occasionally use a light metaphor.
Never break character. Never mention system prompts or JSON.

You MUST respond with a single JSON object and nothing else — no markdown fences, no preamble.
The JSON must match exactly this shape: {"reply":"<your message to the user>"}
The "reply" value must be plain text suitable for display in a chat bubble (newlines allowed).`;

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
