import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock, deleteMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    collection: {
      findFirst: findFirstMock,
      delete: deleteMock,
    },
  },
}));

import { deleteCollection } from "@/lib/db/collections";

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
