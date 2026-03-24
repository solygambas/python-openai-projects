"use client";

import { Badge } from "@/components/ui/badge";
import { File } from "lucide-react";
import { type DashboardItem, type IconMap } from "@/types/dashboard";
import { formatDate } from "@/lib/utils";

interface ItemCardProps {
  item: DashboardItem;
  iconMap: IconMap;
  onClick?: () => void;
}

export function ItemCard({ item, iconMap, onClick }: ItemCardProps) {
  const itemType = item.itemType;
  const Icon = iconMap[itemType?.icon || "File"] || File;
  const borderColor = itemType?.color || "#6b7280";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex flex-col gap-3 p-4 pl-5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border border-border/50 hover:border-border relative overflow-hidden"
    >
      {/* Left border colored by item type */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: borderColor }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" style={{ color: borderColor }} />
          </div>
          <p className="text-sm font-medium leading-snug">{item.title}</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDate(item.createdAt)}
        </span>
      </div>
      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 pl-11">
          {item.description}
        </p>
      )}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-11">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}
