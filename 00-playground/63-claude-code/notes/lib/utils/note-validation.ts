import DOMPurify from "isomorphic-dompurify";
import { noteSchema, tipTapDocSchema } from "@/lib/schemas/notes";

export type SanitizedNote = {
  title: string;
  content: string; // JSON string
};

export function sanitizeAndValidateNote(
  rawTitle: unknown,
  rawContent: unknown
): { success: true; value: SanitizedNote } | { success: false; error: any } {
  const sanitized = {
    title:
      typeof rawTitle === "string"
        ? DOMPurify.sanitize(rawTitle, { ALLOWED_TAGS: [] })
        : undefined,
    content: rawContent,
  };

  const validation = noteSchema.safeParse(sanitized);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  const emptyDoc = tipTapDocSchema.parse({ type: "doc", content: [] });
  const normalizedTitle = (validation.data.title ?? "").trim();
  const title = normalizedTitle.length > 0 ? normalizedTitle : "Untitled note";
  const content = validation.data.content ?? emptyDoc;
  const contentString = JSON.stringify(content);

  if (contentString.length > 50000) {
    return {
      success: false,
      error: new Error("Content cannot exceed 50000 characters"),
    };
  }

  return { success: true, value: { title, content: contentString } };
}
