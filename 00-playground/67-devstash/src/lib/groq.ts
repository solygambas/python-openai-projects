import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.OPENAI_API_KEY, // Groq key, but keep the env var name
});

export { groq };

// Model constants for AI features
export const GROQ_MODELS = {
  AUTO_TAG: "meta-llama/llama-4-scout-17b-16e-instruct",
  SUMMARIZE: "openai/gpt-oss-120b",
  CODE_EXPLAIN: "qwen/qwen3-32b",
  PROMPT_OPTIMIZE: "openai/gpt-oss-120b",
} as const;
