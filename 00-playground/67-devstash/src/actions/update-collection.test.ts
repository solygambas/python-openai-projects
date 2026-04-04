import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, updateCollectionQueryMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  updateCollectionQueryMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/collections", () => ({
  updateCollection: updateCollectionQueryMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {},
}));

vi.mock("@/lib/usage-limits", () => ({
  checkCollectionLimit: vi.fn().mockResolvedValue(true),
}));

import { updateCollection } from "@/actions/collections";

describe("actions/updateCollection", () => {
  beforeEach(() => {
    authMock.mockReset();
    updateCollectionQueryMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await updateCollection({
      collectionId: "col-1",
      name: "Updated Name",
      description: null,
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(updateCollectionQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when name is empty after trim", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateCollection({
      collectionId: "col-1",
      name: " ",
      description: null,
    });

    expect(result).toEqual({
      success: false,
      error: "Name is required",
    });
    expect(updateCollectionQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when collectionId is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateCollection({
      collectionId: "",
      name: "Valid Name",
      description: null,
    });

    expect(result).toEqual({
      success: false,
      error: "Collection ID is required",
    });
    expect(updateCollectionQueryMock).not.toHaveBeenCalled();
  });

  it("calls query and returns success payload", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const updatedCollection = {
      id: "col-1",
      name: "Updated Name",
      description: "Updated description",
      isFavorite: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: { items: 2 },
    };

    updateCollectionQueryMock.mockResolvedValueOnce(updatedCollection);

    const result = await updateCollection({
      collectionId: "col-1",
      name: "Updated Name",
      description: "Updated description",
    });

    expect(updateCollectionQueryMock).toHaveBeenCalledWith("user-1", "col-1", {
      name: "Updated Name",
      description: "Updated description",
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: "col-1",
        name: "Updated Name",
        description: "Updated description",
        isFavorite: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        itemCount: 2,
      },
    });
  });

  it("returns generic error when update query throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    updateCollectionQueryMock.mockRejectedValueOnce(
      new Error("db unavailable"),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await updateCollection({
      collectionId: "col-1",
      name: "Updated Name",
      description: null,
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to update collection",
    });
  });
});
