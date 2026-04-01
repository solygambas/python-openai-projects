import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createMock,
  findManyMock,
  findFirstMock,
  updateMock,
  deleteMock,
  countMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  findManyMock: vi.fn(),
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    collection: {
      create: createMock,
      findMany: findManyMock,
      findFirst: findFirstMock,
      update: updateMock,
      delete: deleteMock,
      count: countMock,
    },
  },
}));

import {
  createCollection,
  getAllCollectionsWithDetails,
  getAllCollectionsWithDetailsPaginated,
  getCollectionById,
  updateCollection,
  deleteCollection,
} from "@/lib/db/collections";
import { COLLECTIONS_PER_PAGE } from "@/lib/utils";

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

describe("updateCollection", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
  });

  it("updates collection name and description", async () => {
    const existingCollection = {
      id: "col-1",
      name: "Old Name",
      description: "Old description",
      isFavorite: false,
      userId: "user-1",
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T10:00:00.000Z"),
    };

    const updatedCollection = {
      ...existingCollection,
      name: "New Name",
      description: "New description",
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: { items: 2 },
    };

    findFirstMock.mockResolvedValueOnce(existingCollection);
    updateMock.mockResolvedValueOnce(updatedCollection);

    const result = await updateCollection("user-1", "col-1", {
      name: "New Name",
      description: "New description",
    });

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "col-1" },
      data: {
        name: "New Name",
        description: "New description",
        updatedAt: expect.any(Date),
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    expect(result.name).toBe("New Name");
    expect(result.description).toBe("New description");
  });

  it("throws error when collection not found", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(
      updateCollection("user-1", "non-existent", {
        name: "New Name",
        description: "New description",
      }),
    ).rejects.toThrow("Collection not found");
  });

  it("throws error when collection belongs to different user", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(
      updateCollection("user-2", "col-1", {
        name: "New Name",
        description: "New description",
      }),
    ).rejects.toThrow("Collection not found");
  });
});

describe("deleteCollection", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    deleteMock.mockReset();
  });

  it("deletes collection and returns id", async () => {
    const existingCollection = {
      id: "col-1",
      name: "Test Collection",
      description: "Test description",
      isFavorite: false,
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    findFirstMock.mockResolvedValueOnce(existingCollection);
    deleteMock.mockResolvedValueOnce(existingCollection);

    const result = await deleteCollection("user-1", "col-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
    });

    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "col-1" },
    });

    expect(result).toEqual({ id: "col-1" });
  });

  it("throws error when collection not found", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(deleteCollection("user-1", "non-existent")).rejects.toThrow(
      "Collection not found",
    );
  });

  it("throws error when collection belongs to different user", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(deleteCollection("user-2", "col-1")).rejects.toThrow(
      "Collection not found",
    );
  });
});

describe("getAllCollectionsWithDetailsPaginated", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    countMock.mockReset();
  });

  it("returns paginated collections and total count", async () => {
    const mockCollections = [
      {
        id: "col-1",
        name: "Collection 1",
        items: [],
        _count: { items: 0 },
      },
    ];
    findManyMock.mockResolvedValueOnce(mockCollections);
    countMock.mockResolvedValueOnce(5);

    const result = await getAllCollectionsWithDetailsPaginated("user-1", 1);

    expect(result.total).toBe(5);
    expect(result.collections).toHaveLength(1);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        skip: 0,
        take: COLLECTIONS_PER_PAGE,
      }),
    );
    expect(countMock).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("applies correct skip for page 2", async () => {
    findManyMock.mockResolvedValueOnce([]);
    countMock.mockResolvedValueOnce(50);

    await getAllCollectionsWithDetailsPaginated("user-1", 2);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: COLLECTIONS_PER_PAGE,
        take: COLLECTIONS_PER_PAGE,
      }),
    );
  });

  it("clamps page to minimum of 1", async () => {
    findManyMock.mockResolvedValueOnce([]);
    countMock.mockResolvedValueOnce(0);

    await getAllCollectionsWithDetailsPaginated("user-1", 0);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 }),
    );
  });
});
