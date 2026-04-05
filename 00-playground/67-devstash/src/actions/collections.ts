"use server";

import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  toggleCollectionFavorite as toggleCollectionFavoriteQuery,
} from "@/lib/db/collections";
import { checkCollectionLimit } from "@/lib/usage-limits";
import { z } from "zod";
import { validate, type ActionResult } from "@/lib/action-helpers";

// ============================================================================
// Schemas
// ============================================================================

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

const ToggleFavoriteCollectionSchema = z.object({
  collectionId: z.string().min(1, "Collection ID is required"),
});

// ============================================================================
// Types
// ============================================================================

interface CollectionData {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
}

// ============================================================================
// Actions
// ============================================================================

export async function createCollection(
  input: z.infer<typeof CreateCollectionSchema>,
): Promise<ActionResult<CollectionData>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const validated = validate(CreateCollectionSchema, input);
  if ("error" in validated) {
    return { success: false, error: validated.error };
  }

  try {
    await checkCollectionLimit(userId);
    const newCollection = await createCollectionQuery(userId, {
      name: validated.name,
      description: validated.description || null,
    });
    return { success: true, data: newCollection };
  } catch (error) {
    console.error("CREATE_COLLECTION_ERROR", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create collection",
    };
  }
}

export async function updateCollection(
  input: z.infer<typeof UpdateCollectionSchema>,
): Promise<ActionResult<CollectionData>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const validated = validate(UpdateCollectionSchema, input);
  if ("error" in validated) {
    return { success: false, error: validated.error };
  }

  try {
    const updatedCollection = await updateCollectionQuery(
      userId,
      validated.collectionId,
      {
        name: validated.name,
        description: validated.description || null,
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
  input: z.infer<typeof DeleteCollectionSchema>,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const validated = validate(DeleteCollectionSchema, input);
  if ("error" in validated) {
    return { success: false, error: validated.error };
  }

  try {
    const result = await deleteCollectionQuery(userId, validated.collectionId);
    return { success: true, data: result };
  } catch (error) {
    console.error("DELETE_COLLECTION_ERROR", error);
    return { success: false, error: "Failed to delete collection" };
  }
}

export async function toggleFavoriteCollection(
  input: z.infer<typeof ToggleFavoriteCollectionSchema>,
): Promise<ActionResult<{ id: string; isFavorite: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const validated = validate(ToggleFavoriteCollectionSchema, input);
  if ("error" in validated) {
    return { success: false, error: validated.error };
  }

  try {
    const updatedCollection = await toggleCollectionFavoriteQuery(
      userId,
      validated.collectionId,
    );
    return {
      success: true,
      data: {
        id: updatedCollection.id,
        isFavorite: updatedCollection.isFavorite,
      },
    };
  } catch (error) {
    console.error("TOGGLE_FAVORITE_COLLECTION_ERROR", error);
    return { success: false, error: "Failed to toggle favorite" };
  }
}
