import { Pin } from "lucide-react";
import { type DashboardItem } from "@/types/dashboard";
import { ItemsWithDrawer } from "@/components/dashboard/items-with-drawer";

interface PinnedItemProps {
  items: DashboardItem[];
}

export function PinnedItems({ items }: PinnedItemProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Pin className="h-4 w-4 text-blue-500 rotate-45" />
        <h2 className="text-xl font-semibold tracking-tight">Pinned</h2>
      </div>
      <ItemsWithDrawer items={items} variant="pinned" />
    </section>
  );
}
