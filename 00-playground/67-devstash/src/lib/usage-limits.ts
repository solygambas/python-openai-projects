import prisma from "./prisma";

// Free tier limits
export const FREE_TIER_LIMITS = {
  maxItems: 50,
  maxCollections: 3,
} as const;

/**
 * Check if user can create a new item
 * @param userId - The user's ID
 * @returns true if user can create item, throws error if limit reached
 */
export async function checkItemLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Pro users have unlimited items
  if (user.isPro) {
    return true;
  }

  const itemCount = await prisma.item.count({
    where: { userId },
  });

  if (itemCount >= FREE_TIER_LIMITS.maxItems) {
    throw new Error(
      `Free tier limit reached: ${FREE_TIER_LIMITS.maxItems} items. Upgrade to Pro for unlimited items.`,
    );
  }

  return true;
}

/**
 * Check if user can create a new collection
 * @param userId - The user's ID
 * @returns true if user can create collection, throws error if limit reached
 */
export async function checkCollectionLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Pro users have unlimited collections
  if (user.isPro) {
    return true;
  }

  const collectionCount = await prisma.collection.count({
    where: { userId },
  });

  if (collectionCount >= FREE_TIER_LIMITS.maxCollections) {
    throw new Error(
      `Free tier limit reached: ${FREE_TIER_LIMITS.maxCollections} collections. Upgrade to Pro for unlimited collections.`,
    );
  }

  return true;
}

/**
 * Check if user can upload files
 * @param userId - The user's ID
 * @returns true if user can upload files, throws error if not Pro
 */
export async function canUploadFiles(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isPro) {
    throw new Error(
      "File uploads are a Pro feature. Upgrade to Pro to upload files and images.",
    );
  }

  return true;
}

/**
 * Check if user can use AI features
 * @param userId - The user's ID
 * @returns true if user can use AI, throws error if not Pro
 */
export async function canUseAI(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isPro) {
    throw new Error(
      "AI features are a Pro feature. Upgrade to Pro to use AI capabilities.",
    );
  }

  return true;
}
