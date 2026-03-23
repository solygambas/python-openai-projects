import { Suspense } from "react";
import { 
  Code, 
  Sparkles, 
  Terminal, 
  StickyNote, 
  File, 
  Image as ImageIcon, 
  Link as LinkIcon
} from "lucide-react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentCollections } from "@/components/dashboard/recent-collections";
import { PinnedItems } from "@/components/dashboard/pinned-items";
import { RecentItems } from "@/components/dashboard/recent-items";
import { getDemoUser } from "@/lib/db/users";
import { getCollectionStats, getRecentCollections } from "@/lib/db/collections";
import { getPinnedItems, getRecentItems } from "@/lib/db/items";
import { getItemTypes } from "@/lib/db/item-types";
import { type IconMap } from "@/types/dashboard";
import { 
  StatsCardsSkeleton, 
  RecentCollectionsSkeleton, 
  ItemsListSkeleton 
} from "@/components/dashboard/dashboard-skeletons";

const iconMap: IconMap = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

async function StatsSection({ userId }: { userId: string }) {
  const statsData = await getCollectionStats(userId);
  const stats = [
    { label: "Total Items", value: statsData.itemCount, description: "All saved snippets and resources" },
    { label: "Collections", value: statsData.collectionCount, description: "Organized groups of items" },
    { label: "Favorite Items", value: statsData.favoriteItemCount, description: "Items you've starred" },
    { label: "Favorite Collections", value: statsData.favoriteCollectionCount, description: "Pinned collections" },
  ];
  return <StatsCards stats={stats} />;
}

async function RecentCollectionsSection({ userId }: { userId: string }) {
  const [itemTypes, recentCollections] = await Promise.all([
    getItemTypes(),
    getRecentCollections(userId)
  ]);
  return <RecentCollections collections={recentCollections} itemTypes={itemTypes} />;
}

async function PinnedItemsSection({ userId }: { userId: string }) {
  const pinnedItems = await getPinnedItems(userId);
  return <PinnedItems items={pinnedItems} iconMap={iconMap} />;
}

async function RecentItemsSection({ userId }: { userId: string }) {
  const recentItems = await getRecentItems(userId);
  return <RecentItems items={recentItems} iconMap={iconMap} />;
}

export default async function DashboardPage() {
  const demoUser = await getDemoUser();
  
  if (!demoUser) {
    return (
      <div className="flex flex-col gap-8 p-4 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Demo user not found. Please run the seed script.</p>
      </div>
    );
  }

  const userId = demoUser.id;

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {demoUser.name}
        </p>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsSection userId={userId} />
      </Suspense>
      
      <Suspense fallback={<RecentCollectionsSkeleton />}>
        <RecentCollectionsSection userId={userId} />
      </Suspense>

      <Suspense fallback={<ItemsListSkeleton />}>
        <PinnedItemsSection userId={userId} />
      </Suspense>

      <Suspense fallback={<ItemsListSkeleton />}>
        <RecentItemsSection userId={userId} />
      </Suspense>
    </div>
  );
}
