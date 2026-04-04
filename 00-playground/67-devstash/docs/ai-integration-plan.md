# AI Integration Plan for DevStash

> Research document for integrating Groq AI models into DevStash for Pro users.

## Executive Summary

This document outlines the implementation plan for integrating Groq's fast inference API into DevStash to power four AI features: auto-tagging, content summarization, code explanation, and prompt optimization. All AI features will be gated behind the Pro subscription tier.

---

## 1. Model Selection & Justification

### Recommended Models

| Feature                 | Model                   | Why                                                                                                                 | Speed   | Pricing (per 1M tokens)    |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------- |
| **Auto-Tagging**        | Llama 4 Scout (17B-16E) | Best for structured JSON outputs with 100% schema adherence. Native multimodal support for future image tagging.    | 750 TPS | $0.11 input / $0.34 output |
| **Summarization**       | GPT-OSS-120B            | Higher reasoning capacity for nuanced understanding of technical content. Captures intent that smaller models miss. | 500 TPS | $0.15 input / $0.60 output |
| **Code Explanation**    | Qwen 3 32B              | Top performer on code logic tasks. Understands the "why" behind functions, not just syntax.                         | 662 TPS | $0.29 input / $0.59 output |
| **Prompt Optimization** | GPT-OSS-120B            | Best for meta-reasoning tasks. High SWE-Bench score (62.4) indicates strong engineering capabilities.               | 500 TPS | $0.15 input / $0.60 output |

### Model Availability Status

All models are available on Groq's production API:

- `meta-llama/llama-4-scout-17b-16e-instruct`
- `openai/gpt-oss-120b`
- `qwen/qwen3-32b`

---

## 2. Architecture Overview

### API Configuration

Groq uses an OpenAI-compatible API endpoint:

```
Base URL: https://api.groq.com/openai/v1/chat/completions
```

### Recommended SDK

```typescript
// Install the official Groq SDK
npm install groq-sdk
```

### Client Initialization Pattern

```typescript
// src/lib/groq.ts
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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

---

## 3. Server Action Patterns

### Base Pattern (Non-Streaming)

All AI features should follow this pattern:

```typescript
// src/actions/ai.ts
"use server";

import { auth } from "@/auth";
import { canUseAI } from "@/lib/usage-limits";
import { groq, GROQ_MODELS } from "@/lib/groq";
import { z } from "zod";

// Zod schema for input validation
const AutoTagSchema = z.object({
  itemId: z.string().min(1),
  content: z.string().min(1).max(10000), // Limit content length
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
    // 4. API call with structured output
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
      temperature: 0.3, // Lower temperature for consistency
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

    // Handle specific Groq errors
    if (error instanceof Groq.RateLimitError) {
      return {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
      };
    }
    if (error instanceof Groq.APIConnectionError) {
      return {
        success: false,
        error: "AI service unavailable. Please try again.",
      };
    }

    return { success: false, error: "Failed to generate tags" };
  }
}
```

### Streaming Pattern (For Long Responses)

Use streaming for code explanations and prompt optimization:

```typescript
// src/app/api/ai/explain/route.ts
import { auth } from "@/auth";
import { canUseAI } from "@/lib/usage-limits";
import { groq, GROQ_MODELS } from "@/lib/groq";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    await canUseAI(session.user.id);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Pro required",
      }),
      { status: 403 },
    );
  }

  const { code, language } = await request.json();

  // Create streaming response
  const stream = await groq.chat.completions.create({
    model: GROQ_MODELS.CODE_EXPLAIN,
    messages: [
      {
        role: "system",
        content: `You are a code explanation assistant. Explain the following ${language} code clearly and concisely. Focus on:
1. What the code does
2. Key concepts and patterns used
3. Potential improvements or edge cases`,
      },
      { role: "user", content: code },
    ],
    stream: true,
    temperature: 0.5,
    max_tokens: 1024,
  });

  // Return as ReadableStream for client consumption
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

---

## 4. Structured Output Patterns

### JSON Schema for Auto-Tagging

```typescript
const AUTO_TAG_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "auto_tag_result",
    strict: true,
    schema: {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: { type: "string" },
          description: "List of relevant tags (max 5)",
          maxItems: 5,
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence score from 0 to 1",
        },
      },
      required: ["tags", "confidence"],
      additionalProperties: false,
    },
  },
};
```

### JSON Schema for Summarization

```typescript
const SUMMARY_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "summary_result",
    strict: true,
    schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Concise summary of the content (2-3 sentences)",
        },
        key_points: {
          type: "array",
          items: { type: "string" },
          description: "Key points extracted from the content (max 5)",
        },
        topics: {
          type: "array",
          items: { type: "string" },
          description: "Main topics covered",
        },
      },
      required: ["summary", "key_points"],
      additionalProperties: false,
    },
  },
};
```

---

## 5. Rate Limiting & Error Handling

### Groq API Rate Limits (Free Tier)

| Model         | RPM | RPD    | TPM     | TPD      |
| ------------- | --- | ------ | ------- | -------- |
| Llama 4 Scout | 30  | 14,400 | 6,000   | 500,000  |
| GPT-OSS-120B  | 30  | 1,000  | 12,000  | 100,000  |
| Qwen 3 32B    | 30  | ~1,000 | ~12,000 | ~100,000 |

> Note: Cached tokens do NOT count toward rate limits.

### Error Handling Pattern

```typescript
import Groq from "groq-sdk";

function handleGroqError(error: unknown): string {
  if (error instanceof Groq.RateLimitError) {
    return "Rate limit exceeded. Please wait a moment and try again.";
  }
  if (error instanceof Groq.AuthenticationError) {
    return "AI service authentication failed. Please contact support.";
  }
  if (error instanceof Groq.APIConnectionError) {
    return "Unable to connect to AI service. Check your network.";
  }
  if (error instanceof Groq.APIConnectionTimeoutError) {
    return "AI request timed out. Please try with shorter content.";
  }
  if (error instanceof Groq.InternalServerError) {
    return "AI service error. Please try again later.";
  }

  console.error("UNEXPECTED_GROQ_ERROR", error);
  return "An unexpected error occurred. Please try again.";
}
```

### Application-Level Rate Limiting

Add per-user AI request limits to prevent abuse:

```typescript
// src/lib/ai-limits.ts
import prisma from "./prisma";

const AI_RATE_LIMITS = {
  MAX_REQUESTS_PER_HOUR: 50,
  MAX_REQUESTS_PER_DAY: 200,
};

export async function checkAILimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Track AI requests in a separate table or use Redis
  // This is a simplified example - use Upstash for production

  return true; // Implement actual tracking
}
```

---

## 6. Cost Optimization Strategies

### 1. Prompt Caching

Groq offers 50% discount on cached input tokens. Use for repeated system prompts:

```typescript
// System prompts should be identical to benefit from caching
const SYSTEM_PROMPTS = {
  AUTO_TAG: `You are a tagging assistant...`, // Keep constant
  SUMMARIZE: `You are a summarization assistant...`,
  CODE_EXPLAIN: `You are a code explanation assistant...`,
} as const;
```

### 2. Token Budgets

Set strict `max_tokens` limits per feature:

| Feature         | Max Tokens | Reason                             |
| --------------- | ---------- | ---------------------------------- |
| Auto-Tag        | 200        | JSON output only, minimal text     |
| Summary         | 300        | 2-3 sentences + bullet points      |
| Code Explain    | 1,024      | Detailed explanation with examples |
| Prompt Optimize | 1,500      | Can be verbose with suggestions    |

### 3. Content Truncation

```typescript
function truncateContent(content: string, maxChars: number = 8000): string {
  if (content.length <= maxChars) return content;

  // For code: truncate at line boundary
  const truncated = content.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf("\n");

  return truncated.slice(0, lastNewline) + "\n... (truncated)";
}
```

### 4. Batch API for Bulk Operations

For bulk operations (e.g., tag all items in a collection), use Groq's Batch API with 50% discount:

```typescript
// Batch API endpoint
POST https://api.groq.com/openai/v1/batch
```

---

## 7. UI Patterns

### Loading States

```tsx
// src/components/ai/auto-tag-button.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

export function AutoTagButton({ itemId, content, onTagsGenerated }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoTag = async () => {
    setIsLoading(true);
    try {
      const result = await autoTagItem({ itemId, content });
      if (result.success && result.data) {
        onTagsGenerated(result.data.tags);
        toast.success(`Generated ${result.data.tags.length} tags`);
      } else {
        toast.error(result.error || "Failed to generate tags");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAutoTag}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Auto-Tag
        </>
      )}
    </Button>
  );
}
```

### Accept/Reject Suggestions

```tsx
// src/components/ai/tag-suggestions.tsx
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TagSuggestionsProps {
  suggestions: string[];
  existingTags: string[];
  onAccept: (tag: string) => void;
  onReject: (tag: string) => void;
  onAcceptAll: () => void;
}

export function TagSuggestions({
  suggestions,
  existingTags,
  onAccept,
  onReject,
  onAcceptAll,
}: TagSuggestionsProps) {
  const newSuggestions = suggestions.filter((t) => !existingTags.includes(t));

  if (newSuggestions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        All suggested tags are already applied.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Suggested Tags</p>
        <Button variant="ghost" size="sm" onClick={onAcceptAll}>
          Accept All
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {newSuggestions.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="flex items-center gap-1"
          >
            {tag}
            <button
              onClick={() => onAccept(tag)}
              className="ml-1 hover:text-green-500"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={() => onReject(tag)}
              className="hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
```

### Streaming Response Display

```tsx
// src/components/ai/code-explanation.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CodeExplanation({ code, language }) {
  const [explanation, setExplanation] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  async function streamExplanation() {
    setIsStreaming(true);
    setExplanation("");

    const response = await fetch("/api/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const { content } = JSON.parse(data);
            setExplanation((prev) => prev + content);
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    setIsStreaming(false);
  }

  return (
    <div className="space-y-4">
      <Button onClick={streamExplanation} disabled={isStreaming}>
        {isStreaming ? "Explaining..." : "Explain Code"}
      </Button>
      <ScrollArea className="h-[300px] rounded-md border p-4">
        {explanation || (
          <p className="text-muted-foreground text-sm">
            Click "Explain Code" to see an AI-generated explanation.
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
```

---

## 8. Security Considerations

### API Key Handling

```typescript
// .env.local (NEVER commit)
GROQ_API_KEY = gsk_xxxxxxxxxxxxxxxxxxxx;

// src/lib/groq.ts
import Groq from "groq-sdk";

// NEVER expose API key to client
if (typeof window !== "undefined") {
  throw new Error("groq.ts must only be imported in server components");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
```

### Input Sanitization

```typescript
import DOMPurify from "isomorphic-dompurify";

function sanitizeInput(content: string): string {
  // Remove any HTML/script injection
  const cleaned = DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });

  // Limit length
  return cleaned.slice(0, 10000);
}
```

### Pro Tier Gating

```typescript
// All AI actions must call canUseAI
export async function anyAIFeature(userId: string) {
  // This throws if user is not Pro
  await canUseAI(userId);

  // Proceed with AI operation
}
```

### Request Validation

```typescript
const AIRequestSchema = z.object({
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(10000, "Content too long. Maximum 10,000 characters."),
  type: z.enum(["snippet", "prompt", "command", "note"]),
});
```

---

## 9. Implementation Checklist

### Phase 1: Infrastructure

- [ ] Install `groq-sdk` package
- [ ] Create `src/lib/groq.ts` client wrapper
- [ ] Add `GROQ_API_KEY` to `.env.local` and Vercel
- [ ] Create `src/lib/ai-limits.ts` for request tracking
- [ ] Add AI request tracking to database (optional)

### Phase 2: Auto-Tagging

- [ ] Create `src/actions/ai.ts` with `autoTagItem` action
- [ ] Add auto-tag button to item edit drawer
- [ ] Create `TagSuggestions` component with accept/reject UI
- [ ] Add unit tests for auto-tag action

### Phase 3: Summarization

- [ ] Create `summarizeItem` action
- [ ] Add summary display to item detail view
- [ ] Add "Generate Summary" button
- [ ] Store summaries in database (optional caching)

### Phase 4: Code Explanation

- [ ] Create streaming API route `/api/ai/explain`
- [ ] Create `CodeExplanation` component
- [ ] Add to item drawer for code snippets
- [ ] Handle streaming response in UI

### Phase 5: Prompt Optimization

- [ ] Create `optimizePrompt` action
- [ ] Create `PromptOptimizer` component
- [ ] Show before/after comparison
- [ ] Add copy optimized prompt button

### Phase 6: Polish

- [ ] Add comprehensive error handling
- [ ] Implement request rate limiting per user
- [ ] Add loading skeletons and states
- [ ] Write unit tests for all AI actions
- [ ] Add E2E tests for AI features

---

## 10. Estimated Costs

### Monthly Usage Assumptions

- 100 Pro users
- 20 AI requests per user per day
- Average 500 input tokens, 200 output tokens per request

### Cost Calculation (Monthly)

| Feature         | Requests/Day | Input Tokens | Output Tokens | Monthly Cost   |
| --------------- | ------------ | ------------ | ------------- | -------------- |
| Auto-Tag        | 10           | 500          | 100           | $12.87         |
| Summary         | 5            | 800          | 200           | $19.35         |
| Code Explain    | 3            | 1,000        | 500           | $21.33         |
| Prompt Optimize | 2            | 600          | 400           | $15.33         |
| **Total**       | **20**       |              |               | **~$69/month** |

> Note: Costs can be reduced by 50% using prompt caching for system prompts.

---

## Sources

- [Groq TypeScript SDK Documentation](https://github.com/groq/groq-typescript)
- [Groq API Reference](https://console.groq.com/docs/api)
- [Groq Structured Outputs Guide](https://console.groq.com/docs/structured-outputs)
- [Groq Rate Limits](https://console.groq.com/docs/rate-limits)
- [Groq Pricing](https://groq.com/pricing)
- [Groq API Cookbook](https://github.com/groq/groq-api-cookbook)

---

_Last updated: April 2026_
