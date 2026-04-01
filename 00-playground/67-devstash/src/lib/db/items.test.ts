import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findFirstMock,
  updateMock,
  deleteMock,
  transactionMock,
  createMock,
  findUniqueMock,
  deleteManyMock,
  createManyMock,
  findManyMock,
  countMock,
} = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  transactionMock: vi.fn((callback) =>
    callback({
      item: {
        update: updateMock,
        delete: deleteMock,
      },
      itemCollection: {
        deleteMany: deleteManyMock,
        createMany: createManyMock,
      },
    }),
  ),
  createMock: vi.fn(),
  findUniqueMock: vi.fn(),
  deleteManyMock: vi.fn(),
  createManyMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    item: {
      findFirst: findFirstMock,
      findMany: findManyMock,
      update: updateMock,
      delete: deleteMock,
      create: createMock,
      count: countMock,
    },
    itemType: {
      findUnique: findUniqueMock,
    },
    $transaction: transactionMock,
  },
}));

import {
  getItemDetailById,
  updateItem,
  deleteItem,
  createItem,
  getItemsByCollection,
  getItemsByTypePaginated,
  getItemsByCollectionPaginated,
  getFavoriteItems,
} from "@/lib/db/items";
import { ITEMS_PER_PAGE, COLLECTIONS_PER_PAGE } from "@/lib/utils";

describe("getItemDetailById", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
  });

  it("fetches item details scoped to the user", async () => {
    const item = { id: "item-1", title: "Item 1" };
    findFirstMock.mockResolvedValueOnce(item);

    const result = await getItemDetailById("user-1", "item-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        id: "item-1",
        userId: "user-1",
      },
      include: {
        itemType: true,
        tags: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    expect(result).toEqual(item);
  });

  it("returns null when no matching item exists", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    const result = await getItemDetailById("user-1", "missing-item");

    expect(result).toBeNull();
  });
});

describe("updateItem", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
    transactionMock.mockClear();
    deleteManyMock.mockReset();
    createManyMock.mockReset();
  });

  const mockData = {
    title: "Updated Title",
    description: "Updated Description",
    content: "Updated Content",
    url: "https://updated.com",
    language: "typescript",
    tags: ["tag1", "tag2"],
  };

  it("updates item and syncs tags when owner is verified", async () => {
    // 1. Ownership check
    findFirstMock.mockResolvedValueOnce({ id: "item-1" });

    // 2. Mock the second update (the one that returns the item)
    const updatedItem = { id: "item-1", ...mockData };
    updateMock.mockResolvedValueOnce({ id: "item-1" }); // first update (clear tags)
    updateMock.mockResolvedValueOnce(updatedItem); // second update (apply data)

    const result = await updateItem("user-1", "item-1", mockData);

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true },
    });

    expect(transactionMock).toHaveBeenCalledTimes(1);

    // Check first update (clearing tags)
    expect(updateMock).toHaveBeenNthCalledWith(1, {
      where: { id: "item-1" },
      data: { tags: { set: [] } },
    });

    // Check second update (applying data and new tags)
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      where: { id: "item-1" },
      data: {
        title: mockData.title,
        description: mockData.description,
        content: mockData.content,
        url: mockData.url,
        language: mockData.language,
        tags: {
          connectOrCreate: [
            { where: { name: "tag1" }, create: { name: "tag1" } },
            { where: { name: "tag2" }, create: { name: "tag2" } },
          ],
        },
      },
      include: expect.any(Object),
    });

    expect(result).toEqual(updatedItem);
  });

  it("throws error if item not found or not owned by user", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(updateItem("user-1", "item-1", mockData)).rejects.toThrow(
      "Item not found or not owned by user",
    );

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("syncs collections when collectionIds is provided", async () => {
    // 1. Ownership check
    findFirstMock.mockResolvedValueOnce({ id: "item-1" });

    // 2. Transaction calls
    updateMock.mockResolvedValueOnce({ id: "item-1" }); // clear tags
    updateMock.mockResolvedValueOnce({
      id: "item-1",
      title: "Updated",
      collections: [{ collection: { id: "coll-1", name: "New Collection" } }],
    }); // apply update

    const dataWithCollections = {
      ...mockData,
      collectionIds: ["coll-1"],
    };

    const result = await updateItem("user-1", "item-1", dataWithCollections);

    // Verify deleteMany was called to clear old associations
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { itemId: "item-1" },
    });

    // Verify createMany was called with new associations
    expect(createManyMock).toHaveBeenCalledWith({
      data: [{ itemId: "item-1", collectionId: "coll-1" }],
    });

    expect(result.collections).toBeDefined();
  });

  it("clears all collections when collectionIds is empty array", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "item-1" });
    updateMock.mockResolvedValueOnce({ id: "item-1" });
    updateMock.mockResolvedValueOnce({
      id: "item-1",
      title: "Updated",
      collections: [],
    });

    const dataWithEmptyCollections = {
      ...mockData,
      collectionIds: [],
    };

    const result = await updateItem(
      "user-1",
      "item-1",
      dataWithEmptyCollections,
    );

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { itemId: "item-1" },
    });

    // createMany should NOT be called when collectionIds is empty
    expect(createManyMock).not.toHaveBeenCalled();

    expect(result.collections).toEqual([]);
  });

  it("does not modify collections when collectionIds is undefined", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "item-1" });
    updateMock.mockResolvedValueOnce({ id: "item-1" });
    updateMock.mockResolvedValueOnce({
      id: "item-1",
      title: "Updated",
      collections: [{ collection: { id: "existing-coll", name: "Existing" } }],
    });

    // Data without collectionIds
    const dataWithoutCollections = {
      title: "Updated Title",
      description: "Updated Description",
      content: "Updated Content",
      url: "https://updated.com",
      language: "typescript",
      tags: ["tag1"],
    };

    const result = await updateItem("user-1", "item-1", dataWithoutCollections);

    // Should NOT call deleteMany or createMany
    expect(deleteManyMock).not.toHaveBeenCalled();
    expect(createManyMock).not.toHaveBeenCalled();

    expect(result.collections).toBeDefined();
  });
});

describe("deleteItem", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    transactionMock.mockClear();
  });

  it("deletes item after verifying ownership", async () => {
    // 1. Ownership check - now includes fileUrl for R2 cleanup
    findFirstMock.mockResolvedValueOnce({ id: "item-1", fileUrl: null });

    // 2. Transaction calls
    updateMock.mockResolvedValueOnce({ id: "item-1" }); // disconnect tags
    deleteMock.mockResolvedValueOnce({ id: "item-1" }); // delete item

    const result = await deleteItem("user-1", "item-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true, fileUrl: true },
    });

    expect(transactionMock).toHaveBeenCalledTimes(1);

    // Check disconnect tags
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { tags: { set: [] } },
    });

    // Check delete
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "item-1" },
    });

    expect(result).toEqual({ id: "item-1", fileUrl: null });
  });

  it("throws error if item not found or not owned by user", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(deleteItem("user-1", "item-1")).rejects.toThrow(
      "Item not found or not owned by user",
    );

    expect(transactionMock).not.toHaveBeenCalled();
  });
});

describe("createItem", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    createMock.mockReset();
  });

  const mockType = {
    id: "type-1",
    name: "snippet",
    icon: "Code",
    color: "#3b82f6",
    isSystem: true,
    userId: null,
  };

  it("creates item with text content type for snippet", async () => {
    findUniqueMock.mockResolvedValueOnce(mockType);

    const newItem = {
      id: "item-1",
      title: "New Snippet",
      description: "A test snippet",
      content: "console.log('hello')",
      url: null,
      language: "typescript",
      contentType: "TEXT",
      itemType: mockType,
      tags: [{ id: "tag-1", name: "test" }],
    };

    createMock.mockResolvedValueOnce(newItem);

    const result = await createItem("user-1", {
      title: "New Snippet",
      description: "A test snippet",
      content: "console.log('hello')",
      language: "typescript",
      tags: ["test"],
      typeId: "type-1",
    });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "type-1" },
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        title: "New Snippet",
        description: "A test snippet",
        content: "console.log('hello')",
        url: null,
        language: "typescript",
        contentType: "TEXT",
        userId: "user-1",
        itemTypeId: "type-1",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        tags: {
          connectOrCreate: [
            { where: { name: "test" }, create: { name: "test" } },
          ],
        },
        collections: undefined,
      },
      include: {
        itemType: true,
        tags: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    expect(result).toEqual(newItem);
  });

  it("creates item with URL content type for link", async () => {
    const linkType = {
      id: "type-2",
      name: "link",
      icon: "Link",
      color: "#10b981",
      isSystem: true,
      userId: null,
    };

    findUniqueMock.mockResolvedValueOnce(linkType);

    const newItem = {
      id: "item-2",
      title: "New Link",
      description: null,
      content: null,
      url: "https://example.com",
      language: null,
      contentType: "URL",
      itemType: linkType,
      tags: [],
    };

    createMock.mockResolvedValueOnce(newItem);

    const result = await createItem("user-1", {
      title: "New Link",
      description: null,
      url: "https://example.com",
      tags: [],
      typeId: "type-2",
    });

    expect(result.contentType).toBe("URL");
    expect(result.url).toBe("https://example.com");
  });

  it("creates item without tags when tags array is empty", async () => {
    findUniqueMock.mockResolvedValueOnce(mockType);

    const newItem = {
      id: "item-3",
      title: "No Tags",
      contentType: "TEXT",
      itemType: mockType,
      tags: [],
    };

    createMock.mockResolvedValueOnce(newItem);

    const result = await createItem("user-1", {
      title: "No Tags",
      tags: [],
      typeId: "type-1",
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tags: undefined,
        collections: undefined,
      }),
      include: {
        itemType: true,
        tags: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    expect(result).toEqual(newItem);
  });

  it("throws error when type is invalid", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    await expect(
      createItem("user-1", {
        title: "Invalid Type",
        typeId: "invalid-type",
      }),
    ).rejects.toThrow("Invalid item type");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates item with collection associations", async () => {
    findUniqueMock.mockResolvedValueOnce(mockType);

    const newItem = {
      id: "item-1",
      title: "New Snippet",
      contentType: "TEXT",
      itemType: mockType,
      tags: [],
      collections: [
        { collection: { id: "coll-1", name: "Collection 1" } },
        { collection: { id: "coll-2", name: "Collection 2" } },
      ],
    };

    createMock.mockResolvedValueOnce(newItem);

    const result = await createItem("user-1", {
      title: "New Snippet",
      tags: [],
      typeId: "type-1",
      collectionIds: ["coll-1", "coll-2"],
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "New Snippet",
        collections: {
          create: [
            { collection: { connect: { id: "coll-1" } } },
            { collection: { connect: { id: "coll-2" } } },
          ],
        },
      }),
      include: {
        itemType: true,
        tags: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    expect(result.collections).toHaveLength(2);
    expect(result.collections[0].collection.name).toBe("Collection 1");
  });

  it("creates item without collections when collectionIds is empty", async () => {
    findUniqueMock.mockResolvedValueOnce(mockType);

    const newItem = {
      id: "item-2",
      title: "No Collections",
      contentType: "TEXT",
      itemType: mockType,
      tags: [],
      collections: [],
    };

    createMock.mockResolvedValueOnce(newItem);

    const result = await createItem("user-1", {
      title: "No Collections",
      tags: [],
      typeId: "type-1",
      collectionIds: [],
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        collections: undefined,
      }),
      include: {
        itemType: true,
        tags: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    expect(result.collections).toEqual([]);
  });
});

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
      orderBy: {
        createdAt: "desc",
      },
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
        orderBy: { createdAt: "desc" },
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
        orderBy: { createdAt: "desc" },
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
