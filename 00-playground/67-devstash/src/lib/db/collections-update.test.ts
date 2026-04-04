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

import { updateCollection } from "@/lib/db/collections";

describe("updateCollection", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
    updateMock.mockReset();
  });

  it("updates collection name and description", async () => {
    const existingCollection = {
      id: "col-1",
      name: "Old Name",
      description: "Old description",
      isFavorite: false,
      userId: "user-1",
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T10:00:00.000Z"),
    };

    const updatedCollection = {
      ...existingCollection,
      name: "New Name",
      description: "New description",
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: { items: 2 },
    };

    findFirstMock.mockResolvedValueOnce(existingCollection);
    updateMock.mockResolvedValueOnce(updatedCollection);

    const result = await updateCollection("user-1", "col-1", {
      name: "New Name",
      description: "New description",
    });

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "col-1" },
      data: {
        name: "New Name",
        description: "New description",
        updatedAt: expect.any(Date),
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    expect(result.name).toBe("New Name");
    expect(result.description).toBe("New description");
  });

  it("throws error when collection not found", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(
      updateCollection("user-1", "non-existent", {
        name: "New Name",
        description: "New description",
      }),
    ).rejects.toThrow("Collection not found");
  });

  it("throws error when collection belongs to different user", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    await expect(
      updateCollection("user-2", "col-1", {
        name: "New Name",
        description: "New description",
      }),
    ).rejects.toThrow("Collection not found");
  });
});
