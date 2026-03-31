"use server";

import { auth } from "@/auth";
import { createCollection as createCollectionQuery } from "@/lib/db/collections";
import { z } from "zod";

const CreateCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  description: z.string().trim().max(1000, "Description is too long").nullish(),
});

type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;

interface CreateCollectionResult {
  success: boolean;
  data?: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
    itemCount: number;
  };
  error?: string;
}

export async function createCollection(
  input: CreateCollectionInput,
): Promise<CreateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const validatedFields = CreateCollectionSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message,
    };
  }

  const { name, description } = validatedFields.data;

  try {
    const newCollection = await createCollectionQuery(userId, {
      name,
      description: description || null,
    });

    return { success: true, data: newCollection };
  } catch (error) {
    console.error("CREATE_COLLECTION_ERROR", error);
    return { success: false, error: "Failed to create collection" };
  }
}
