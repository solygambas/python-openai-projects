import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, findManyMock, findFirstMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  findManyMock: vi.fn(),
  findFirstMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    collection: {
      create: createMock,
      findMany: findManyMock,
      findFirst: findFirstMock,
    },
  },
}));

import {
  createCollection,
  getAllCollectionsWithDetails,
  getCollectionById,
} from "@/lib/db/collections";

describe("createCollection", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("creates a collection with name and description", async () => {
    const newCollection = {
      id: "col-1",
      name: "New Collection",
      description: "A test collection",
      isFavorite: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: {
        items: 0,
      },
    };

    createMock.mockResolvedValueOnce(newCollection);

    const result = await createCollection("user-1", {
      name: "New Collection",
      description: "A test collection",
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "New Collection",
        description: "A test collection",
        userId: "user-1",
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    expect(result).toEqual({
      ...newCollection,
      itemCount: 0,
      itemTypeIds: [],
      borderColor: undefined,
    });
  });

  it("creates a collection without description", async () => {
    const newCollection = {
      id: "col-2",
      name: "No Description",
      description: null,
      isFavorite: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: {
        items: 0,
      },
    };

    createMock.mockResolvedValueOnce(newCollection);

    const result = await createCollection("user-1", {
      name: "No Description",
      description: null,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "No Description",
        description: null,
        userId: "user-1",
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    expect(result.name).toBe("No Description");
    expect(result.description).toBeNull();
  });
});

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

describe("getCollectionById", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
  });

  it("returns collection when found and owned by user", async () => {
    const mockCollection = {
      id: "col-1",
      name: "Test Collection",
      description: "A test",
      isFavorite: false,
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { items: 2 },
      items: [
        {
          item: {
            itemTypeId: "type-1",
            itemType: { id: "type-1", color: "#3b82f6" },
          },
        },
      ],
    };

    findFirstMock.mockResolvedValueOnce(mockCollection);

    const result = await getCollectionById("user-1", "col-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        id: "col-1",
        userId: "user-1",
      },
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

    expect(result).toEqual(mockCollection);
  });

  it("returns null when collection not found", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    const result = await getCollectionById("user-1", "non-existent");

    expect(result).toBeNull();
  });
});
