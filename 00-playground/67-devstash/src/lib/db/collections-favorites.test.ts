import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock, updateMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    collection: {
      findFirst: findFirstMock,
      update: updateMock,
    },
  },
}));

import { toggleCollectionFavorite } from "@/lib/db/collections";

describe("toggleCollectionFavorite", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
  });

  it("toggles collection favorite status from false to true", async () => {
    // Ownership check - collection exists and isFavorite is false
    findFirstMock.mockResolvedValueOnce({
      id: "col-1",
      isFavorite: false,
    });

    // Mock the update to return the updated collection with isFavorite: true
    const updatedCollection = {
      id: "col-1",
      name: "Test Collection",
      description: "A test collection",
      isFavorite: true,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: { items: 5 },
    };

    updateMock.mockResolvedValueOnce(updatedCollection);

    const result = await toggleCollectionFavorite("user-1", "col-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
      select: { id: true, isFavorite: true },
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "col-1" },
      data: { isFavorite: true },
      include: expect.any(Object),
    });

    expect(result.isFavorite).toBe(true);
  });

  it("toggles collection favorite status from true to false", async () => {
    // Ownership check - collection exists and isFavorite is true
    findFirstMock.mockResolvedValueOnce({
      id: "col-1",
      isFavorite: true,
    });

    // Mock the update to return the updated collection with isFavorite: false
    const updatedCollection = {
      id: "col-1",
      name: "Test Collection",
      description: "A test collection",
      isFavorite: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: { items: 5 },
    };

    updateMock.mockResolvedValueOnce(updatedCollection);

    const result = await toggleCollectionFavorite("user-1", "col-1");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
      select: { id: true, isFavorite: true },
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "col-1" },
      data: { isFavorite: false },
      include: expect.any(Object),
    });

    expect(result.isFavorite).toBe(false);
  });

  it("throws error when collection not found or not owned by user", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(toggleCollectionFavorite("user-1", "item-1")).rejects.toThrow(
      "Collection not found or not owned by user",
    );

    expect(updateMock).not.toHaveBeenCalled();
  });
});
