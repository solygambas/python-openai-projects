import { describe, it, expect, vi } from "vitest";
import { createOrUpdateNote } from "@/lib/api/notes-client";

describe("notes-client", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("posts to create endpoint when no noteId", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as any);
    const resp = await createOrUpdateNote({ title: "T", content: {} });
    expect(fetchMock).toHaveBeenCalled();
    expect((fetchMock.mock.calls[0] as any)[0]).toBe("/api/notes");
    expect(resp.ok).toBe(true);
  });

  it("puts to update endpoint when noteId is provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: true } as any);
    await createOrUpdateNote({ noteId: "n1", title: "T", content: {} });
    expect((fetchMock.mock.calls[0] as any)[0]).toBe("/api/notes/n1");
  });
});
