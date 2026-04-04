import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, toggleItemPinQueryMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  toggleItemPinQueryMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  toggleItemPin: toggleItemPinQueryMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {},
}));

vi.mock("@/lib/usage-limits", () => ({
  checkItemLimit: vi.fn().mockResolvedValue(true),
  canUploadFiles: vi.fn().mockResolvedValue(true),
}));

import { toggleItemPin } from "@/actions/items";

describe("actions/toggleItemPin", () => {
  beforeEach(() => {
    authMock.mockReset();
    toggleItemPinQueryMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await toggleItemPin({ itemId: "item-1" });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(toggleItemPinQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when itemId is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await toggleItemPin({ itemId: "" });

    expect(result).toEqual({
      success: false,
      error: "Item ID is required",
    });
    expect(toggleItemPinQueryMock).not.toHaveBeenCalled();
  });

  it("calls query and returns success payload when toggling to pinned", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const updatedItem = {
      id: "item-1",
      title: "Test Item",
      isFavorite: false,
      isPinned: true,
      contentType: "TEXT",
      content: "test content",
      url: null,
      language: null,
      description: null,
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

    toggleItemPinQueryMock.mockResolvedValueOnce(updatedItem);

    const result = await toggleItemPin({ itemId: "item-1" });

    expect(toggleItemPinQueryMock).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        isPinned: true,
      },
    });
  });

  it("calls query and returns success payload when toggling to unpinned", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const updatedItem = {
      id: "item-1",
      title: "Test Item",
      isFavorite: false,
      isPinned: false,
      contentType: "TEXT",
      content: "test content",
      url: null,
      language: null,
      description: null,
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

    toggleItemPinQueryMock.mockResolvedValueOnce(updatedItem);

    const result = await toggleItemPin({ itemId: "item-1" });

    expect(toggleItemPinQueryMock).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        isPinned: false,
      },
    });
  });

  it("returns generic error when query throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    toggleItemPinQueryMock.mockRejectedValueOnce(new Error("db unavailable"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await toggleItemPin({ itemId: "item-1" });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to toggle pin",
    });
  });
});
