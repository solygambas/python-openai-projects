import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  updateItemQueryMock,
  deleteItemQueryMock,
  createItemQueryMock,
  createCollectionQueryMock,
  updateCollectionQueryMock,
  deleteCollectionQueryMock,
  prismaUserUpdateMock,
  prismaUserFindUniqueMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  updateItemQueryMock: vi.fn(),
  deleteItemQueryMock: vi.fn(),
  createItemQueryMock: vi.fn(),
  createCollectionQueryMock: vi.fn(),
  updateCollectionQueryMock: vi.fn(),
  deleteCollectionQueryMock: vi.fn(),
  prismaUserUpdateMock: vi.fn(),
  prismaUserFindUniqueMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  updateItem: updateItemQueryMock,
  deleteItem: deleteItemQueryMock,
  createItem: createItemQueryMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      update: prismaUserUpdateMock,
      findUnique: prismaUserFindUniqueMock,
    },
  },
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: createCollectionQueryMock,
  updateCollection: updateCollectionQueryMock,
  deleteCollection: deleteCollectionQueryMock,
}));

import { updateItem, deleteItem, createItem } from "@/actions/items";
import {
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/actions/collections";
import {
  updateEditorPreferences,
  getEditorPreferences,
} from "@/actions/editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES } from "@/types/editor-preferences";

describe("actions/updateItem", () => {
  beforeEach(() => {
    authMock.mockReset();
    updateItemQueryMock.mockReset();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when no session user id exists", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await updateItem({
      itemId: "item-1",
      title: "Valid title",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when title is empty after trim", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateItem({
      itemId: "item-1",
      title: " ",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Title is required",
    });
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns zod validation error when url is invalid", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateItem({
      itemId: "item-1",
      title: "Valid title",
      description: null,
      content: null,
      url: "not-a-url",
      language: null,
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Invalid URL format",
    });
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it("calls query with normalized optional fields and returns success payload", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const updatedItem = {
      id: "item-1",
      title: "Updated title",
      description: null,
      contentType: "TEXT",
      content: null,
      url: null,
      language: null,
      isFavorite: false,
      isPinned: true,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
      itemType: {
        id: "type-1",
        name: "Snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      tags: [{ id: "tag-1", name: "tag1" }],
      collections: [{ collection: { id: "col-1", name: "Main" } }],
    };

    updateItemQueryMock.mockResolvedValueOnce(updatedItem);

    const result = await updateItem({
      itemId: "item-1",
      title: "Updated title",
      description: "",
      content: "",
      url: "",
      language: " ",
      tags: ["tag1"],
    });

    expect(updateItemQueryMock).toHaveBeenCalledWith("user-1", "item-1", {
      title: "Updated title",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: ["tag1"],
    });

    expect(result).toEqual({
      success: true,
      data: updatedItem,
    });
  });

  it("returns generic error when update query throws", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    updateItemQueryMock.mockRejectedValueOnce(new Error("db unavailable"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = await updateItem({
      itemId: "item-1",
      title: "Updated title",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Failed to update item",
    });
  });
});

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

describe("actions/createItem", () => {
  beforeEach(() => {
    authMock.mockReset();
    createItemQueryMock.mockReset();
    vi.restoreAllMocks();
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

  it("returns generic error when create query throws", async () => {
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
      error: "Failed to create item",
    });
  });
});

describe("actions/createCollection", () => {
  beforeEach(() => {
    authMock.mockReset();
    createCollectionQueryMock.mockReset();
    vi.restoreAllMocks();
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

  it("returns generic error when create query throws", async () => {
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
      error: "Failed to create collection",
    });
  });
});

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

describe("actions/updateEditorPreferences", () => {
  beforeEach(() => {
    authMock.mockReset();
    prismaUserUpdateMock.mockReset();
  });

  it("returns unauthorized when no session", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await updateEditorPreferences(DEFAULT_EDITOR_PREFERENCES);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("returns validation error when fontSize is below minimum", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 5,
    });

    expect(result).toEqual({ success: false, error: "Font size too small" });
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("returns validation error when fontSize is above maximum", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 100,
    });

    expect(result).toEqual({ success: false, error: "Font size too large" });
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("returns validation error for invalid theme", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({
      ...DEFAULT_EDITOR_PREFERENCES,
      // @ts-expect-error intentional invalid value
      theme: "invalid-theme",
    });

    expect(result.success).toBe(false);
    expect(prismaUserUpdateMock).not.toHaveBeenCalled();
  });

  it("calls prisma update and returns success with valid input", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaUserUpdateMock.mockResolvedValueOnce({});

    const result = await updateEditorPreferences({
      fontSize: 14,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai",
    });

    expect(prismaUserUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        editorPreferences: {
          fontSize: 14,
          tabSize: 4,
          wordWrap: false,
          minimap: true,
          theme: "monokai",
        },
      },
    });
    expect(result).toEqual({ success: true });
  });
});

describe("actions/getEditorPreferences", () => {
  beforeEach(() => {
    authMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
  });

  it("returns defaults when no session", async () => {
    authMock.mockResolvedValueOnce(null);

    const result = await getEditorPreferences();

    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(prismaUserFindUniqueMock).not.toHaveBeenCalled();
  });

  it("returns defaults when user has no editorPreferences", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaUserFindUniqueMock.mockResolvedValueOnce({
      editorPreferences: null,
    });

    const result = await getEditorPreferences();

    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns defaults when stored preferences fail validation", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    prismaUserFindUniqueMock.mockResolvedValueOnce({
      editorPreferences: { fontSize: "not-a-number" },
    });

    const result = await getEditorPreferences();

    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns stored preferences when valid", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
    const stored = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "github-dark" as const,
    };
    prismaUserFindUniqueMock.mockResolvedValueOnce({
      editorPreferences: stored,
    });

    const result = await getEditorPreferences();

    expect(result).toEqual(stored);
  });
});
