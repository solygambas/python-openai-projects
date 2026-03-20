import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, Star, File } from "lucide-react";
import { type DashboardItem, type IconMap } from "@/types/dashboard";

interface PinnedItemProps {
  items: DashboardItem[];
  iconMap: IconMap;
  formatDate: (date: Date) => string;
}

export function PinnedItems({ items, iconMap, formatDate }: PinnedItemProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Pin className="h-4 w-4 text-muted-foreground rotate-45" />
        <h2 className="text-xl font-semibold tracking-tight">Pinned</h2>
      </div>
      <div className="grid gap-4">
        {items.map((item) => {
          const itemType = item.itemType;
          const Icon = iconMap[itemType?.icon || 'File'] || File;
          const borderColor = itemType?.color || '#6b7280';
          
          return (
            <Card key={item.id} className="bg-card/50 backdrop-blur-sm border-white/5 group hover:border-primary/50 transition-colors relative overflow-hidden">
              {/* Colored border indicator */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1" 
                style={{ backgroundColor: borderColor }}
              />
              <CardContent className="p-4 pl-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <Icon className="h-5 w-5" style={{ color: borderColor }} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium group-hover:text-primary transition-colors">{item.title}</h3>
                      <Pin className="h-3 w-3 text-muted-foreground rotate-45" />
                      {item.isFavorite && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                    <div className="flex gap-2 pt-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap px-4">
                  {formatDate(item.createdAt)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
