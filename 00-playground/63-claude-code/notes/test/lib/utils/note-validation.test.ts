import { describe, it, expect } from "vitest";
import { sanitizeAndValidateNote } from "@/lib/utils/note-validation";

describe("sanitizeAndValidateNote", () => {
  it("sanitizes title and returns content JSON string", () => {
    const result = sanitizeAndValidateNote("<b>Hi</b>", { type: "doc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.title).toBe("Hi");
      expect(typeof result.value.content).toBe("string");
    }
  });

  it("returns error for overly long content", () => {
    const longText = "a".repeat(60000);
    const doc = { type: "doc", content: [{ type: "text", text: longText }] };
    const result = sanitizeAndValidateNote("T", doc);
    expect(result.success).toBe(false);
  });
});
