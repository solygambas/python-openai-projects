import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock, updateMock, deleteMock, transactionMock } = vi.hoisted(
  () => ({
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
  }),
);

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

import { deleteItem } from "@/lib/db/items";

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
