import { ItemsWithDrawer } from "@/components/dashboard/items-with-drawer";
import { type DashboardItem } from "@/types/dashboard";

interface RecentItemsProps {
  items: DashboardItem[];
  isPro?: boolean;
}

export function RecentItems({ items, isPro = false }: RecentItemsProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Recent Items</h2>
      <ItemsWithDrawer items={items} variant="recent" isPro={isPro} />
    </section>
  );
}
