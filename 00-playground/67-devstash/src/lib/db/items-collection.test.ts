import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, countMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    item: {
      findMany: findManyMock,
      count: countMock,
    },
  },
}));

import {
  getItemsByCollection,
  getItemsByTypePaginated,
  getItemsByCollectionPaginated,
} from "@/lib/db/items";
import { ITEMS_PER_PAGE, COLLECTIONS_PER_PAGE } from "@/lib/utils";

describe("getItemsByCollection", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns items for a collection owned by the user", async () => {
    const mockItems = [
      {
        id: "item-1",
        title: "Item 1",
        itemType: {
          id: "type-1",
          name: "snippet",
          icon: "Code",
          color: "#3b82f6",
        },
        tags: [],
        collections: [],
      },
      {
        id: "item-2",
        title: "Item 2",
        itemType: {
          id: "type-2",
          name: "note",
          icon: "StickyNote",
          color: "#fde047",
        },
        tags: [],
        collections: [],
      },
    ];

    findManyMock.mockResolvedValueOnce(mockItems);

    const result = await getItemsByCollection("user-1", "col-1");

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        collections: {
          some: {
            collectionId: "col-1",
          },
        },
      },
      take: 100,
      include: {
        itemType: true,
        tags: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Item 1");
    expect(result[1].title).toBe("Item 2");
  });

  it("returns empty array when collection has no items", async () => {
    findManyMock.mockResolvedValueOnce([]);

    const result = await getItemsByCollection("user-1", "empty-col");

    expect(result).toEqual([]);
  });

  it("respects limit parameter", async () => {
    const mockItems = Array(10)
      .fill(null)
      .map((_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        itemType: { id: "type-1", name: "snippet" },
        tags: [],
        collections: [],
      }));

    findManyMock.mockResolvedValueOnce(mockItems);

    await getItemsByCollection("user-1", "col-1", 10);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      }),
    );
  });
});

describe("getItemsByTypePaginated", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    countMock.mockReset();
  });

  it("returns items and total for page 1", async () => {
    const mockItems = [
      {
        id: "item-1",
        title: "Snippet 1",
        itemType: { name: "snippet" },
        tags: [],
      },
    ];
    findManyMock.mockResolvedValueOnce(mockItems);
    countMock.mockResolvedValueOnce(1);

    const result = await getItemsByTypePaginated("user-1", "snippet", 1);

    expect(result).toEqual({ items: mockItems, total: 1 });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", itemType: { name: "snippet" } },
        skip: 0,
        take: ITEMS_PER_PAGE,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      }),
    );
    expect(countMock).toHaveBeenCalledWith({
      where: { userId: "user-1", itemType: { name: "snippet" } },
    });
  });

  it("applies correct skip for page 2", async () => {
    findManyMock.mockResolvedValueOnce([]);
    countMock.mockResolvedValueOnce(30);

    await getItemsByTypePaginated("user-1", "snippet", 2);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: ITEMS_PER_PAGE, take: ITEMS_PER_PAGE }),
    );
  });

  it("clamps page to minimum of 1", async () => {
    findManyMock.mockResolvedValueOnce([]);
    countMock.mockResolvedValueOnce(0);

    await getItemsByTypePaginated("user-1", "snippet", 0);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 }),
    );
  });
});

describe("getItemsByCollectionPaginated", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    countMock.mockReset();
  });

  it("returns items and total for page 1", async () => {
    const mockItems = [
      {
        id: "item-1",
        title: "Item 1",
        itemType: { name: "snippet" },
        tags: [],
        collections: [],
      },
    ];
    findManyMock.mockResolvedValueOnce(mockItems);
    countMock.mockResolvedValueOnce(1);

    const result = await getItemsByCollectionPaginated("user-1", "col-1", 1);

    expect(result).toEqual({ items: mockItems, total: 1 });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          collections: { some: { collectionId: "col-1" } },
        },
        skip: 0,
        take: COLLECTIONS_PER_PAGE,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      }),
    );
    expect(countMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        collections: { some: { collectionId: "col-1" } },
      },
    });
  });

  it("applies correct skip for page 3", async () => {
    findManyMock.mockResolvedValueOnce([]);
    countMock.mockResolvedValueOnce(100);

    await getItemsByCollectionPaginated("user-1", "col-1", 3);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: COLLECTIONS_PER_PAGE * 2,
        take: COLLECTIONS_PER_PAGE,
      }),
    );
  });

  it("returns empty items and zero total when collection is empty", async () => {
    findManyMock.mockResolvedValueOnce([]);
    countMock.mockResolvedValueOnce(0);

    const result = await getItemsByCollectionPaginated("user-1", "empty-col");

    expect(result).toEqual({ items: [], total: 0 });
  });
});
