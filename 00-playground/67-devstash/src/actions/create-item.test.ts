import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  createItemQueryMock,
  checkItemLimitMock,
  canUploadFilesMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  createItemQueryMock: vi.fn(),
  checkItemLimitMock: vi.fn(),
  canUploadFilesMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: createItemQueryMock,
}));

vi.mock("@/lib/usage-limits", () => ({
  checkItemLimit: checkItemLimitMock,
  canUploadFiles: canUploadFilesMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {},
}));

import { createItem } from "@/actions/items";

describe("actions/createItem", () => {
  beforeEach(() => {
    authMock.mockReset();
    createItemQueryMock.mockReset();
    checkItemLimitMock.mockReset();
    canUploadFilesMock.mockReset();
    vi.restoreAllMocks();
    // Default: allow actions
    checkItemLimitMock.mockResolvedValue(true);
    canUploadFilesMock.mockResolvedValue(true);
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await createItem({
      title: "New Item",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      typeId: "type-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when title is empty after trim", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await createItem({
      title: " ",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      typeId: "type-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Title is required",
    });
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when typeId is empty", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await createItem({
      title: "Valid title",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      typeId: "",
    });

    expect(result).toEqual({
      success: false,
      error: "Type is required",
    });
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when url is invalid", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await createItem({
      title: "Valid title",
      description: null,
      content: null,
      url: "not-a-url",
      language: null,
      tags: [],
      typeId: "type-1",
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid URL format",
    });
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("calls query with normalized optional fields and returns success payload", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const newItem = {
      id: "item-1",
      title: "New Item",
      description: null,
      contentType: "TEXT",
      content: null,
      url: null,
      language: null,
      itemType: {
        id: "type-1",
        name: "Snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      tags: [{ id: "tag-1", name: "tag1" }],
    };

    createItemQueryMock.mockResolvedValueOnce(newItem);

    const result = await createItem({
      title: "New Item",
      description: "",
      content: "",
      url: "",
      language: " ",
      tags: ["tag1"],
      typeId: "type-1",
    });

    expect(createItemQueryMock).toHaveBeenCalledWith("user-1", {
      title: "New Item",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: ["tag1"],
      typeId: "type-1",
      fileUrl: null,
      fileName: null,
      fileSize: null,
    });

    expect(result).toEqual({
      success: true,
      data: newItem,
    });
  });

  it("returns actual error message when create query throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    createItemQueryMock.mockRejectedValueOnce(new Error("db unavailable"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await createItem({
      title: "New Item",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      typeId: "type-1",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "db unavailable",
    });
  });
});
