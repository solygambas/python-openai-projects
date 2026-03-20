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
