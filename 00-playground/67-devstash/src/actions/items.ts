"use server";

import { auth } from "@/auth";
import {
  updateItem as updateItemQuery,
  deleteItem as deleteItemQuery,
  createItem as createItemQuery,
} from "@/lib/db/items";
import { deleteFromR2, extractKeyFromUrl } from "@/lib/r2";
import { z } from "zod";

// Custom URL validation that blocks dangerous protocols
const safeUrlSchema = z
  .string()
  .url("Invalid URL format")
  .refine(
    (url) => {
      const lower = url.toLowerCase();
      // Block dangerous protocols that could be used for XSS
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

type UpdateItemInput = z.infer<typeof UpdateItemSchema>;
type DeleteItemInput = z.infer<typeof DeleteItemSchema>;

interface UpdateItemResult {
  success: boolean;
  data?: {
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
    itemType: {
      id: string;
      name: string;
      icon: string;
      color: string;
    };
    tags: Array<{
      id: string;
      name: string;
    }>;
    collections: Array<{
      collection: {
        id: string;
        name: string;
      };
    }>;
  };
  error?: string;
}

interface DeleteItemResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

// Create Item Schema and types
const CreateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullish(),
  content: z.string().nullish(),
  url: safeUrlSchema.nullish().or(z.literal("")),
  language: z.string().trim().nullish(),
  tags: z.array(z.string().trim().min(1)).default([]),
  typeId: z.string().min(1, "Type is required"),
  // File upload fields
  fileUrl: z.string().url().nullish(),
  fileName: z.string().nullish(),
  fileSize: z.number().int().positive().nullish(),
  // Collection associations
  collectionIds: z.array(z.string().min(1)).optional(),
});

type CreateItemInput = z.infer<typeof CreateItemSchema>;

interface CreateItemResult {
  success: boolean;
  data?: {
    id: string;
    title: string;
    description: string | null;
    contentType: string;
    content: string | null;
    url: string | null;
    language: string | null;
    itemType: { id: string; name: string; icon: string; color: string };
    tags: Array<{ id: string; name: string }>;
  };
  error?: string;
}

export async function createItem(
  input: CreateItemInput,
): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const validatedFields = CreateItemSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message,
    };
  }

  const {
    title,
    description,
    content,
    url,
    language,
    tags,
    typeId,
    fileUrl,
    fileName,
    fileSize,
    collectionIds,
  } = validatedFields.data;

  try {
    const newItem = await createItemQuery(userId, {
      title,
      description: description || null,
      content: content || null,
      url: url || null,
      language: language || null,
      tags,
      typeId,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      collectionIds,
    });

    return { success: true, data: newItem };
  } catch (error) {
    console.error("CREATE_ITEM_ERROR", error);
    return { success: false, error: "Failed to create item" };
  }
}

export async function updateItem(
  input: UpdateItemInput,
): Promise<UpdateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const validatedFields = UpdateItemSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message,
    };
  }

  const {
    itemId,
    title,
    description,
    content,
    url,
    language,
    tags,
    collectionIds,
  } = validatedFields.data;

  try {
    const updatedItem = await updateItemQuery(userId, itemId, {
      title,
      description: description || null,
      content: content || null,
      url: url || null,
      language: language || null,
      tags,
      collectionIds,
    });

    return {
      success: true,
      data: updatedItem,
    };
  } catch (error) {
    console.error("UPDATE_ITEM_ERROR", error);
    return {
      success: false,
      error: "Failed to update item",
    };
  }
}

export async function deleteItem(
  input: DeleteItemInput,
): Promise<DeleteItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const validatedFields = DeleteItemSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message,
    };
  }

  const { itemId } = validatedFields.data;

  try {
    const result = await deleteItemQuery(userId, itemId);

    // Delete file from R2 if it exists
    if (result.fileUrl) {
      const key = extractKeyFromUrl(result.fileUrl);
      if (key) {
        try {
          await deleteFromR2(key);
        } catch (r2Error) {
          // Log but don't fail - the item is already deleted
          console.error("R2_DELETE_ERROR", r2Error);
        }
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("DELETE_ITEM_ERROR", error);
    return {
      success: false,
      error: "Failed to delete item",
    };
  }
}
