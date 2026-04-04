import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, deleteCollectionQueryMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteCollectionQueryMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/collections", () => ({
  deleteCollection: deleteCollectionQueryMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {},
}));

vi.mock("@/lib/usage-limits", () => ({
  checkCollectionLimit: vi.fn().mockResolvedValue(true),
}));

import { deleteCollection } from "@/actions/collections";

describe("actions/deleteCollection", () => {
  beforeEach(() => {
    authMock.mockReset();
    deleteCollectionQueryMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await deleteCollection({ collectionId: "col-1" });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(deleteCollectionQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when collectionId is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await deleteCollection({ collectionId: "" });

    expect(result).toEqual({
      success: false,
      error: "Collection ID is required",
    });
    expect(deleteCollectionQueryMock).not.toHaveBeenCalled();
  });

  it("calls delete query and returns success payload", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    deleteCollectionQueryMock.mockResolvedValueOnce({ id: "col-1" });

    const result = await deleteCollection({ collectionId: "col-1" });

    expect(deleteCollectionQueryMock).toHaveBeenCalledWith("user-1", "col-1");
    expect(result).toEqual({
      success: true,
      data: { id: "col-1" },
    });
  });

  it("returns generic error when delete query throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    deleteCollectionQueryMock.mockRejectedValueOnce(
      new Error("db unavailable"),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await deleteCollection({ collectionId: "col-1" });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to delete collection",
    });
  });
});
