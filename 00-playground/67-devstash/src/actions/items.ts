"use server";

import { auth } from "@/auth";
import {
  updateItem as updateItemQuery,
  deleteItem as deleteItemQuery,
  createItem as createItemQuery,
  toggleItemFavorite as toggleItemFavoriteQuery,
  toggleItemPin as toggleItemPinQuery,
} from "@/lib/db/items";
import { deleteFromR2, extractKeyFromUrl } from "@/lib/r2";
import { checkItemLimit, canUploadFiles } from "@/lib/usage-limits";
import { z } from "zod";
import { validate, type ActionResult } from "@/lib/action-helpers";

// ============================================================================
// Schemas
// ============================================================================

const safeUrlSchema = z
  .string()
  .url("Invalid URL format")
  .refine(
    (url) => {
      const lower = url.toLowerCase();
      const dangerousProtocols = [
        "javascript:",
        "data:",
        "vbscript:",
        "file:",
        "about:",
        "blob:",
      ];
      return !dangerousProtocols.some((protocol) => lower.startsWith(protocol));
    },
    { message: "URL uses a blocked protocol" },
  );

const UpdateItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullish(),
  content: z.string().nullish(),
  url: safeUrlSchema.nullish().or(z.literal("")),
  language: z.string().trim().nullish(),
  tags: z.array(z.string().trim().min(1)).default([]),
  collectionIds: z.array(z.string().min(1)).optional(),
});

const DeleteItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

const ToggleFavoriteItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

const TogglePinItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

const CreateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullish(),
  content: z.string().nullish(),
  url: safeUrlSchema.nullish().or(z.literal("")),
  language: z.string().trim().nullish(),
  tags: z.array(z.string().trim().min(1)).default([]),
  typeId: z.string().min(1, "Type is required"),
  fileUrl: z.string().url().nullish(),
  fileName: z.string().nullish(),
  fileSize: z.number().int().positive().nullish(),
  collectionIds: z.array(z.string().min(1)).optional(),
});

// ============================================================================
// Types
// ============================================================================

interface ItemData {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: { id: string; name: string; icon: string; color: string };
  tags: Array<{ id: string; name: string }>;
  collections: Array<{ collection: { id: string; name: string } }>;
}

interface CreateItemData {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  language: string | null;
  itemType: { id: string; name: string; icon: string; color: string };
  tags: Array<{ id: string; name: string }>;
}

// ============================================================================
// Actions
// ============================================================================

export async function createItem(
  input: z.infer<typeof CreateItemSchema>,
): Promise<ActionResult<CreateItemData>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const validated = validate(CreateItemSchema, input);
  if ("error" in validated) {
    return { success: false, error: validated.error };
  }

  try {
    await checkItemLimit(userId);
    if (validated.fileUrl) {
      await canUploadFiles(userId);
    }

    const newItem = await createItemQuery(userId, {
      title: validated.title,
      description: validated.description || null,
      content: validated.content || null,
      url: validated.url || null,
      language: validated.language || null,
      tags: validated.tags,
      typeId: validated.typeId,
      fileUrl: validated.fileUrl || null,
      fileName: validated.fileName || null,
      fileSize: validated.fileSize || null,
      collectionIds: validated.collectionIds,
    });

    return { success: true, data: newItem };
  } catch (error) {
    console.error("CREATE_ITEM_ERROR", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create item",
    };
  }
}

export async function updateItem(
  input: z.infer<typeof UpdateItemSchema>,
): Promise<ActionResult<ItemData>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const validated = validate(UpdateItemSchema, input);
  if ("error" in validated) {
    return { success: false, error: validated.error };
  }

  try {
    const updatedItem = await updateItemQuery(userId, validated.itemId, {
      title: validated.title,
      description: validated.description || null,
      content: validated.content || null,
      url: validated.url || null,
      language: validated.language || null,
      tags: validated.tags,
      collectionIds: validated.collectionIds,
    });

    return { success: true, data: updatedItem };
  } catch (error) {
    console.error("UPDATE_ITEM_ERROR", error);
    return { success: false, error: "Failed to update item" };
  }
}

export async function deleteItem(
  input: z.infer<typeof DeleteItemSchema>,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const validated = validate(DeleteItemSchema, input);
  if ("error" in validated) {
    return { success: false, error: validated.error };
  }

  try {
    const result = await deleteItemQuery(userId, validated.itemId);

    if (result.fileUrl) {
      const key = extractKeyFromUrl(result.fileUrl);
      if (key) {
        try {
          await deleteFromR2(key);
        } catch (r2Error) {
          console.error("R2_DELETE_ERROR", r2Error);
        }
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("DELETE_ITEM_ERROR", error);
    return { success: false, error: "Failed to delete item" };
  }
}

export async function toggleFavoriteItem(
  input: z.infer<typeof ToggleFavoriteItemSchema>,
): Promise<ActionResult<{ id: string; isFavorite: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const validated = validate(ToggleFavoriteItemSchema, input);
  if ("error" in validated) {
    return { success: false, error: validated.error };
  }

  try {
    const updatedItem = await toggleItemFavoriteQuery(userId, validated.itemId);
    return {
      success: true,
      data: { id: updatedItem.id, isFavorite: updatedItem.isFavorite },
    };
  } catch (error) {
    console.error("TOGGLE_FAVORITE_ITEM_ERROR", error);
    return { success: false, error: "Failed to toggle favorite" };
  }
}

export async function toggleItemPin(
  input: z.infer<typeof TogglePinItemSchema>,
): Promise<ActionResult<{ id: string; isPinned: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = session.user.id;

  const validated = validate(TogglePinItemSchema, input);
  if ("error" in validated) {
    return { success: false, error: validated.error };
  }

  try {
    const updatedItem = await toggleItemPinQuery(userId, validated.itemId);
    return {
      success: true,
      data: { id: updatedItem.id, isPinned: updatedItem.isPinned },
    };
  } catch (error) {
    console.error("TOGGLE_PIN_ITEM_ERROR", error);
    return { success: false, error: "Failed to toggle pin" };
  }
}
