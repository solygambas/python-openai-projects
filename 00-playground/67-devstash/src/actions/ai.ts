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
