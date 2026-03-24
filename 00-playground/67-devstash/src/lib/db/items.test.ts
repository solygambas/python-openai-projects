import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock, updateMock, deleteMock, transactionMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  transactionMock: vi.fn((callback) => callback({
    item: {
      update: updateMock,
      delete: deleteMock,
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    item: {
      findFirst: findFirstMock,
      update: updateMock,
      delete: deleteMock,
    },
    $transaction: transactionMock,
  },
}));

import { getItemDetailById, updateItem, deleteItem } from "@/lib/db/items";

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
    updateMock.mockResolvedValueOnce(updatedItem);     // second update (apply data)

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
      "Item not found or not owned by user"
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
    // 1. Ownership check
    findFirstMock.mockResolvedValueOnce({ id: "item-1" });

    // 2. Transaction calls
    updateMock.mockResolvedValueOnce({ id: "item-1" }); // disconnect tags
    deleteMock.mockResolvedValueOnce({ id: "item-1" }); // delete item

    const result = await deleteItem("user-1", "item-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true },
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

    expect(result).toEqual({ id: "item-1" });
  });

  it("throws error if item not found or not owned by user", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(deleteItem("user-1", "item-1")).rejects.toThrow(
      "Item not found or not owned by user"
    );

    expect(transactionMock).not.toHaveBeenCalled();
  });
});