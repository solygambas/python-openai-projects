"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { DEFAULT_EDITOR_PREFERENCES } from "@/types/editor-preferences";

const UpdateEditorPreferencesSchema = z.object({
  fontSize: z
    .number()
    .int()
    .min(10, "Font size too small")
    .max(32, "Font size too large"),
  tabSize: z.number().int().min(1).max(8),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(["vs-dark", "monokai", "github-dark"]),
});

type UpdateEditorPreferencesInput = z.infer<
  typeof UpdateEditorPreferencesSchema
>;

interface UpdateEditorPreferencesResult {
  success: boolean;
  error?: string;
}

export async function updateEditorPreferences(
  input: UpdateEditorPreferencesInput,
): Promise<UpdateEditorPreferencesResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = UpdateEditorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { editorPreferences: parsed.data },
  });

  return { success: true };
}

export async function getEditorPreferences(): Promise<UpdateEditorPreferencesInput> {
  const session = await auth();

  if (!session?.user?.id) {
    return DEFAULT_EDITOR_PREFERENCES;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { editorPreferences: true },
  });

  if (!user?.editorPreferences) {
    return DEFAULT_EDITOR_PREFERENCES;
  }

  const parsed = UpdateEditorPreferencesSchema.safeParse(
    user.editorPreferences,
  );

  return parsed.success ? parsed.data : DEFAULT_EDITOR_PREFERENCES;
}
