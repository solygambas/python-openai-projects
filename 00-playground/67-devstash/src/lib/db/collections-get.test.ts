import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    collection: {
      findMany: findManyMock,
    },
  },
}));

import {
  getAllCollectionsWithDetails,
  getFavoriteCollections,
} from "@/lib/db/collections";

describe("getAllCollectionsWithDetails", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns all collections with item counts and type info", async () => {
    const mockCollections = [
      {
        id: "col-1",
        name: "Collection 1",
        description: "Test collection",
        isFavorite: false,
        userId: "user-1",
        createdAt: new Date("2026-03-20T10:00:00.000Z"),
        updatedAt: new Date("2026-03-20T12:00:00.000Z"),
        _count: { items: 2 },
        items: [
          {
            item: {
              itemTypeId: "type-1",
              itemType: { id: "type-1", color: "#3b82f6" },
            },
          },
          {
            item: {
              itemTypeId: "type-2",
              itemType: { id: "type-2", color: "#8b5cf6" },
            },
          },
        ],
      },
    ];

    findManyMock.mockResolvedValueOnce(mockCollections);

    const result = await getAllCollectionsWithDetails("user-1");

    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
        items: {
          include: {
            item: {
              select: {
                itemTypeId: true,
                itemType: {
                  select: {
                    id: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Collection 1");
    expect(result[0].itemCount).toBe(2);
    expect(result[0].itemTypeIds).toContain("type-1");
    expect(result[0].itemTypeIds).toContain("type-2");
  });

  it("returns empty array when user has no collections", async () => {
    findManyMock.mockResolvedValueOnce([]);

    const result = await getAllCollectionsWithDetails("user-1");

    expect(result).toEqual([]);
  });

  it("calculates border color from most frequent item type", async () => {
    const mockCollections = [
      {
        id: "col-1",
        name: "Mixed Collection",
        description: null,
        isFavorite: false,
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { items: 3 },
        items: [
          {
            item: {
              itemTypeId: "type-1",
              itemType: { id: "type-1", color: "#3b82f6" },
            },
          },
          {
            item: {
              itemTypeId: "type-1",
              itemType: { id: "type-1", color: "#3b82f6" },
            },
          },
          {
            item: {
              itemTypeId: "type-2",
              itemType: { id: "type-2", color: "#8b5cf6" },
            },
          },
        ],
      },
    ];

    findManyMock.mockResolvedValueOnce(mockCollections);

    const result = await getAllCollectionsWithDetails("user-1");

    // Most frequent type is type-1 (2 occurrences), so it should be first
    expect(result[0].borderColor).toBe("#3b82f6");
    expect(result[0].itemTypeIds[0]).toBe("type-1");
  });
});

describe("getFavoriteCollections", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns favorite collections for a user", async () => {
    const mockCollections = [
      {
        id: "col1",
        name: "Favorite Collection",
        description: "A test collection",
        isFavorite: true,
        userId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { items: 5 },
      },
    ];

    findManyMock.mockResolvedValueOnce(mockCollections);

    const result = await getFavoriteCollections("user123");

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user123",
        isFavorite: true,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    expect(result).toEqual(mockCollections);
  });

  it("returns empty array when user has no favorite collections", async () => {
    findManyMock.mockResolvedValueOnce([]);

    const result = await getFavoriteCollections("user123");

    expect(result).toEqual([]);
  });

  it("sorts collections by updatedAt descending", async () => {
    const mockCollections = [
      {
        id: "col2",
        name: "New Collection",
        isFavorite: true,
        userId: "user123",
        createdAt: new Date(),
        updatedAt: new Date("2024-01-02"),
        _count: { items: 3 },
      },
      {
        id: "col1",
        name: "Old Collection",
        isFavorite: true,
        userId: "user123",
        createdAt: new Date(),
        updatedAt: new Date("2024-01-01"),
        _count: { items: 2 },
      },
    ];

    findManyMock.mockResolvedValueOnce(mockCollections);

    const result = await getFavoriteCollections("user123");

    expect(result[0].id).toBe("col2");
    expect(result[1].id).toBe("col1");
  });
});
