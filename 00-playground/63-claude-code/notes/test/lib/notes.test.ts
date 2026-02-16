import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockQuery = vi.fn();
const mockRun = vi.fn();

vi.mock("@/lib/db", () => ({
  get: (...args: any[]) => mockGet(...args),
  query: (...args: any[]) => mockQuery(...args),
  run: (...args: any[]) => mockRun(...args),
}));

vi.mock("nanoid", () => ({
  nanoid: (n: number) => "a".repeat(n),
}));

import {
  getNoteById,
  getNotesByUser,
  updateNote,
  deleteNote,
  generateSlug,
  getNoteByPublicSlug,
  togglePublicSharing,
} from "@/lib/notes";

describe("lib/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getNoteById returns mapped note or null", async () => {
    mockGet.mockReturnValueOnce(null);
    const none = await getNoteById("u1", "n1");
    expect(none).toBeNull();

    const row = {
      id: "n1",
      user_id: "u1",
      title: "T",
      content: "{}",
      is_public: 1,
      public_slug: "s",
      created_at: "2020-01-01",
      updated_at: "2020-01-02",
    };

    mockGet.mockReturnValueOnce(row);
    const note = await getNoteById("u1", "n1");
    expect(note).not.toBeNull();
    expect(note?.id).toBe("n1");
    expect(note?.userId).toBe("u1");
    expect(note?.isPublic).toBe(true);
    expect(note?.publicSlug).toBe("s");
  });

  it("getNotesByUser maps list rows", async () => {
    const rows = [
      {
        id: "n1",
        title: "A",
        is_public: 0,
        public_slug: null,
        created_at: "2020-01-01",
        updated_at: "2020-01-02",
      },
    ];

    mockQuery.mockReturnValueOnce(rows);
    const list = await getNotesByUser("u1");
    expect(Array.isArray(list)).toBe(true);
    expect(list[0].id).toBe("n1");
    expect(list[0].isPublic).toBe(false);
  });

  it("updateNote and deleteNote return boolean based on changes", async () => {
    mockRun.mockReturnValueOnce({ changes: 1 });
    const updated = await updateNote("u1", "n1", "t", "{}");
    expect(updated).toBe(true);

    mockRun.mockReturnValueOnce({ changes: 0 });
    const notUpdated = await updateNote("u1", "n1", "t", "{}");
    expect(notUpdated).toBe(false);

    mockRun.mockReturnValueOnce({ changes: 1 });
    const deleted = await deleteNote("u1", "n1");
    expect(deleted).toBe(true);
  });

  it("generateSlug returns length 12 string", () => {
    const s = generateSlug();
    expect(typeof s).toBe("string");
    expect(s.length).toBe(12);
  });

  it("getNoteByPublicSlug returns mapped note or null", async () => {
    mockGet.mockReturnValueOnce(null);
    const none = await getNoteByPublicSlug("abc");
    expect(none).toBeNull();

    const row = {
      id: "n2",
      user_id: "u2",
      title: "Public",
      content: "{}",
      is_public: 1,
      public_slug: "abc",
      created_at: "2020-01-01",
      updated_at: "2020-01-02",
    };

    mockGet.mockReturnValueOnce(row);
    const note = await getNoteByPublicSlug("abc");
    expect(note).not.toBeNull();
    expect(note?.publicSlug).toBe("abc");
  });

  it("togglePublicSharing enables sharing with existing slug or new one", async () => {
    const existingRow = {
      id: "n3",
      user_id: "u3",
      title: "X",
      content: "{}",
      is_public: 0,
      public_slug: null,
      created_at: "2020-01-01",
      updated_at: "2020-01-02",
    };

    const updatedRow = {
      ...existingRow,
      is_public: 1,
      public_slug: "fixedslug12",
    };

    mockGet.mockReturnValueOnce(existingRow).mockReturnValueOnce(updatedRow);
    mockRun.mockReturnValueOnce({ changes: 1 });

    const result = await togglePublicSharing("u3", "n3", true);
    expect(result).not.toBeNull();
    expect(result?.isPublic).toBe(true);
    expect(result?.publicSlug).toBe("fixedslug12");
  });

  it("togglePublicSharing disables sharing", async () => {
    const updatedRow = {
      id: "n4",
      user_id: "u4",
      title: "Y",
      content: "{}",
      is_public: 0,
      public_slug: "keep-it",
      created_at: "2020-01-01",
      updated_at: "2020-01-02",
    };

    mockRun.mockReturnValueOnce({ changes: 1 });
    mockGet.mockReturnValueOnce(updatedRow);

    const result = await togglePublicSharing("u4", "n4", false);
    expect(result).not.toBeNull();
    expect(result?.isPublic).toBe(false);
    expect(result?.publicSlug).toBe("keep-it");
  });
});
