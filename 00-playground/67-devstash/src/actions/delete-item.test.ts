import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, deleteItemQueryMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteItemQueryMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  deleteItem: deleteItemQueryMock,
}));

vi.mock("@/lib/usage-limits", () => ({
  checkItemLimit: vi.fn().mockResolvedValue(true),
  canUploadFiles: vi.fn().mockResolvedValue(true),
}));

import { deleteItem } from "@/actions/items";

describe("actions/deleteItem", () => {
  beforeEach(() => {
    authMock.mockReset();
    deleteItemQueryMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await deleteItem({ itemId: "item-1" });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(deleteItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when itemId is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await deleteItem({ itemId: "" });

    expect(result).toEqual({
      success: false,
      error: "Item ID is required",
    });
    expect(deleteItemQueryMock).not.toHaveBeenCalled();
  });

  it("calls delete query and returns success payload", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    deleteItemQueryMock.mockResolvedValueOnce({ id: "item-1" });

    const result = await deleteItem({ itemId: "item-1" });

    expect(deleteItemQueryMock).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({
      success: true,
      data: { id: "item-1" },
    });
  });

  it("returns generic error when delete query throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    deleteItemQueryMock.mockRejectedValueOnce(new Error("db unavailable"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await deleteItem({ itemId: "item-1" });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to delete item",
    });
  });
});
