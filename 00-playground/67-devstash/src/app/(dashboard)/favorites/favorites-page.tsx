"use client";

import {
  Star,
  Folder,
  ChevronRight,
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { useItemDrawer } from "@/contexts/item-drawer-context";
import { GlobalItemDrawer } from "@/components/search/global-item-drawer";
import type { IconMap } from "@/types/dashboard";
import {
  useFavoritesSort,
  sortItems,
  sortCollections,
} from "@/hooks/use-favorites-sort";
import type {
  FavoriteItem,
  FavoriteCollection,
  ItemSortKey,
  CollectionSortKey,
} from "@/hooks/use-favorites-sort";

const iconMap: IconMap = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
  Folder,
};

interface FavoritesPageProps {
  favoriteItems: FavoriteItem[];
  favoriteCollections: FavoriteCollection[];
}

export function FavoritesPage({
  favoriteItems,
  favoriteCollections,
}: FavoritesPageProps) {
  const { openItemDrawer } = useItemDrawer();
  const { itemSort, collectionSort, setItemSort, setCollectionSort, mounted } =
    useFavoritesSort();

  const handleItemClick = (itemId: string) => {
    openItemDrawer(itemId);
  };

  const hasFavorites =
    favoriteItems.length > 0 || favoriteCollections.length > 0;

  const sortedItems = sortItems(favoriteItems, itemSort);
  const sortedCollections = sortCollections(
    favoriteCollections,
    collectionSort,
  );

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      {!hasFavorites ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Star className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-muted-foreground mb-2">
            No favorites yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Star items and collections to quickly access them here.
          </p>
        </div>
      ) : (
        <>
          {/* Items Section */}
          {favoriteItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">
                  Items{" "}
                  <span className="text-muted-foreground">
                    ({favoriteItems.length})
                  </span>
                </h2>
                {mounted && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="hidden sm:inline">Sort by</span>
                    <Select
                      value={itemSort}
                      onValueChange={(v) => setItemSort(v as ItemSortKey)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="name-asc">Name A-Z</SelectItem>
                        <SelectItem value="name-desc">Name Z-A</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="border rounded-md divide-y bg-background">
                {sortedItems.map((item) => {
                  const IconComponent =
                    iconMap[item.itemType.icon as keyof IconMap];
                  const color = item.itemType.color;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div
                        className="flex-shrink-0 p-2 rounded-md"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        {IconComponent && (
                          <IconComponent
                            className="h-4 w-4"
                            style={{ color }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(item.updatedAt)}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs font-mono"
                        style={{ color }}
                      >
                        {item.itemType.name}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collections Section */}
          {favoriteCollections.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">
                  Collections{" "}
                  <span className="text-muted-foreground">
                    ({favoriteCollections.length})
                  </span>
                </h2>
                {mounted && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="hidden sm:inline">Sort by</span>
                    <Select
                      value={collectionSort}
                      onValueChange={(v) =>
                        setCollectionSort(v as CollectionSortKey)
                      }
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="name-asc">Name A-Z</SelectItem>
                        <SelectItem value="name-desc">Name Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="border rounded-md divide-y bg-background">
                {sortedCollections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 p-2 rounded-md bg-primary/10 text-primary">
                      <Folder className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {collection.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {collection._count.items} item
                        {collection._count.items !== 1 ? "s" : ""} •{" "}
                        {formatDate(collection.updatedAt)}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <GlobalItemDrawer />
    </div>
  );
}
