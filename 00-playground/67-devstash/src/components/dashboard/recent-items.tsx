import { Badge } from "@/components/ui/badge";
import { File } from "lucide-react";

interface RecentItemsProps {
  items: any[];
  iconMap: Record<string, any>;
  formatDate: (date: Date) => string;
  mockItemTypes: any[];
}

export function RecentItems({ items, iconMap, formatDate, mockItemTypes }: RecentItemsProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Recent Items</h2>
      <div className="grid gap-4">
        {items.map((item) => {
          const itemType = mockItemTypes.find(t => t.id === item.itemTypeId);
          const Icon = iconMap[itemType?.icon || 'File'] || File;
          
          return (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center">
                  <Icon className="h-4 w-4" style={{ color: itemType?.color || 'currentColor' }} />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="hidden sm:flex gap-1">
                  {item.tags.slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
