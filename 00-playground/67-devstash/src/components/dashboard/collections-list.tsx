import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  MoreHorizontal,
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  LucideIcon,
} from "lucide-react";

import {
  type Collection,
  type ItemType,
  type IconMap,
} from "@/types/dashboard";

const iconMap: IconMap = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

interface CollectionsListProps {
  collections: Collection[];
  itemTypes: ItemType[];
}

export function CollectionsList({
  collections,
  itemTypes,
}: CollectionsListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => {
        const borderColor = collection.borderColor || "#6b7280";

        return (
          <Link key={collection.id} href={`/collections/${collection.id}`}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors group relative overflow-hidden cursor-pointer">
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: borderColor }}
              />
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                      {collection.name}
                    </CardTitle>
                    {collection.isFavorite && (
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {collection.itemCount} item
                    {collection.itemCount !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {collection.description}
                </p>
                <div className="flex gap-2 mt-4">
                  {collection.itemTypeIds.map((typeId) => {
                    const type = itemTypes.find((t) => t.id === typeId);
                    const Icon = iconMap[type?.icon || "File"] || File;
                    return (
                      <Icon
                        key={typeId}
                        className="h-4 w-4"
                        style={{ color: type?.color }}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
