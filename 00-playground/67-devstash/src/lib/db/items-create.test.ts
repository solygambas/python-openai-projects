import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, createMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    item: {
      create: createMock,
    },
    itemType: {
      findUnique: findUniqueMock,
    },
  },
}));

import { createItem } from "@/lib/db/items";

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
