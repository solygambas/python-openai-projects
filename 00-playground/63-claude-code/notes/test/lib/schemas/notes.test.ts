import { describe, it, expect } from "vitest";
import {
  noteSchema,
  tipTapDocSchema,
  publicToggleSchema,
} from "@/lib/schemas/notes";

describe("note schemas", () => {
  it("accepts a valid note with title and tiptap content", () => {
    const valid = {
      title: "Hello",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hi" }],
          },
        ],
      },
    };

    const result = noteSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects title longer than 255 chars", () => {
    const invalid = { title: "a".repeat(300) };
    const result = noteSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/exceed 255/);
    }
  });

  it("accepts minimal doc structure for tipTap", () => {
    const doc = { type: "doc" };
    const result = tipTapDocSchema.safeParse(doc);
    expect(result.success).toBe(true);
  });

  it("validates public toggle schema", () => {
    const good = { isPublic: true };
    const bad = { isPublic: "yes" };

    expect(publicToggleSchema.safeParse(good).success).toBe(true);
    expect(publicToggleSchema.safeParse(bad).success).toBe(false);
  });
});
