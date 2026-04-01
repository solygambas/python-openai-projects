import { Suspense } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentCollections } from "@/components/dashboard/recent-collections";
import { PinnedItems } from "@/components/dashboard/pinned-items";
import { RecentItems } from "@/components/dashboard/recent-items";
import { getUserById } from "@/lib/db/users";
import { getCollectionStats, getRecentCollections } from "@/lib/db/collections";
import { getPinnedItems, getRecentItems } from "@/lib/db/items";
import { getItemTypes } from "@/lib/db/item-types";
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  DASHBOARD_RECENT_ITEMS_LIMIT,
} from "@/lib/utils";
import {
  StatsCardsSkeleton,
  RecentCollectionsSkeleton,
  ItemsListSkeleton,
} from "@/components/dashboard/dashboard-skeletons";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

async function StatsSection({ userId }: { userId: string }) {
  const statsData = await getCollectionStats(userId);
  const stats = [
    {
      label: "Total Items",
      value: statsData.itemCount,
      description: "All saved snippets and resources",
    },
    {
      label: "Collections",
      value: statsData.collectionCount,
      description: "Organized groups of items",
    },
    {
      label: "Favorite Items",
      value: statsData.favoriteItemCount,
      description: "Items you've starred",
    },
    {
      label: "Favorite Collections",
      value: statsData.favoriteCollectionCount,
      description: "Pinned collections",
    },
  ];
  return <StatsCards stats={stats} />;
}

async function RecentCollectionsSection({ userId }: { userId: string }) {
  const [itemTypes, recentCollections] = await Promise.all([
    getItemTypes(),
    getRecentCollections(userId, DASHBOARD_COLLECTIONS_LIMIT),
  ]);
  return (
    <RecentCollections collections={recentCollections} itemTypes={itemTypes} />
  );
}

async function PinnedItemsSection({ userId }: { userId: string }) {
  const pinnedItems = await getPinnedItems(userId);
  return <PinnedItems items={pinnedItems} />;
}

async function RecentItemsSection({ userId }: { userId: string }) {
  const recentItems = await getRecentItems(userId, DASHBOARD_RECENT_ITEMS_LIMIT);
  return <RecentItems items={recentItems} />;
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);

  if (!user) redirect("/sign-in?error=UserNotFound");

  const currentUserId = user.id;

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.name}</p>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsSection userId={currentUserId} />
      </Suspense>

      <Suspense fallback={<RecentCollectionsSkeleton />}>
        <RecentCollectionsSection userId={currentUserId} />
      </Suspense>

      <Suspense fallback={<ItemsListSkeleton />}>
        <PinnedItemsSection userId={currentUserId} />
      </Suspense>

      <Suspense fallback={<ItemsListSkeleton />}>
        <RecentItemsSection userId={currentUserId} />
      </Suspense>
    </div>
  );
}
