import prisma from "@/lib/prisma";

/**
 * Get the count of items for a user
 */
export async function getItemCount(userId: string): Promise<number> {
  return prisma.item.count({
    where: { userId },
  });
}

/**
 * Get the count of collections for a user
 */
export async function getCollectionCount(userId: string): Promise<number> {
  return prisma.collection.count({
    where: { userId },
  });
}
