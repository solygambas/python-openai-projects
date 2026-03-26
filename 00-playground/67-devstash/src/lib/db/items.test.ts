import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findFirstMock,
  updateMock,
  deleteMock,
  transactionMock,
  createMock,
  findUniqueMock,
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
    }),
  ),
  createMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    item: {
      findFirst: findFirstMock,
      update: updateMock,
      delete: deleteMock,
      create: createMock,
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
} from "@/lib/db/items";

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
      },
      include: {
        itemType: true,
        tags: true,
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
      }),
      include: {
        itemType: true,
        tags: true,
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
});
