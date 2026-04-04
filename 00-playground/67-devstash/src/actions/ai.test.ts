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
  },
}));

import { autoTagItem } from "@/actions/ai";

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

    expect(result.success).toBe(false);
    expect(result.error).toContain("Too many attempts");
    expect(result.remaining).toBe(0);
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

    expect(result.success).toBe(true);
    expect(result.data?.tags.length).toBeLessThanOrEqual(5);
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
    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to generate tags. Please try again.");
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
    expect(result.success).toBe(false);
  });
});
