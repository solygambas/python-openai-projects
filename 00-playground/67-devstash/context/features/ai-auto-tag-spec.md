# AI Auto-Tagging

## Overview

Add AI-powered tag suggestions for items using Groq's Llama 4 Scout model. Users click a "Suggest Tags" button in the tags area, and the AI returns 3-5 freeform tag suggestions based on the item's title and content. Each suggestion has accept/reject controls. Pro-only feature with both UI-level and server-side gating. If this is the first AI feature implemented, it also establishes the AI foundation (client, server action, rate limit config) for subsequent AI features.

## Requirements

- Create Groq client utility using `groq-sdk` with `AI_MODEL` constant (if not already created by a prior AI feature)
- Use the official `groq-sdk` package (supports both non-streaming and streaming for future features)
- Create `generateAutoTags` server action with auth, Pro gating, Zod validation, rate limiting
- Add AI rate limit config (20 requests/hour per user) to existing rate limit utility (if not already added)
- Add "Suggest Tags" button (Sparkles icon, ghost variant) near the tags input in create item dialog and item drawer edit mode
- Display suggested tags as badges with accept (check) and reject (X) controls per tag
- Accepted tags get added to the item's tag list
- Tags are freeform (not limited to existing tags in the database)
- Truncate content to 2000 chars before API call
- Hide the Suggest Tags button for free users (Pro-only UI gating)
- Error handling via toast (Pro gating, rate limit, AI service errors)
- Follow existing patterns
- Unit tests for server action

## Model Selection

Use **Llama 4 Scout (17B-16E)** via Groq API:

- Model ID: `meta-llama/llama-4-scout-17b-16e-instruct`
- Best for structured JSON outputs with 100% schema adherence
- Native multimodal support for future image tagging
- Speed: 750 TPS
- Pricing: $0.11 input / $0.34 output per 1M tokens

## API Configuration

Use the official `groq-sdk` package:

```typescript
// src/lib/groq.ts
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.OPENAI_API_KEY, // Groq key, but keep the env var name
});

export { groq };

// Model constants
export const GROQ_MODELS = {
  AUTO_TAG: "meta-llama/llama-4-scout-17b-16e-instruct",
  SUMMARIZE: "openai/gpt-oss-120b",
  CODE_EXPLAIN: "qwen/qwen3-32b",
  PROMPT_OPTIMIZE: "openai/gpt-oss-120b",
} as const;
```

## Server Action Pattern

```typescript
// src/actions/ai.ts
"use server";

import { auth } from "@/auth";
import { canUseAI } from "@/lib/usage-limits";
import { groq, GROQ_MODELS } from "@/lib/groq";
import { z } from "zod";

const AutoTagSchema = z.object({
  itemId: z.string().min(1),
  content: z.string().min(1).max(10000),
});

interface AutoTagResult {
  success: boolean;
  data?: {
    tags: string[];
    confidence: number;
  };
  error?: string;
}

export async function autoTagItem(
  input: z.infer<typeof AutoTagSchema>,
): Promise<AutoTagResult> {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // 2. Pro tier check
  try {
    await canUseAI(session.user.id);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI features require Pro",
    };
  }

  // 3. Input validation
  const validated = AutoTagSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  try {
    // 4. API call with JSON response format
    const response = await groq.chat.completions.create({
      model: GROQ_MODELS.AUTO_TAG,
      messages: [
        {
          role: "system",
          content: `You are a tagging assistant. Analyze the content and suggest relevant tags.
Return ONLY a JSON object with this exact schema:
{
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95
}
Maximum 5 tags. Use lowercase, hyphenated format (e.g., "react-hooks").`,
        },
        {
          role: "user",
          content: validated.data.content,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 200,
    });

    // 5. Parse and validate response
    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      success: true,
      data: {
        tags: result.tags?.slice(0, 5) || [],
        confidence: result.confidence || 0.5,
      },
    };
  } catch (error) {
    console.error("AUTO_TAG_ERROR", error);
    return { success: false, error: "Failed to generate tags" };
  }
}
```

## Notes

- Use `OPENAI_API_KEY` env variable (even though it's a Groq key — keeps env var naming simple)
- SDK handles base URL automatically (`https://api.groq.com/openai/v1`)
- `isPro` is available server-side via session but not passed to create/edit UI components — use server-side gating for enforcement, UI gating for button visibility requires passing `isPro` as a prop or fetching it client-side
- See `docs/ai-integration-plan.md` for full architectural context
