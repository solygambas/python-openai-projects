import prisma from "@/lib/prisma";
import { ITEMS_PER_PAGE, COLLECTIONS_PER_PAGE } from "@/lib/utils";

export async function getPinnedItems(userId: string, limit = 20) {
  const validatedLimit = Math.max(1, Math.min(limit, 50));

  return prisma.item.findMany({
    where: {
      userId,
      isPinned: true,
    },
    take: validatedLimit,
    include: {
      itemType: true,
      tags: true,
      collections: {
        include: {
          collection: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getRecentItems(userId: string, limit = 10) {
  const validatedLimit = Math.max(1, Math.min(limit, 50));

  return prisma.item.findMany({
    where: {
      userId,
    },
    take: validatedLimit,
    include: {
      itemType: true,
      tags: true,
      collections: {
        include: {
          collection: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getItemsByType(
  userId: string,
  typeName: string,
  limit = 50,
) {
  const validatedLimit = Math.max(1, Math.min(limit, 100));

  return prisma.item.findMany({
    where: {
      userId,
      itemType: {
        name: typeName,
      },
    },
    take: validatedLimit,
    include: {
      itemType: true,
      tags: true,
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
}

export async function getItemsByCollection(
  userId: string,
  collectionId: string,
  limit = 100,
) {
  const validatedLimit = Math.max(1, Math.min(limit, 100));

  return prisma.item.findMany({
    where: {
      userId,
      collections: {
        some: {
          collectionId,
        },
      },
    },
    take: validatedLimit,
    include: {
      itemType: true,
      tags: true,
      collections: {
        include: {
          collection: true,
        },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
}

export async function getItemsByTypePaginated(
  userId: string,
  typeName: string,
  page: number = 1,
) {
  const validPage = Math.max(1, page);
  const skip = (validPage - 1) * ITEMS_PER_PAGE;
  const where = {
    userId,
    itemType: { name: typeName },
  };
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      include: { itemType: true, tags: true },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
    prisma.item.count({ where }),
  ]);
  return { items, total };
}

export async function getItemsByCollectionPaginated(
  userId: string,
  collectionId: string,
  page: number = 1,
) {
  const validPage = Math.max(1, page);
  const skip = (validPage - 1) * COLLECTIONS_PER_PAGE;
  const where = {
    userId,
    collections: { some: { collectionId } },
  };
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: COLLECTIONS_PER_PAGE,
      include: {
        itemType: true,
        tags: true,
        collections: { include: { collection: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
    prisma.item.count({ where }),
  ]);
  return { items, total };
}

export async function getItemDetailById(userId: string, itemId: string) {
  return prisma.item.findFirst({
    where: {
      id: itemId,
      userId,
    },
    include: {
      itemType: true,
      tags: true,
      collections: {
        include: {
          collection: true,
        },
      },
    },
  });
}

export async function getItemTypeCounts(userId: string) {
  const counts = await prisma.item.groupBy({
    by: ["itemTypeId"],
    where: { userId },
    _count: {
      _all: true,
    },
  });

  // Get item types to map IDs to names
  const itemTypes = await prisma.itemType.findMany();
  const typeMap = itemTypes.reduce(
    (acc, type) => {
      acc[type.id] = type.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  // Map to name -> count
  return counts.reduce(
    (acc, curr) => {
      const name = typeMap[curr.itemTypeId];
      if (name) {
        acc[name] = curr._count._all;
      }
      return acc;
    },
    {} as Record<string, number>,
  );
}

interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
  collectionIds?: string[];
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemData,
) {
  // First verify ownership
  const existingItem = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });

  if (!existingItem) {
    throw new Error("Item not found or not owned by user");
  }

  // Use a transaction to update item and sync tags
  return prisma.$transaction(async (tx) => {
    // Disconnect all existing tags
    await tx.item.update({
      where: { id: itemId },
      data: {
        tags: {
          set: [], // Clear all existing tag connections
        },
      },
    });

    // Connect or create new tags
    const tagConnections = data.tags.map((tagName) => ({
      where: { name: tagName },
      create: { name: tagName },
    }));

    // Handle collection sync if collectionIds is provided
    if (data.collectionIds !== undefined) {
      // Delete existing collection associations
      await tx.itemCollection.deleteMany({
        where: { itemId },
      });

      // Create new collection associations
      if (data.collectionIds.length > 0) {
        await tx.itemCollection.createMany({
          data: data.collectionIds.map((collectionId) => ({
            itemId,
            collectionId,
          })),
        });
      }
    }

    // Update the item with new data and tag connections
    const updatedItem = await tx.item.update({
      where: { id: itemId },
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        language: data.language,
        tags: {
          connectOrCreate: tagConnections,
        },
      },
      include: {
        itemType: true,
        tags: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    return updatedItem;
  });
}

export async function deleteItem(userId: string, itemId: string) {
  // First verify ownership and get file info
  const existingItem = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, fileUrl: true },
  });

  if (!existingItem) {
    throw new Error("Item not found or not owned by user");
  }

  // Use a transaction to delete the item
  // Note: ItemCollection relations cascade delete automatically (schema has onDelete: Cascade)
  // We need to disconnect tags first
  return prisma.$transaction(async (tx) => {
    // Disconnect all tags
    await tx.item.update({
      where: { id: itemId },
      data: {
        tags: {
          set: [],
        },
      },
    });

    // Delete the item
    await tx.item.delete({
      where: { id: itemId },
    });

    // Return file URL for cleanup (to be handled by caller)
    return { id: itemId, fileUrl: existingItem.fileUrl };
  });
}

interface CreateItemData {
  title: string;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  language?: string | null;
  tags?: string[];
  typeId: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  collectionIds?: string[];
}

export async function getAllItemsForSearch(userId: string) {
  return prisma.item.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      content: true,
      itemType: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createItem(userId: string, data: CreateItemData) {
  // Determine content type based on item type
  const type = await prisma.itemType.findUnique({
    where: { id: data.typeId },
  });

  if (!type) {
    throw new Error("Invalid item type");
  }

  // Map type name to content type
  const contentTypeMap: Record<string, "TEXT" | "FILE" | "URL"> = {
    snippet: "TEXT",
    prompt: "TEXT",
    command: "TEXT",
    note: "TEXT",
    file: "FILE",
    image: "FILE",
    link: "URL",
  };

  const contentType = contentTypeMap[type.name] || "TEXT";

  // Create the item with tags
  const tagConnections = (data.tags || []).map((tagName) => ({
    where: { name: tagName },
    create: { name: tagName },
  }));

  // Create collection connections
  const collectionConnections = (data.collectionIds || []).map(
    (collectionId) => ({
      collection: { connect: { id: collectionId } },
    }),
  );

  return prisma.item.create({
    data: {
      title: data.title,
      description: data.description || null,
      content: data.content || null,
      url: data.url || null,
      language: data.language || null,
      contentType,
      userId,
      itemTypeId: data.typeId,
      fileUrl: data.fileUrl || null,
      fileName: data.fileName || null,
      fileSize: data.fileSize || null,
      tags:
        tagConnections.length > 0
          ? { connectOrCreate: tagConnections }
          : undefined,
      collections:
        collectionConnections.length > 0
          ? { create: collectionConnections }
          : undefined,
    },
    include: {
      itemType: true,
      tags: true,
      collections: {
        include: {
          collection: true,
        },
      },
    },
  });
}

export async function getFavoriteItems(userId: string) {
  return prisma.item.findMany({
    where: {
      userId,
      isFavorite: true,
    },
    include: {
      itemType: true,
      tags: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function toggleItemFavorite(userId: string, itemId: string) {
  // First verify ownership
  const existingItem = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, isFavorite: true },
  });

  if (!existingItem) {
    throw new Error("Item not found or not owned by user");
  }

  // Toggle the favorite status
  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: { isFavorite: !existingItem.isFavorite },
    include: {
      itemType: true,
      tags: true,
      collections: {
        include: {
          collection: true,
        },
      },
    },
  });

  return updatedItem;
}

export async function toggleItemPin(userId: string, itemId: string) {
  // First verify ownership
  const existingItem = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, isPinned: true },
  });

  if (!existingItem) {
    throw new Error("Item not found or not owned by user");
  }

  // Toggle the pin status
  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: { isPinned: !existingItem.isPinned },
    include: {
      itemType: true,
      tags: true,
      collections: {
        include: {
          collection: true,
        },
      },
    },
  });

  return updatedItem;
}
