"use server";

import { z } from "zod";
import { GROQ_MODELS } from "@/lib/groq";
import { createAIAction, type AIActionResult } from "@/lib/ai-action-factory";

// ============================================================================
// Schemas
// ============================================================================

const AutoTagSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(10000),
  description: z.string().max(2000).optional(),
});

const SummarizeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(10000),
});

const ExplainCodeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Code is required").max(10000),
  language: z.string().optional(),
});

const OptimizePromptSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Prompt is required").max(10000),
});

// ============================================================================
// Result Types (for backward compatibility)
// ============================================================================

export type AutoTagResult = AIActionResult<{
  tags: string[];
  confidence: number;
}>;
export type SummarizeResult = AIActionResult<{ summary: string }>;
export type ExplainCodeResult = AIActionResult<{ explanation: string }>;
export type OptimizePromptResult = AIActionResult<{ optimizedPrompt: string }>;

// ============================================================================
// System Prompts
// ============================================================================

const AUTO_TAG_SYSTEM_PROMPT = `You are a tagging assistant for developer tools. Analyze the content and suggest relevant tags.
Return ONLY a JSON object with this exact schema:
{
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95
}

Rules:
- Maximum 5 tags
- Use lowercase, hyphenated format (e.g., "react-hooks", "typescript", "async-await")
- Focus on technologies, frameworks, patterns, and concepts
- Be specific but not overly narrow (prefer "react" over "frontend-framework")
- Include version numbers only when critical (e.g., "nextjs-15")`;

const SUMMARIZE_SYSTEM_PROMPT = `You are a technical writing assistant for a developer knowledge hub called DevStash.
Your task is to create a professional, concise 1-2 sentence summary of the provided content.

Rules:
- Length: Strictly 1 to 2 sentences.
- Tone: Professional, clear, and direct.
- Focus: Highlight the core purpose or value of the snippet/note/content.
- No intros: Don't start with "This snippet is..." or "The content is...". Just output the summary directly.
- Language: Match the technical context (e.g., if it's code, explain what it builds or solves).

Return ONLY a JSON object: { "summary": "your summary here" }`;

const CODE_EXPLAIN_SYSTEM_PROMPT = `You are a technical expert at DevStash, a knowledge hub for developers.
Your task is to provide a concise, high-quality explanation of the provided code or command.

Target: ~200-300 words.
Structure:
1. Overview: What does this code do in 1-2 sentences.
2. Key Concepts: Briefly explain the main logic, patterns, or tools used.
3. Usage/Context: When or why would a developer use this.

Rules:
- Be precise and technical but accessible.
- Use markdown for formatting (bold, code blocks, lists).
- Do not repeat the code itself, focus on the 'how' and 'why'.
- Output ONLY the final explanation. Do NOT include <tool_call> tags, internal reasoning, or intros like "Here is the explanation...".

Return ONLY a JSON object: { "explanation": "your explanation here" }`;

const PROMPT_OPTIMIZE_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to rewrite and improve AI prompts stored in DevStash, a developer knowledge hub.

Analyze the provided prompt and return an optimized version that:
1. Has a clear, specific goal with measurable success criteria
2. Provides helpful context and constraints for the AI
3. Specifies the desired output format where useful
4. Eliminates ambiguity while preserving the original intent
5. Uses precise, professional language

Rules:
- Return ONLY the improved prompt text, no explanations or commentary
- Preserve the core purpose and intent of the original prompt
- Match the original tone (technical, creative, instructional, etc.)
- Do NOT include <tool_call> tags or internal reasoning
- Output the pure improved prompt ready to be used

Return ONLY a JSON object: { "optimizedPrompt": "your improved prompt here" }`;

// ============================================================================
// AI Actions (using factory)
// ============================================================================

/**
 * Generate AI-powered tag suggestions for an item
 * Uses Groq's Llama 4 Scout model for fast, structured JSON responses
 */
export const autoTagItem = createAIAction({
  schema: AutoTagSchema,
  rateLimitKey: "autoTag",
  actionName: "generate tags",
  prepareContent: (input) => {
    const fullContent = input.description
      ? `${input.title}\n\n${input.description}\n\n${input.content}`
      : `${input.title}\n\n${input.content}`;
    return fullContent.slice(0, 2000);
  },
  systemPrompt: AUTO_TAG_SYSTEM_PROMPT,
  model: GROQ_MODELS.AUTO_TAG,
  temperature: 0.3,
  maxTokens: 200,
  jsonMode: true,
  processResponse: (raw) => {
    const result = JSON.parse(raw || "{}");
    if (!Array.isArray(result.tags)) {
      throw new Error("Invalid response format");
    }
    return {
      tags: result.tags
        .slice(0, 5)
        .filter((t: unknown) => typeof t === "string"),
      confidence:
        typeof result.confidence === "number" ? result.confidence : 0.5,
    };
  },
});

/**
 * Generate AI-powered summary for an item
 * Uses Groq's GPT-OSS-120B model for high-quality technical summaries
 */
export const summarizeContent = createAIAction({
  schema: SummarizeSchema,
  rateLimitKey: "summarize",
  actionName: "generate summary",
  prepareContent: (input) =>
    `${input.title}\n\n${input.content}`.slice(0, 4000),
  systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
  model: GROQ_MODELS.SUMMARIZE,
  temperature: 0.5,
  maxTokens: 300,
  jsonMode: true,
  processResponse: (raw) => {
    const result = JSON.parse(raw || "{}");
    if (!result.summary) {
      throw new Error("Empty response from AI");
    }
    return { summary: result.summary };
  },
});

/**
 * Generate AI-powered explanation for code snippets or commands
 * Uses Groq's Qwen 3 32B model for high-quality technical explanations
 */
export const explainCode = createAIAction({
  schema: ExplainCodeSchema,
  rateLimitKey: "codeExplain",
  actionName: "generate explanation",
  prepareContent: (input) =>
    `Title: ${input.title}\nLanguage: ${input.language || "unknown"}\n\nCode:\n${input.content.slice(0, 5000)}`,
  systemPrompt: CODE_EXPLAIN_SYSTEM_PROMPT,
  model: GROQ_MODELS.CODE_EXPLAIN,
  temperature: 0.4,
  maxTokens: 1000,
  jsonMode: true,
  processResponse: (raw) => {
    const result = JSON.parse(raw || "{}");
    if (!result.explanation) {
      throw new Error("Empty response from AI");
    }
    return { explanation: result.explanation };
  },
});

/**
 * Generate an AI-optimized version of an AI prompt
 * Uses Groq's GPT-OSS-120B model for high-quality meta-reasoning
 */
export const optimizePrompt = createAIAction({
  schema: OptimizePromptSchema,
  rateLimitKey: "promptOptimize",
  actionName: "optimize prompt",
  prepareContent: (input) =>
    `Title: ${input.title}\n\nPrompt:\n${input.content.slice(0, 5000)}`,
  systemPrompt: PROMPT_OPTIMIZE_SYSTEM_PROMPT,
  model: GROQ_MODELS.PROMPT_OPTIMIZE,
  temperature: 0.4,
  maxTokens: 2000,
  jsonMode: true,
  processResponse: (raw) => {
    const result = JSON.parse(raw || "{}");
    if (!result.optimizedPrompt) {
      throw new Error("Empty response from AI");
    }
    return { optimizedPrompt: result.optimizedPrompt };
  },
});
