import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaUserUpdateMock, prismaUserFindUniqueMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    prismaUserUpdateMock: vi.fn(),
    prismaUserFindUniqueMock: vi.fn(),
  }),
);

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      update: prismaUserUpdateMock,
      findUnique: prismaUserFindUniqueMock,
    },
  },
}));

vi.mock("@/lib/usage-limits", () => ({
  checkItemLimit: vi.fn().mockResolvedValue(true),
  checkCollectionLimit: vi.fn().mockResolvedValue(true),
  canUploadFiles: vi.fn().mockResolvedValue(true),
}));

import {
  updateEditorPreferences,
  getEditorPreferences,
} from "@/actions/editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES } from "@/types/editor-preferences";

describe("actions/updateEditorPreferences", () => {
  beforeEach(() => {
    authMock.mockReset();
    prismaUserUpdateMock.mockReset();
  });

  it("returns unauthorized when no session", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await updateEditorPreferences(DEFAULT_EDITOR_PREFERENCES);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("returns validation error when fontSize is below minimum", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 5,
    });

    expect(result).toEqual({ success: false, error: "Font size too small" });
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("returns validation error when fontSize is above maximum", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 100,
    });

    expect(result).toEqual({ success: false, error: "Font size too large" });
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("returns validation error for invalid theme", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({
      ...DEFAULT_EDITOR_PREFERENCES,
      // @ts-expect-error intentional invalid value
      theme: "invalid-theme",
    });

    expect(result.success).toBe(false);
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("calls prisma update and returns success with valid input", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaUserUpdateMock.mockResolvedValueOnce({});

    const result = await updateEditorPreferences({
      fontSize: 14,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai",
    });

    expect(prismaUserUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        editorPreferences: {
          fontSize: 14,
          tabSize: 4,
          wordWrap: false,
          minimap: true,
          theme: "monokai",
        },
      },
    });
    expect(result).toEqual({ success: true });
  });
});

describe("actions/getEditorPreferences", () => {
  beforeEach(() => {
    authMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
  });

  it("returns defaults when no session", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await getEditorPreferences();

    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(prismaUserFindUniqueMock).not.toHaveBeenCalled();
  });

  it("returns defaults when user has no editorPreferences", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaUserFindUniqueMock.mockResolvedValueOnce({
      editorPreferences: null,
    });

    const result = await getEditorPreferences();

    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns defaults when stored preferences fail validation", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaUserFindUniqueMock.mockResolvedValueOnce({
      editorPreferences: { fontSize: "not-a-number" },
    });

    const result = await getEditorPreferences();

    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns stored preferences when valid", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    const stored = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "github-dark" as const,
    };
    prismaUserFindUniqueMock.mockResolvedValueOnce({
      editorPreferences: stored,
    });

    const result = await getEditorPreferences();

    expect(result).toEqual(stored);
  });
});
