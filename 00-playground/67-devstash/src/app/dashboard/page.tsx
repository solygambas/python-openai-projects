import { 
  mockItems, 
  mockCollections, 
  mockItemTypes
} from "@/lib/mock-data";
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

export default function DashboardPage() {
  const recentCollections = [...mockCollections]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6);
  
  const pinnedItems = mockItems.filter(i => i.isPinned);
  const recentItems = [...mockItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  const stats = [
    { label: "Total Items", value: mockItems.length, description: "All saved snippets and resources" },
    { label: "Collections", value: mockCollections.length, description: "Organized groups of items" },
    { label: "Favorite Items", value: mockItems.filter(i => i.isFavorite).length, description: "Items you've starred" },
    { label: "Favorite Collections", value: mockCollections.filter(c => c.isFavorite).length, description: "Pinned collections" },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      <StatsCards stats={stats} />
      
      <RecentCollections collections={recentCollections} mockItemTypes={mockItemTypes} />

      <PinnedItems 
        items={pinnedItems} 
        iconMap={iconMap} 
        formatDate={formatDate} 
        mockItemTypes={mockItemTypes} 
      />

      <RecentItems 
        items={recentItems} 
        iconMap={iconMap} 
        formatDate={formatDate} 
        mockItemTypes={mockItemTypes} 
      />
    </div>
  );
}
