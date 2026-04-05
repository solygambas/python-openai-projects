import { auth } from "@/auth";
import { canUseAI } from "@/lib/usage-limits";
import { checkRateLimit, getRateLimitErrorMessage } from "@/lib/rate-limit";
import { AI_RATE_LIMITS, type AIRateLimitKey } from "@/lib/constants/limits";
import { z } from "zod";
import { groq } from "@/lib/groq";

export interface AIActionConfig<TInput, TOutput> {
  schema: z.ZodSchema<TInput>;
  rateLimitKey: AIRateLimitKey;
  /** Friendly name for error messages (e.g., "generate tags", "optimize prompt") */
  actionName: string;
  prepareContent: (input: TInput) => string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  jsonMode?: boolean;
  processResponse: (raw: string) => TOutput;
}

export type AIActionResult<T> =
  | { success: true; data: T; remaining: number }
  | { success: false; error: string; remaining?: number };

/**
 * Factory function to create AI actions with consistent auth, rate limiting, and error handling
 */
export function createAIAction<TInput, TOutput>(
  config: AIActionConfig<TInput, TOutput>,
) {
  return async (input: TInput): Promise<AIActionResult<TOutput>> => {
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
        error:
          error instanceof Error ? error.message : "AI features require Pro",
      };
    }

    // 3. Rate limit check
    const rateLimitConfig = AI_RATE_LIMITS[config.rateLimitKey];
    const rateLimitResult = await checkRateLimit({
      namespace: `ai-${config.rateLimitKey}`,
      limit: rateLimitConfig.limit,
      window: rateLimitConfig.window,
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
    const validated = config.schema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message ?? "Invalid input",
        remaining: rateLimitResult.remaining,
      };
    }

    // 5. Prepare content
    const content = config.prepareContent(validated.data);

    try {
      // 6. API call
      const response = await groq.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content },
        ],
        ...(config.jsonMode !== false
          ? { response_format: { type: "json_object" } }
          : {}),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      // 7. Process response
      const rawContent = response.choices[0]?.message?.content || "";
      const cleanedContent = rawContent
        .replace(/༑[\s\S]*?<\/think>/g, "")
        .trim();

      const data = config.processResponse(cleanedContent);

      return {
        success: true,
        data,
        remaining: rateLimitResult.remaining - 1,
      };
    } catch (error) {
      console.error(`${config.rateLimitKey.toUpperCase()}_ERROR`, error);
      return {
        success: false,
        error: `Failed to ${config.actionName}. Please try again.`,
        remaining: rateLimitResult.remaining,
      };
    }
  };
}
