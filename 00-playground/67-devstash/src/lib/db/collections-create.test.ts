import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    collection: {
      create: createMock,
    },
  },
}));

import { createCollection } from "@/lib/db/collections";

describe("createCollection", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("creates a collection with name and description", async () => {
    const newCollection = {
      id: "col-1",
      name: "New Collection",
      description: "A test collection",
      isFavorite: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: {
        items: 0,
      },
    };

    createMock.mockResolvedValueOnce(newCollection);

    const result = await createCollection("user-1", {
      name: "New Collection",
      description: "A test collection",
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "New Collection",
        description: "A test collection",
        userId: "user-1",
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    expect(result).toEqual({
      ...newCollection,
      itemCount: 0,
      itemTypeIds: [],
      borderColor: undefined,
    });
  });

  it("creates a collection without description", async () => {
    const newCollection = {
      id: "col-2",
      name: "No Description",
      description: null,
      isFavorite: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: {
        items: 0,
      },
    };

    createMock.mockResolvedValueOnce(newCollection);

    const result = await createCollection("user-1", {
      name: "No Description",
      description: null,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "No Description",
        description: null,
        userId: "user-1",
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    expect(result.name).toBe("No Description");
    expect(result.description).toBeNull();
  });
});
