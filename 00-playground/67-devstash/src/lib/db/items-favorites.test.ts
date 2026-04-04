import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, findFirstMock, updateMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    item: {
      findMany: findManyMock,
      findFirst: findFirstMock,
      update: updateMock,
    },
  },
}));

import {
  getFavoriteItems,
  toggleItemFavorite,
  toggleItemPin,
} from "@/lib/db/items";

describe("getFavoriteItems", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns favorite items for a user", async () => {
    const mockItems = [
      {
        id: "item1",
        title: "Test Item",
        itemType: { name: "snippet", icon: "Code", color: "#3b82f6" },
        tags: [],
        updatedAt: new Date(),
      },
    ];

    findManyMock.mockResolvedValueOnce(mockItems);

    const result = await getFavoriteItems("user123");

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user123",
        isFavorite: true,
      },
      include: {
        itemType: true,
        tags: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    expect(result).toEqual(mockItems);
  });

  it("returns empty array when user has no favorites", async () => {
    findManyMock.mockResolvedValueOnce([]);

    const result = await getFavoriteItems("user123");

    expect(result).toEqual([]);
  });

  it("sorts items by updatedAt descending", async () => {
    const mockItems = [
      {
        id: "item2",
        title: "New Item",
        itemType: { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
        tags: [],
        updatedAt: new Date("2024-01-02"),
      },
      {
        id: "item1",
        title: "Old Item",
        itemType: { name: "snippet", icon: "Code", color: "#3b82f6" },
        tags: [],
        updatedAt: new Date("2024-01-01"),
      },
    ];

    findManyMock.mockResolvedValueOnce(mockItems);

    const result = await getFavoriteItems("user123");

    expect(result[0].id).toBe("item2");
    expect(result[1].id).toBe("item1");
  });
});

describe("toggleItemFavorite", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
  });

  it("toggles item favorite status from false to true", async () => {
    // Ownership check - item exists and isFavorite is false
    findFirstMock.mockResolvedValueOnce({
      id: "item-1",
      isFavorite: false,
    });

    // Mock the update to return the updated item with isFavorite: true
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

    updateMock.mockResolvedValueOnce(updatedItem);

    const result = await toggleItemFavorite("user-1", "item-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true, isFavorite: true },
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { isFavorite: true },
      include: expect.any(Object),
    });

    expect(result.isFavorite).toBe(true);
  });

  it("toggles item favorite status from true to false", async () => {
    // Ownership check - item exists and isFavorite is true
    findFirstMock.mockResolvedValueOnce({
      id: "item-1",
      isFavorite: true,
    });

    // Mock the update to return the updated item with isFavorite: false
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

    updateMock.mockResolvedValueOnce(updatedItem);

    const result = await toggleItemFavorite("user-1", "item-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true, isFavorite: true },
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { isFavorite: false },
      include: expect.any(Object),
    });

    expect(result.isFavorite).toBe(false);
  });

  it("throws error when item not found or not owned by user", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(toggleItemFavorite("user-1", "item-1")).rejects.toThrow(
      "Item not found or not owned by user",
    );

    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("toggleItemPin", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
  });

  it("toggles item pin status from false to true", async () => {
    // Ownership check - item exists and isPinned is false
    findFirstMock.mockResolvedValueOnce({
      id: "item-1",
      isPinned: false,
    });

    // Mock the update to return the updated item with isPinned: true
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

    updateMock.mockResolvedValueOnce(updatedItem);

    const result = await toggleItemPin("user-1", "item-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true, isPinned: true },
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { isPinned: true },
      include: expect.any(Object),
    });

    expect(result.isPinned).toBe(true);
  });

  it("toggles item pin status from true to false", async () => {
    // Ownership check - item exists and isPinned is true
    findFirstMock.mockResolvedValueOnce({
      id: "item-1",
      isPinned: true,
    });

    // Mock the update to return the updated item with isPinned: false
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

    updateMock.mockResolvedValueOnce(updatedItem);

    const result = await toggleItemPin("user-1", "item-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true, isPinned: true },
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { isPinned: false },
      include: expect.any(Object),
    });

    expect(result.isPinned).toBe(false);
  });

  it("throws error when item not found or not owned by user", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(toggleItemPin("user-1", "item-1")).rejects.toThrow(
      "Item not found or not owned by user",
    );

    expect(updateMock).not.toHaveBeenCalled();
  });
});
