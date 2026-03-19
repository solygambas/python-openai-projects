import prisma from '@/lib/prisma';

export async function getPinnedItems(userId: string) {
  return prisma.item.findMany({
    where: {
      userId,
      isPinned: true,
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
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

export async function getRecentItems(userId: string, limit = 10) {
  return prisma.item.findMany({
    where: {
      userId,
    },
    take: limit,
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
