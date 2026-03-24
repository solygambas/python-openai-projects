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

  it("queries by item id and user id with detail relations", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "item-1" });

    await getItemDetailById("user-1", "item-1");

    expect(findFirstMock).toHaveBeenCalledTimes(1);
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
  });

  it("returns null when no item matches", async () => {
    findFirstMock.mockResolvedValueOnce(null);

    const result = await getItemDetailById("user-1", "missing-item");

    expect(result).toBeNull();
  });

  it("propagates prisma errors", async () => {
    const error = new Error("db unavailable");
    findFirstMock.mockRejectedValueOnce(error);

    await expect(getItemDetailById("user-1", "item-1")).rejects.toThrow(
      "db unavailable"
    );
  });
});