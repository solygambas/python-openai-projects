import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock, findManyMock, countMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    collection: {
      findFirst: findFirstMock,
      findMany: findManyMock,
      count: countMock,
    },
  },
}));

import {
  getCollectionById,
  getAllCollectionsWithDetailsPaginated,
} from "@/lib/db/collections";
import { COLLECTIONS_PER_PAGE } from "@/lib/utils";

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
