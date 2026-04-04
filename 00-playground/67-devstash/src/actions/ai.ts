"use server";

import { auth } from "@/auth";
import { canUseAI } from "@/lib/usage-limits";
import { groq, GROQ_MODELS } from "@/lib/groq";
import { checkRateLimit, getRateLimitErrorMessage } from "@/lib/rate-limit";
import { AI_RATE_LIMITS } from "@/lib/constants/limits";
import { z } from "zod";

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

interface AutoTagResult {
  success: boolean;
  data?: {
    tags: string[];
    confidence: number;
  };
  error?: string;
  remaining?: number;
}

/**
 * Generate AI-powered tag suggestions for an item
 * Uses Groq's Llama 4 Scout model for fast, structured JSON responses
 */
export async function autoTagItem(input: {
  title: string;
  content: string;
  description?: string;
}): Promise<AutoTagResult> {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // 2. Pro tier check
  try {
    await canUseAI(userId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI features require Pro",
    };
  }

  // 3. Rate limit check
  const rateLimitResult = await checkRateLimit({
    namespace: "ai-auto-tag",
    limit: AI_RATE_LIMITS.autoTag.limit,
    window: AI_RATE_LIMITS.autoTag.window,
    identifier: userId,
    includeIp: false,
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: getRateLimitErrorMessage(rateLimitResult.reset),
      remaining: 0,
    };
  }

  // 4. Input validation
  const validated = AutoTagSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  // 5. Prepare content for API (truncate to 2000 chars)
  const { title, content, description } = validated.data;
  const fullContent = description
    ? `${title}\n\n${description}\n\n${content}`
    : `${title}\n\n${content}`;
  const truncatedContent = fullContent.slice(0, 2000);

  try {
    // 6. API call with JSON response format
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.AUTO_TAG,
      messages: [
        {
          role: "system",
          content: `You are a tagging assistant for developer tools. Analyze the content and suggest relevant tags.
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
- Include version numbers only when critical (e.g., "nextjs-15")`,
        },
        {
          role: "user",
          content: truncatedContent,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 200,
    });

    // 7. Parse and validate response
    const rawContent = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(rawContent);

    // Validate the response structure
    if (!Array.isArray(result.tags)) {
      throw new Error("Invalid response format");
    }

    return {
      success: true,
      data: {
        tags: result.tags
          .slice(0, 5)
          .filter((t: unknown) => typeof t === "string"),
        confidence:
          typeof result.confidence === "number" ? result.confidence : 0.5,
      },
      remaining: rateLimitResult.remaining - 1,
    };
  } catch (error) {
    console.error("AUTO_TAG_ERROR", error);
    return {
      success: false,
      error: "Failed to generate tags. Please try again.",
      remaining: rateLimitResult.remaining,
    };
  }
}

interface SummarizeResult {
  success: boolean;
  data?: {
    summary: string;
  };
  error?: string;
  remaining?: number;
}

/**
 * Generate AI-powered summary for an item
 * Uses Groq's GPT-OSS-120B model for high-quality technical summaries
 */
export async function summarizeContent(input: {
  title: string;
  content: string;
}): Promise<SummarizeResult> {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // 2. Pro tier check
  try {
    await canUseAI(userId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI features require Pro",
    };
  }

  // 3. Rate limit check
  const rateLimitResult = await checkRateLimit({
    namespace: "ai-summarize",
    limit: AI_RATE_LIMITS.summarize.limit,
    window: AI_RATE_LIMITS.summarize.window,
    identifier: userId,
    includeIp: false,
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: getRateLimitErrorMessage(rateLimitResult.reset),
      remaining: 0,
    };
  }

  // 4. Input validation
  const validated = SummarizeSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  // 5. Prepare content for API (truncate for token efficiency)
  const { title, content } = validated.data;
  const truncatedContent = `${title}\n\n${content}`.slice(0, 4000);

  try {
    // 6. API call
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.SUMMARIZE,
      messages: [
        {
          role: "system",
          content: `You are a technical writing assistant for a developer knowledge hub called DevStash. 
Your task is to create a professional, concise 1-2 sentence summary of the provided content. 

Rules:
- Length: Strictly 1 to 2 sentences.
- Tone: Professional, clear, and direct.
- Focus: Highlight the core purpose or value of the snippet/note/content.
- No intros: Don't start with "This snippet is..." or "The content is...". Just output the summary directly.
- Language: Match the technical context (e.g., if it's code, explain what it builds or solves).`,
        },
        {
          role: "user",
          content: truncatedContent,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    // 7. Extract response
    const summary = response.choices[0]?.message?.content?.trim() || "";

    if (!summary) {
      throw new Error("Empty response from AI");
    }

    return {
      success: true,
      data: {
        summary,
      },
      remaining: rateLimitResult.remaining - 1,
    };
  } catch (error) {
    console.error("SUMMARIZE_ERROR", error);
    return {
      success: false,
      error: "Failed to generate summary. Please try again.",
      remaining: rateLimitResult.remaining,
    };
  }
}

interface ExplainCodeResult {
  success: boolean;
  data?: {
    explanation: string;
  };
  error?: string;
  remaining?: number;
}

/**
 * Generate AI-powered explanation for code snippets or commands
 * Uses Groq's Qwen 3 32B model for high-quality technical explanations
 */
export async function explainCode(input: {
  title: string;
  content: string;
  language?: string;
}): Promise<ExplainCodeResult> {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // 2. Pro tier check
  try {
    await canUseAI(userId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI features require Pro",
    };
  }

  // 3. Rate limit check
  const rateLimitResult = await checkRateLimit({
    namespace: "ai-explain-code",
    limit: AI_RATE_LIMITS.codeExplain.limit,
    window: AI_RATE_LIMITS.codeExplain.window,
    identifier: userId,
    includeIp: false,
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: getRateLimitErrorMessage(rateLimitResult.reset),
      remaining: 0,
    };
  }

  // 4. Input validation
  const validated = ExplainCodeSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  // 5. Prepare content for API
  const { title, content, language } = validated.data;
  const truncatedCode = content.slice(0, 5000);

  try {
    // 6. API call
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.CODE_EXPLAIN,
      messages: [
        {
          role: "system",
          content: `You are a technical expert at DevStash, a knowledge hub for developers. 
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
- If the language is specified (${language || "unknown"}), use that context.
- Output ONLY the final explanation. Do NOT include <think> tags, internal reasoning, or intros like "Here is the explanation...".`,
        },

        {
          role: "user",
          content: `Title: ${title}\nLanguage: ${language || "unknown"}\n\nCode:\n${truncatedCode}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1000,
    });

    // 7. Extract response and strip <think> tags if present
    let explanation = response.choices[0]?.message?.content?.trim() || "";
    explanation = explanation.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    if (!explanation) {
      throw new Error("Empty response from AI");
    }

    return {
      success: true,
      data: {
        explanation,
      },
      remaining: rateLimitResult.remaining - 1,
    };
  } catch (error) {
    console.error("EXPLAIN_CODE_ERROR", error);
    return {
      success: false,
      error: "Failed to generate explanation. Please try again.",
      remaining: rateLimitResult.remaining,
    };
  }
}

interface OptimizePromptResult {
  success: boolean;
  data?: {
    optimizedPrompt: string;
  };
  error?: string;
  remaining?: number;
}

/**
 * Generate an AI-optimized version of an AI prompt
 * Uses Groq's GPT-OSS-120B model for high-quality meta-reasoning
 */
export async function optimizePrompt(input: {
  title: string;
  content: string;
}): Promise<OptimizePromptResult> {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // 2. Pro tier check
  try {
    await canUseAI(userId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI features require Pro",
    };
  }

  // 3. Rate limit check
  const rateLimitResult = await checkRateLimit({
    namespace: "ai-prompt-optimize",
    limit: AI_RATE_LIMITS.promptOptimize.limit,
    window: AI_RATE_LIMITS.promptOptimize.window,
    identifier: userId,
    includeIp: false,
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: getRateLimitErrorMessage(rateLimitResult.reset),
      remaining: 0,
    };
  }

  // 4. Input validation
  const validated = OptimizePromptSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  // 5. Prepare content for API
  const { title, content } = validated.data;
  const truncatedContent = content.slice(0, 5000);

  try {
    // 6. API call
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.PROMPT_OPTIMIZE,
      messages: [
        {
          role: "system",
          content: `You are an expert prompt engineer. Your task is to rewrite and improve AI prompts stored in DevStash, a developer knowledge hub.

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
- Do NOT include <think> tags or internal reasoning
- Output the pure improved prompt ready to be used`,
        },
        {
          role: "user",
          content: `Title: ${title}\n\nPrompt:\n${truncatedContent}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    // 7. Extract response and strip <think> tags if present
    let optimizedPrompt = response.choices[0]?.message?.content?.trim() || "";
    optimizedPrompt = optimizedPrompt
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();

    if (!optimizedPrompt) {
      throw new Error("Empty response from AI");
    }

    return {
      success: true,
      data: { optimizedPrompt },
      remaining: rateLimitResult.remaining - 1,
    };
  } catch (error) {
    console.error("OPTIMIZE_PROMPT_ERROR", error);
    return {
      success: false,
      error: "Failed to optimize prompt. Please try again.",
      remaining: rateLimitResult.remaining,
    };
  }
}
