import { z } from 'zod';

export const noteSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title cannot exceed 255 characters'),
  content: z.string()
    .min(1, 'Content is required')
    .max(50000, 'Content cannot exceed 50000 characters'),
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
