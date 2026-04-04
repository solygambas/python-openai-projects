import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, createCollectionQueryMock, checkCollectionLimitMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    createCollectionQueryMock: vi.fn(),
    checkCollectionLimitMock: vi.fn(),
  }));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: createCollectionQueryMock,
}));

vi.mock("@/lib/usage-limits", () => ({
  checkCollectionLimit: checkCollectionLimitMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {},
}));

import { createCollection } from "@/actions/collections";

describe("actions/createCollection", () => {
  beforeEach(() => {
    authMock.mockReset();
    createCollectionQueryMock.mockReset();
    checkCollectionLimitMock.mockReset();
    vi.restoreAllMocks();
    // Default: allow actions
    checkCollectionLimitMock.mockResolvedValue(true);
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await createCollection({
      name: "New Collection",
      description: null,
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(createCollectionQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when name is empty after trim", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await createCollection({
      name: " ",
      description: null,
    });

    expect(result).toEqual({
      success: false,
      error: "Name is required",
    });
    expect(createCollectionQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when name exceeds max length", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await createCollection({
      name: "a".repeat(101),
      description: null,
    });

    expect(result).toEqual({
      success: false,
      error: "Name is too long",
    });
    expect(createCollectionQueryMock).not.toHaveBeenCalled();
  });

  it("calls query with normalized optional fields and returns success payload", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const newCollection = {
      id: "col-1",
      name: "New Collection",
      description: null,
      isFavorite: false,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      itemCount: 0,
      itemTypeIds: [],
      borderColor: undefined,
    };

    createCollectionQueryMock.mockResolvedValueOnce(newCollection);

    const result = await createCollection({
      name: "New Collection",
      description: "",
    });

    expect(createCollectionQueryMock).toHaveBeenCalledWith("user-1", {
      name: "New Collection",
      description: null,
    });

    expect(result).toEqual({
      success: true,
      data: newCollection,
    });
  });

  it("returns actual error message when create query throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    createCollectionQueryMock.mockRejectedValueOnce(
      new Error("db unavailable"),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await createCollection({
      name: "New Collection",
      description: null,
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "db unavailable",
    });
  });
});
