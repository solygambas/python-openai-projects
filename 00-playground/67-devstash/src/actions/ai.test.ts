import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  canUseAIMock,
  checkRateLimitMock,
  groqChatCompletionsCreateMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  canUseAIMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  groqChatCompletionsCreateMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/usage-limits", () => ({
  canUseAI: canUseAIMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
  getRateLimitErrorMessage: (reset: number) =>
    `Too many attempts. Please try again in ${Math.ceil((reset - Date.now()) / 60000)} minutes.`,
}));

vi.mock("@/lib/groq", () => ({
  groq: {
    chat: {
      completions: {
        create: groqChatCompletionsCreateMock,
      },
    },
  },
  GROQ_MODELS: {
    AUTO_TAG: "meta-llama/llama-4-scout-17b-16e-instruct",
    SUMMARIZE: "openai/gpt-oss-120b",
    CODE_EXPLAIN: "qwen/qwen3-32b",
    PROMPT_OPTIMIZE: "openai/gpt-oss-120b",
  },
}));

import {
  autoTagItem,
  explainCode,
  optimizePrompt,
  summarizeContent,
} from "@/actions/ai";

describe("actions/autoTagItem", () => {
  beforeEach(() => {
    authMock.mockReset();
    canUseAIMock.mockReset();
    checkRateLimitMock.mockReset();
    groqChatCompletionsCreateMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await autoTagItem({
      title: "Test Item",
      content: "Test content",
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(canUseAIMock).not.toHaveBeenCalled();
  });

  it("returns error when user is not Pro", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockRejectedValueOnce(
      new Error(
        "AI features are a Pro feature. Upgrade to Pro to use AI capabilities.",
      ),
    );

    const result = await autoTagItem({
      title: "Test Item",
      content: "Test content",
    });

    expect(result).toEqual({
      success: false,
      error:
        "AI features are a Pro feature. Upgrade to Pro to use AI capabilities.",
    });
    expect(checkRateLimitMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when title is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    const result = await autoTagItem({
      title: "",
      content: "Test content",
    });

    expect(result).toEqual({
      success: false,
      error: "Title is required",
      remaining: 20,
    });
    expect(groqChatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when content is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    const result = await autoTagItem({
      title: "Test Item",
      content: "",
    });

    expect(result).toEqual({
      success: false,
      error: "Content is required",
      remaining: 20,
    });
    expect(groqChatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("returns rate limit error when limit exceeded", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 3600000,
    });

    const result = await autoTagItem({
      title: "Test Item",
      content: "Test content",
    });

    if (!result.success) {
      expect(result.error).toContain("Too many attempts");
      expect(result.remaining).toBe(0);
    }
    expect(groqChatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("calls Groq API and returns tags on success", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: ["react", "typescript", "hooks"],
              confidence: 0.92,
            }),
          },
        },
      ],
    });

    const result = await autoTagItem({
      title: "useAuth Hook",
      content:
        "const useAuth = () => { const [user, setUser] = useState(null); return { user }; };",
    });

    expect(groqChatCompletionsCreateMock).toHaveBeenCalledWith({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: expect.arrayContaining([
        expect.objectContaining({ role: "system" }),
        expect.objectContaining({ role: "user" }),
      ]),
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 200,
    });

    expect(result).toEqual({
      success: true,
      data: {
        tags: ["react", "typescript", "hooks"],
        confidence: 0.92,
      },
      remaining: 19,
    });
  });

  it("truncates content to 2000 characters before API call", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: ["test"],
              confidence: 0.5,
            }),
          },
        },
      ],
    });

    const longContent = "a".repeat(3000);
    await autoTagItem({
      title: "Test",
      content: longContent,
    });

    const callArgs = groqChatCompletionsCreateMock.mock.calls[0][0];
    const userMessage = callArgs.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    expect(userMessage.content.length).toBeLessThanOrEqual(2000);
  });

  it("limits tags to maximum 5", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
              confidence: 0.9,
            }),
          },
        },
      ],
    });

    const result = await autoTagItem({
      title: "Test",
      content: "Content",
    });

    if (result.success) {
      expect(result.data.tags.length).toBeLessThanOrEqual(5);
    }
  });

  it("returns error when Groq API fails", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockRejectedValueOnce(new Error("API error"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await autoTagItem({
      title: "Test",
      content: "Content",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to generate tags. Please try again.",
      remaining: 20,
    });
  });

  it("returns error when response is invalid JSON", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "not valid json",
          },
        },
      ],
    });
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await autoTagItem({
      title: "Test",
      content: "Content",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to generate tags. Please try again.",
      remaining: 20,
    });
  });

  it("returns error when tags is not an array", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              tags: "not an array",
              confidence: 0.9,
            }),
          },
        },
      ],
    });
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await autoTagItem({
      title: "Test",
      content: "Content",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to generate tags. Please try again.",
      remaining: 20,
    });
  });
});

describe("actions/explainCode", () => {
  beforeEach(() => {
    authMock.mockReset();
    canUseAIMock.mockReset();
    checkRateLimitMock.mockReset();
    groqChatCompletionsCreateMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await explainCode({
      title: "Test Item",
      content: "Test content",
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("calls Groq API and returns explanation on success", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              explanation: "This is a detailed explanation of the code.",
            }),
          },
        },
      ],
    });

    const result = await explainCode({
      title: "React Component",
      content: "const MyComp = () => <div>Hello</div>;",
      language: "typescript",
    });

    expect(groqChatCompletionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "qwen/qwen3-32b",
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("React Component"),
          }),
        ]),
      }),
    );

    expect(result).toEqual({
      success: true,
      data: {
        explanation: "This is a detailed explanation of the code.",
      },
      remaining: 19,
    });
  });

  it("strips <tool_call> tags from the explanation content", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              explanation: "The actual explanation.",
            }),
          },
        },
      ],
    });

    const result = await explainCode({
      title: "Test",
      content: "Content",
    });

    if (result.success) {
      expect(result.data.explanation).toBe("The actual explanation.");
    }
  });

  it("returns error when Groq API fails", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockRejectedValueOnce(new Error("API error"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await explainCode({
      title: "Test",
      content: "Content",
    });

    expect(result).toEqual({
      success: false,
      error: "Failed to generate explanation. Please try again.",
      remaining: 20,
    });
  });
});

describe("actions/summarizeContent", () => {
  beforeEach(() => {
    authMock.mockReset();
    canUseAIMock.mockReset();
    checkRateLimitMock.mockReset();
    groqChatCompletionsCreateMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await summarizeContent({
      title: "Test Item",
      content: "Test content",
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("calls Groq API and returns summary on success", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "This is a concise summary of the content.",
            }),
          },
        },
      ],
    });

    const result = await summarizeContent({
      title: "DevStash Overview",
      content: "DevStash is a developer knowledge hub...",
    });

    expect(groqChatCompletionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-oss-120b",
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("DevStash Overview"),
          }),
        ]),
      }),
    );

    expect(result).toEqual({
      success: true,
      data: {
        summary: "This is a concise summary of the content.",
      },
      remaining: 19,
    });
  });

  it("returns error when Groq API fails", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockRejectedValueOnce(new Error("API error"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await summarizeContent({
      title: "Test",
      content: "Content",
    });

    expect(result).toEqual({
      success: false,
      error: "Failed to generate summary. Please try again.",
      remaining: 20,
    });
  });
});

describe("actions/optimizePrompt", () => {
  beforeEach(() => {
    authMock.mockReset();
    canUseAIMock.mockReset();
    checkRateLimitMock.mockReset();
    groqChatCompletionsCreateMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await optimizePrompt({
      title: "Test Prompt",
      content: "Write me a story",
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(canUseAIMock).not.toHaveBeenCalled();
  });

  it("returns error when user is not Pro", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockRejectedValueOnce(
      new Error(
        "AI features are a Pro feature. Upgrade to Pro to use AI capabilities.",
      ),
    );

    const result = await optimizePrompt({
      title: "Test Prompt",
      content: "Write me a story",
    });

    expect(result).toEqual({
      success: false,
      error:
        "AI features are a Pro feature. Upgrade to Pro to use AI capabilities.",
    });
    expect(checkRateLimitMock).not.toHaveBeenCalled();
  });

  it("returns rate limit error when limit exceeded", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 3600000,
    });

    const result = await optimizePrompt({
      title: "Test Prompt",
      content: "Write me a story",
    });

    if (!result.success) {
      expect(result.error).toContain("Too many attempts");
      expect(result.remaining).toBe(0);
    }
    expect(groqChatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when title is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    const result = await optimizePrompt({
      title: "",
      content: "Some prompt content",
    });

    expect(result).toEqual({
      success: false,
      error: "Title is required",
      remaining: 20,
    });
    expect(groqChatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when content is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    const result = await optimizePrompt({
      title: "My Prompt",
      content: "",
    });

    expect(result).toEqual({
      success: false,
      error: "Prompt is required",
      remaining: 20,
    });
    expect(groqChatCompletionsCreateMock).not.toHaveBeenCalled();
  });

  it("calls Groq API with correct model and returns optimized prompt", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              optimizedPrompt:
                "You are a senior developer. Write a function that does X. Return only the code.",
            }),
          },
        },
      ],
    });

    const result = await optimizePrompt({
      title: "Code Generator",
      content: "Write me some code",
    });

    expect(groqChatCompletionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-oss-120b",
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("Code Generator"),
          }),
        ]),
        temperature: 0.4,
        max_tokens: 2000,
      }),
    );

    expect(result).toEqual({
      success: true,
      data: {
        optimizedPrompt:
          "You are a senior developer. Write a function that does X. Return only the code.",
      },
      remaining: 19,
    });
  });

  it("strips <tool_call> tags from the optimized prompt", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              optimizedPrompt: "The optimized prompt.",
            }),
          },
        },
      ],
    });

    const result = await optimizePrompt({
      title: "Test",
      content: "Some prompt",
    });

    if (result.success) {
      expect(result.data.optimizedPrompt).toBe("The optimized prompt.");
    }
  });

  it("truncates content to 5000 characters before API call", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ optimizedPrompt: "Optimized." }),
          },
        },
      ],
    });

    const longContent = "a".repeat(6000);
    await optimizePrompt({ title: "Test", content: longContent });

    const callArgs = groqChatCompletionsCreateMock.mock.calls[0][0];
    const userMessage = callArgs.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    const promptPart = userMessage.content.split("Prompt:\n")[1];
    expect(promptPart.length).toBeLessThanOrEqual(5000);
  });

  it("returns error when API response is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({}) } }],
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await optimizePrompt({
      title: "Test",
      content: "Some prompt",
    });

    expect(result).toEqual({
      success: false,
      error: "Failed to optimize prompt. Please try again.",
      remaining: 20,
    });
  });

  it("returns error when Groq API throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    canUseAIMock.mockResolvedValueOnce(true);
    checkRateLimitMock.mockResolvedValueOnce({
      success: true,
      remaining: 20,
      reset: Date.now() + 3600000,
    });

    groqChatCompletionsCreateMock.mockRejectedValueOnce(new Error("API error"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await optimizePrompt({
      title: "Test",
      content: "Some prompt",
    });

    expect(result).toEqual({
      success: false,
      error: "Failed to optimize prompt. Please try again.",
      remaining: 20,
    });
  });
});
