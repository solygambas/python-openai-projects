import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findFirstMock,
  updateMock,
  transactionMock,
  deleteManyMock,
  createManyMock,
} = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
  transactionMock: vi.fn((callback) =>
    callback({
      item: {
        update: updateMock,
      },
      itemCollection: {
        deleteMany: deleteManyMock,
        createMany: createManyMock,
      },
    }),
  ),
  deleteManyMock: vi.fn(),
  createManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    item: {
      findFirst: findFirstMock,
      update: updateMock,
    },
    $transaction: transactionMock,
  },
}));

import { updateItem } from "@/lib/db/items";

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
