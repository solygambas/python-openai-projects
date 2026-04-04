import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, toggleItemFavoriteQueryMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  toggleItemFavoriteQueryMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  toggleItemFavorite: toggleItemFavoriteQueryMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {},
}));

vi.mock("@/lib/usage-limits", () => ({
  checkItemLimit: vi.fn().mockResolvedValue(true),
  canUploadFiles: vi.fn().mockResolvedValue(true),
}));

import { toggleFavoriteItem } from "@/actions/items";

describe("actions/toggleFavoriteItem", () => {
  beforeEach(() => {
    authMock.mockReset();
    toggleItemFavoriteQueryMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await toggleFavoriteItem({ itemId: "item-1" });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(toggleItemFavoriteQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when itemId is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await toggleFavoriteItem({ itemId: "" });

    expect(result).toEqual({
      success: false,
      error: "Item ID is required",
    });
    expect(toggleItemFavoriteQueryMock).not.toHaveBeenCalled();
  });

  it("calls query and returns success payload when toggling to favorite", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const updatedItem = {
      id: "item-1",
      title: "Test Item",
      isFavorite: true,
      contentType: "TEXT",
      content: "test content",
      url: null,
      language: null,
      description: null,
      isPinned: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      itemType: {
        id: "type-1",
        name: "Snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      tags: [],
      collections: [],
    };

    toggleItemFavoriteQueryMock.mockResolvedValueOnce(updatedItem);

    const result = await toggleFavoriteItem({ itemId: "item-1" });

    expect(toggleItemFavoriteQueryMock).toHaveBeenCalledWith(
      "user-1",
      "item-1",
    );
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        isFavorite: true,
      },
    });
  });

  it("calls query and returns success payload when toggling to unfavorite", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const updatedItem = {
      id: "item-1",
      title: "Test Item",
      isFavorite: false,
      contentType: "TEXT",
      content: "test content",
      url: null,
      language: null,
      description: null,
      isPinned: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      itemType: {
        id: "type-1",
        name: "Snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      tags: [],
      collections: [],
    };

    toggleItemFavoriteQueryMock.mockResolvedValueOnce(updatedItem);

    const result = await toggleFavoriteItem({ itemId: "item-1" });

    expect(toggleItemFavoriteQueryMock).toHaveBeenCalledWith(
      "user-1",
      "item-1",
    );
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        isFavorite: false,
      },
    });
  });

  it("returns generic error when query throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    toggleItemFavoriteQueryMock.mockRejectedValueOnce(
      new Error("db unavailable"),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await toggleFavoriteItem({ itemId: "item-1" });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to toggle favorite",
    });
  });
});
