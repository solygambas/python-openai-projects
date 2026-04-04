import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    item: {
      findFirst: findFirstMock,
    },
  },
}));

import { getItemDetailById } from "@/lib/db/items";

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
