"use client";

import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import type { IconMap } from "@/types/dashboard";

interface ItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
}

const iconMap: IconMap = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

interface ItemTypeSelectorProps {
  types: ItemType[];
  selectedTypeId: string;
  onSelect: (typeId: string) => void;
}

export function ItemTypeSelector({
  types,
  selectedTypeId,
  onSelect,
}: ItemTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Type
      </label>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const IconComponent = iconMap[type.icon as keyof typeof iconMap];
          const isSelected = selectedTypeId === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-secondary/50"
              }`}
            >
              {IconComponent && (
                <IconComponent
                  className="h-4 w-4"
                  style={{ color: type.color }}
                />
              )}
              <span className="text-sm capitalize">{type.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
