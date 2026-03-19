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

const iconMap: Record<string, any> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
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

  const [
    itemTypes,
    recentCollections,
    statsData,
    pinnedItems,
    recentItems
  ] = await Promise.all([
    getItemTypes(),
    getRecentCollections(userId),
    getCollectionStats(userId),
    getPinnedItems(userId),
    getRecentItems(userId)
  ]);

  const stats = [
    { label: "Total Items", value: statsData.itemCount, description: "All saved snippets and resources" },
    { label: "Collections", value: statsData.collectionCount, description: "Organized groups of items" },
    { label: "Favorite Items", value: statsData.favoriteItemCount, description: "Items you've starred" },
    { label: "Favorite Collections", value: statsData.favoriteCollectionCount, description: "Pinned collections" },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {demoUser.name}
        </p>
      </div>

      <StatsCards stats={stats} />
      
      <RecentCollections 
        collections={recentCollections as any} 
        itemTypes={itemTypes} 
      />

      <PinnedItems 
        items={pinnedItems as any} 
        iconMap={iconMap} 
        formatDate={formatDate} 
      />

      <RecentItems 
        items={recentItems as any} 
        iconMap={iconMap} 
        formatDate={formatDate} 
      />
    </div>
  );
}
