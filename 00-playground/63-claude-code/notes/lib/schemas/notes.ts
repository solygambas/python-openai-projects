import { z } from "zod";

export const tipTapDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const noteSchema = z.object({
  title: z.string().max(255, "Title cannot exceed 255 characters").optional(),
  content: tipTapDocSchema.optional(),
});

export type NoteInput = z.infer<typeof noteSchema>;

export const noteResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type NoteResponse = z.infer<typeof noteResponseSchema>;

export const publicToggleSchema = z.object({
  isPublic: z.boolean(),
});

export type PublicToggleInput = z.infer<typeof publicToggleSchema>;
