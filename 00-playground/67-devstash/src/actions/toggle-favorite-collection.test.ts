import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, toggleCollectionFavoriteQueryMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  toggleCollectionFavoriteQueryMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/collections", () => ({
  toggleCollectionFavorite: toggleCollectionFavoriteQueryMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {},
}));

vi.mock("@/lib/usage-limits", () => ({
  checkCollectionLimit: vi.fn().mockResolvedValue(true),
}));

import { toggleFavoriteCollection } from "@/actions/collections";

describe("actions/toggleFavoriteCollection", () => {
  beforeEach(() => {
    authMock.mockReset();
    toggleCollectionFavoriteQueryMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await toggleFavoriteCollection({
      collectionId: "col-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(toggleCollectionFavoriteQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when collectionId is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await toggleFavoriteCollection({ collectionId: "" });

    expect(result).toEqual({
      success: false,
      error: "Collection ID is required",
    });
    expect(toggleCollectionFavoriteQueryMock).not.toHaveBeenCalled();
  });

  it("calls query and returns success payload when toggling to favorite", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const updatedCollection = {
      id: "col-1",
      name: "Test Collection",
      description: null,
      isFavorite: true,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: { items: 5 },
    };

    toggleCollectionFavoriteQueryMock.mockResolvedValueOnce(updatedCollection);

    const result = await toggleFavoriteCollection({
      collectionId: "col-1",
    });

    expect(toggleCollectionFavoriteQueryMock).toHaveBeenCalledWith(
      "user-1",
      "col-1",
    );
    expect(result).toEqual({
      success: true,
      data: {
        id: "col-1",
        isFavorite: true,
      },
    });
  });

  it("calls query and returns success payload when toggling to unfavorite", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const updatedCollection = {
      id: "col-1",
      name: "Test Collection",
      description: null,
      isFavorite: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      _count: { items: 5 },
    };

    toggleCollectionFavoriteQueryMock.mockResolvedValueOnce(updatedCollection);

    const result = await toggleFavoriteCollection({
      collectionId: "col-1",
    });

    expect(toggleCollectionFavoriteQueryMock).toHaveBeenCalledWith(
      "user-1",
      "col-1",
    );
    expect(result).toEqual({
      success: true,
      data: {
        id: "col-1",
        isFavorite: false,
      },
    });
  });

  it("returns generic error when query throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    toggleCollectionFavoriteQueryMock.mockRejectedValueOnce(
      new Error("db unavailable"),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await toggleFavoriteCollection({
      collectionId: "col-1",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to toggle favorite",
    });
  });
});
