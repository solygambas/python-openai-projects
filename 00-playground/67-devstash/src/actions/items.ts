'use server';

import { auth } from '@/auth';
import { updateItem as updateItemQuery, deleteItem as deleteItemQuery } from '@/lib/db/items';
import { z } from 'zod';

const UpdateItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().nullish(),
  content: z.string().nullish(),
  url: z.string().url('Invalid URL format').nullish().or(z.literal('')),
  language: z.string().trim().nullish(),
  tags: z.array(z.string().trim().min(1)).default([]),
});

const DeleteItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
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

export async function updateItem(
  input: UpdateItemInput
): Promise<UpdateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const userId = session.user.id;

  const validatedFields = UpdateItemSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message,
    };
  }

  const { itemId, title, description, content, url, language, tags } =
    validatedFields.data;

  try {
    const updatedItem = await updateItemQuery(userId, itemId, {
      title,
      description: description || null,
      content: content || null,
      url: url || null,
      language: language || null,
      tags,
    });

    return {
      success: true,
      data: updatedItem,
    };
  } catch (error) {
    console.error('UPDATE_ITEM_ERROR', error);
    return {
      success: false,
      error: 'Failed to update item',
    };
  }
}

export async function deleteItem(
  input: DeleteItemInput
): Promise<DeleteItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
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

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('DELETE_ITEM_ERROR', error);
    return {
      success: false,
      error: 'Failed to delete item',
    };
  }
}
