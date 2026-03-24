import prisma from '@/lib/prisma';

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
      updatedAt: 'desc',
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
      createdAt: 'desc',
    },
  });
}

export async function getItemsByType(userId: string, typeName: string, limit = 50) {
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
    orderBy: {
      createdAt: 'desc',
    },
  });
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
    by: ['itemTypeId'],
    where: { userId },
    _count: {
      _all: true,
    },
  });
  
  // Get item types to map IDs to names
  const itemTypes = await prisma.itemType.findMany();
  const typeMap = itemTypes.reduce((acc, type) => {
    acc[type.id] = type.name;
    return acc;
  }, {} as Record<string, string>);

  // Map to name -> count
  return counts.reduce((acc, curr) => {
    const name = typeMap[curr.itemTypeId];
    if (name) {
      acc[name] = curr._count._all;
    }
    return acc;
  }, {} as Record<string, number>);
}

interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemData
) {
  // First verify ownership
  const existingItem = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });

  if (!existingItem) {
    throw new Error('Item not found or not owned by user');
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
  // First verify ownership
  const existingItem = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });

  if (!existingItem) {
    throw new Error('Item not found or not owned by user');
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

    return { id: itemId };
  });
}
