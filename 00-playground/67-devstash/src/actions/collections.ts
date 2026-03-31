"use server";

import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
} from "@/lib/db/collections";
import { z } from "zod";

const CreateCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  description: z.string().trim().max(1000, "Description is too long").nullish(),
});

const UpdateCollectionSchema = z.object({
  collectionId: z.string().min(1, "Collection ID is required"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  description: z.string().trim().max(1000, "Description is too long").nullish(),
});

const DeleteCollectionSchema = z.object({
  collectionId: z.string().min(1, "Collection ID is required"),
});

type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;
type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;
type DeleteCollectionInput = z.infer<typeof DeleteCollectionSchema>;

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

interface UpdateCollectionResult {
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

interface DeleteCollectionResult {
  success: boolean;
  data?: { id: string };
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

export async function updateCollection(
  input: UpdateCollectionInput,
): Promise<UpdateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const validatedFields = UpdateCollectionSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message,
    };
  }

  const { collectionId, name, description } = validatedFields.data;

  try {
    const updatedCollection = await updateCollectionQuery(
      userId,
      collectionId,
      {
        name,
        description: description || null,
      },
    );

    return {
      success: true,
      data: {
        id: updatedCollection.id,
        name: updatedCollection.name,
        description: updatedCollection.description,
        isFavorite: updatedCollection.isFavorite,
        createdAt: updatedCollection.createdAt,
        updatedAt: updatedCollection.updatedAt,
        itemCount: updatedCollection._count.items,
      },
    };
  } catch (error) {
    console.error("UPDATE_COLLECTION_ERROR", error);
    return { success: false, error: "Failed to update collection" };
  }
}

export async function deleteCollection(
  input: DeleteCollectionInput,
): Promise<DeleteCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const validatedFields = DeleteCollectionSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message,
    };
  }

  const { collectionId } = validatedFields.data;

  try {
    const result = await deleteCollectionQuery(userId, collectionId);
    return { success: true, data: result };
  } catch (error) {
    console.error("DELETE_COLLECTION_ERROR", error);
    return { success: false, error: "Failed to delete collection" };
  }
}
