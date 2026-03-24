"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Copy,
  Pin,
  Pencil,
  Star,
  Trash2,
  Tag,
  Folder,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ItemCard } from "@/components/dashboard/item-card";
import { formatDate } from "@/lib/utils";
import { type DashboardItem, type IconMap } from "@/types/dashboard";

type ItemsWithDrawerVariant = "grid" | "recent" | "pinned";

interface ItemCollectionJoin {
  collection: {
    id: string;
    name: string;
  };
}

interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  collections: ItemCollectionJoin[];
}

interface ItemDetailResponse {
  item: ItemDetail;
}

interface ItemsWithDrawerProps {
  items: DashboardItem[];
  variant: ItemsWithDrawerVariant;
}

function formatDetailsDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
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

export function ItemsWithDrawer({ items, variant }: ItemsWithDrawerProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const onOpenItem = useCallback(async (itemId: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setOpen(true);
    setIsLoading(true);
    setLoadError(null);
    setSelectedItem(null);

    try {
      const response = await fetch(`/api/items/${itemId}`);

      if (!response.ok) {
        const errorMessage = response.status === 404
          ? "Item not found"
          : "Unable to load item";

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as ItemDetailResponse;

      if (requestIdRef.current !== requestId) {
        return;
      }

      setSelectedItem(data.item);
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setSelectedItem(null);
      setLoadError(error instanceof Error ? error.message : "Unable to load item");
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  const itemCards = useMemo(() => {
    if (variant === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              iconMap={iconMap}
              onClick={() => onOpenItem(item.id)}
            />
          ))}
        </div>
      );
    }

    if (variant === "pinned") {
      return (
        <div className="grid gap-4">
          {items.map((item) => {
            const itemType = item.itemType;
            const Icon = iconMap[itemType?.icon || "File"] || File;
            const borderColor = itemType?.color || "#6b7280";

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenItem(item.id)}
                className="w-full text-left"
              >
                <Card className="bg-card/50 backdrop-blur-sm border-white/5 group hover:border-primary/50 transition-colors relative overflow-hidden">
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
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <Pin className="h-3 w-3 text-muted-foreground rotate-45" />
                          {item.isFavorite && (
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                        <div className="flex gap-2 pt-1">
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4 font-normal"
                            >
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
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {items.map((item) => {
          const itemType = item.itemType;
          const Icon = iconMap[itemType?.icon || "File"] || File;
          const borderColor = itemType?.color || "#6b7280";

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenItem(item.id)}
              className="w-full text-left flex items-center justify-between p-2 pl-3 rounded-lg hover:bg-secondary/50 transition-colors group cursor-pointer border border-transparent hover:border-white/5 relative overflow-hidden"
            >
              <div
                className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                style={{ backgroundColor: borderColor }}
              />
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center">
                  <Icon className="h-4 w-4" style={{ color: borderColor }} />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex gap-1">
                  {item.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-4 font-normal"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }, [items, onOpenItem, variant]);

  return (
    <>
      {itemCards}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="p-0 gap-0">
          <SheetHeader className="px-6 pt-5 pb-3 border-b">
            <div className="flex items-start gap-3 pr-8">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                {selectedItem ? (
                  (() => {
                    const Icon = iconMap[selectedItem.itemType.icon] || File;
                    return <Icon className="h-5 w-5" style={{ color: selectedItem.itemType.color }} />;
                  })()
                ) : (
                  <File className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <SheetTitle className="text-xl leading-snug truncate">
                  {selectedItem?.title ?? "Loading item"}
                </SheetTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {selectedItem?.itemType.name ?? "Type"}
                  </Badge>
                  {selectedItem?.language && (
                    <Badge variant="outline" className="font-normal lowercase">
                      {selectedItem.language}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <SheetDescription className="sr-only">
              Item details drawer
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6 overflow-y-auto">
            <div className="flex items-center justify-between gap-4 py-3 border-b">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || !selectedItem}
                  aria-label="Favorite"
                  className={selectedItem?.isFavorite ? "text-yellow-500" : "text-foreground"}
                >
                  <Star
                    className={selectedItem?.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-current"}
                  />
                  Favorite
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || !selectedItem}
                  aria-label="Pin"
                >
                  <Pin className={selectedItem?.isPinned ? "text-foreground rotate-45" : "text-muted-foreground rotate-45"} />
                  Pin
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || !selectedItem}
                  aria-label="Copy"
                  onClick={() => {
                    const copyValue = selectedItem?.content ?? selectedItem?.url ?? "";
                    if (copyValue) {
                      void navigator.clipboard.writeText(copyValue);
                    }
                  }}
                >
                  <Copy className="text-muted-foreground" />
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || !selectedItem}
                  aria-label="Edit"
                  className="ml-2"
                >
                  <Pencil className="text-muted-foreground" />
                  Edit
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading || !selectedItem}
                aria-label="Delete"
                className="text-destructive"
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-4/5" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-56 w-full" />
                </div>
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-6 w-44" />
              </div>
            ) : loadError ? (
              <p className="pt-6 text-sm text-destructive">{loadError}</p>
            ) : selectedItem ? (
              <div className="space-y-6 pt-6">
                <section className="space-y-2">
                  <p className="text-muted-foreground">Description</p>
                  <p className="text-foreground text-base leading-normal">
                    {selectedItem.description || "No description"}
                  </p>
                </section>

                <section className="space-y-3">
                  <p className="text-muted-foreground">Content</p>
                  {selectedItem.itemType.name.toLowerCase() === "link" && selectedItem.url ? (
                    <a
                      href={selectedItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-h-[280px] overflow-auto rounded-lg border bg-secondary/40 p-4 text-sm leading-relaxed break-words text-blue-400 hover:text-blue-300 underline hover:underline-offset-2"
                    >
                      {selectedItem.url}
                    </a>
                  ) : (
                    <pre className="max-h-[280px] overflow-auto rounded-lg border bg-secondary/40 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-cyan-200">
                      {selectedItem.content || selectedItem.url || "No content"}
                    </pre>
                  )}
                </section>

                <Separator />

                {selectedItem.tags.length > 0 && (
                  <section className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <p>Tags</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {selectedItem.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="font-normal lowercase">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {selectedItem.collections.length > 0 && (
                  <section className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Folder className="h-4 w-4" />
                      <p>Collections</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {selectedItem.collections.map((entry) => (
                        <Badge key={entry.collection.id} variant="outline" className="font-normal">
                          {entry.collection.name}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                <Separator />

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <p>Details</p>
                  </div>
                  <div className="space-y-2 pl-6 text-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-muted-foreground">Created</p>
                      <p>{formatDetailsDate(selectedItem.createdAt)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-muted-foreground">Updated</p>
                      <p>{formatDetailsDate(selectedItem.updatedAt)}</p>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <p className="pt-6 text-sm text-muted-foreground">
                Select an item to view details.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
