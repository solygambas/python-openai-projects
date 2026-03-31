import prisma from "@/lib/prisma";

export async function getRecentCollections(
  userId: string,
  limit = 6,
  isFavorite?: boolean,
) {
  // Validate limit
  const validatedLimit = Math.max(1, Math.min(limit, 50));

  const collections = await prisma.collection.findMany({
    where: {
      userId,
      ...(isFavorite !== undefined ? { isFavorite } : {}),
    },
    take: validatedLimit,
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
      items: {
        include: {
          item: {
            select: {
              itemTypeId: true,
              itemType: {
                select: {
                  id: true,
                  color: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return collections.map((collection) => {
    // Extract unique item type IDs and their colors
    const itemTypesMap = new Map<string, string>();
    const typeFrequency = new Map<string, number>();

    collection.items.forEach((itemCollection) => {
      const typeId = itemCollection.item.itemTypeId;
      const color = itemCollection.item.itemType.color;

      itemTypesMap.set(typeId, color);
      typeFrequency.set(typeId, (typeFrequency.get(typeId) || 0) + 1);
    });

    // Find the most frequent type to determine border color
    let mostFrequentTypeId = "";
    let maxFrequency = 0;

    typeFrequency.forEach((count, typeId) => {
      if (count > maxFrequency) {
        maxFrequency = count;
        mostFrequentTypeId = typeId;
      }
    });

    const borderColor = mostFrequentTypeId
      ? itemTypesMap.get(mostFrequentTypeId)
      : undefined;

    // Ensure the most frequent type is first in the list
    const otherTypeIds = Array.from(itemTypesMap.keys()).filter(
      (id) => id !== mostFrequentTypeId,
    );
    const orderedTypeIds = mostFrequentTypeId
      ? [mostFrequentTypeId, ...otherTypeIds]
      : otherTypeIds;

    return {
      ...collection,
      itemCount: collection._count.items,
      itemTypeIds: orderedTypeIds,
      borderColor,
    };
  });
}

export async function createCollection(
  userId: string,
  data: {
    name: string;
    description?: string | null;
  },
) {
  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description || null,
      userId,
    },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return {
    ...collection,
    itemCount: collection._count.items,
    itemTypeIds: [],
    borderColor: undefined,
  };
}

export async function getCollectionStats(userId: string) {
  const [
    itemCount,
    collectionCount,
    favoriteItemCount,
    favoriteCollectionCount,
  ] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return {
    itemCount,
    collectionCount,
    favoriteItemCount,
    favoriteCollectionCount,
  };
}

export async function getAllCollections(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function getAllCollectionsWithDetails(userId: string) {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
      items: {
        include: {
          item: {
            select: {
              itemTypeId: true,
              itemType: {
                select: {
                  id: true,
                  color: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return collections.map((collection) => {
    // Extract unique item type IDs and their colors
    const itemTypesMap = new Map<string, string>();
    const typeFrequency = new Map<string, number>();

    collection.items.forEach((itemCollection) => {
      const typeId = itemCollection.item.itemTypeId;
      const color = itemCollection.item.itemType.color;

      itemTypesMap.set(typeId, color);
      typeFrequency.set(typeId, (typeFrequency.get(typeId) || 0) + 1);
    });

    // Find the most frequent type to determine border color
    let mostFrequentTypeId = "";
    let maxFrequency = 0;

    typeFrequency.forEach((count, typeId) => {
      if (count > maxFrequency) {
        maxFrequency = count;
        mostFrequentTypeId = typeId;
      }
    });

    const borderColor = mostFrequentTypeId
      ? itemTypesMap.get(mostFrequentTypeId)
      : undefined;

    // Ensure the most frequent type is first in the list
    const otherTypeIds = Array.from(itemTypesMap.keys()).filter(
      (id) => id !== mostFrequentTypeId,
    );
    const orderedTypeIds = mostFrequentTypeId
      ? [mostFrequentTypeId, ...otherTypeIds]
      : otherTypeIds;

    return {
      ...collection,
      itemCount: collection._count.items,
      itemTypeIds: orderedTypeIds,
      borderColor,
    };
  });
}

export async function getCollectionById(userId: string, collectionId: string) {
  return prisma.collection.findFirst({
    where: {
      id: collectionId,
      userId,
    },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
      items: {
        include: {
          item: {
            select: {
              itemTypeId: true,
              itemType: {
                select: {
                  id: true,
                  color: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
