"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  X,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/ui/code-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ItemCard } from "@/components/dashboard/item-card";
import { formatDate } from "@/lib/utils";
import { type DashboardItem, type IconMap } from "@/types/dashboard";
import { updateItem, deleteItem } from "@/actions/items";
import { toast } from "sonner";

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

// Helper to check if item type should use CodeEditor
function isCodeType(typeName: string): boolean {
  const lower = typeName.toLowerCase();
  return lower === "snippet" || lower === "command";
}

export function ItemsWithDrawer({ items, variant }: ItemsWithDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editTags, setEditTags] = useState("");

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onOpenItem = useCallback(async (itemId: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setOpen(true);
    setIsLoading(true);
    setLoadError(null);
    setSelectedItem(null);
    setIsEditing(false);
    setShowDeleteDialog(false);

    try {
      const response = await fetch(`/api/items/${itemId}`);

      if (!response.ok) {
        const errorMessage =
          response.status === 404 ? "Item not found" : "Unable to load item";

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
      setLoadError(
        error instanceof Error ? error.message : "Unable to load item"
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleEdit = () => {
    if (!selectedItem) return;

    setEditTitle(selectedItem.title);
    setEditDescription(selectedItem.description || "");
    setEditContent(selectedItem.content || "");
    setEditUrl(selectedItem.url || "");
    setEditLanguage(selectedItem.language || "");
    setEditTags(selectedItem.tags.map((t) => t.name).join(", "));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedItem || !editTitle.trim()) return;

    setIsSaving(true);

    try {
      const tagsArray = editTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const result = await updateItem({
        itemId: selectedItem.id,
        title: editTitle,
        description: editDescription,
        content: editContent,
        url: editUrl,
        language: editLanguage,
        tags: tagsArray,
      });

      if (result.success && result.data) {
        // Normalize the data for the client component state
        const updatedItem = {
          ...result.data,
          createdAt: result.data.createdAt.toISOString(),
          updatedAt: result.data.updatedAt.toISOString(),
          collections: result.data.collections.map((c) => ({
            collection: {
              id: c.collection.id,
              name: c.collection.name,
            },
          })),
        } as unknown as ItemDetail;

        setSelectedItem(updatedItem);
        setIsEditing(false);
        toast.success("Item updated successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update item");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);

    try {
      const result = await deleteItem({ itemId: selectedItem.id });

      if (result.success) {
        toast.success("Item deleted successfully");
        setOpen(false);
        setSelectedItem(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete item");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

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
                        <Icon
                          className="h-5 w-5"
                          style={{ color: borderColor }}
                        />
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
        <SheetContent side="right" className="p-0 gap-0 flex flex-col h-full">
          <SheetHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <div className="flex items-start gap-3 pr-8">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                {selectedItem ? (
                  (() => {
                    const Icon = iconMap[selectedItem.itemType.icon] || File;
                    return (
                      <Icon
                        className="h-5 w-5"
                        style={{ color: selectedItem.itemType.color }}
                      />
                    );
                  })()
                ) : (
                  <File className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Item title"
                    className="h-8 text-lg font-semibold px-2 -ml-2 bg-background border-primary/20 focus-visible:ring-primary/30"
                    autoFocus
                  />
                ) : (
                  <SheetTitle className="text-xl leading-snug truncate">
                    {selectedItem?.title ?? "Loading item"}
                  </SheetTitle>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {selectedItem?.itemType.name ?? "Type"}
                  </Badge>
                  {!isEditing && selectedItem?.language && (
                    <Badge variant="outline" className="font-normal lowercase">
                      {selectedItem.language}
                    </Badge>
                  )}
                  {isEditing &&
                    isCodeType(selectedItem?.itemType.name || "") && (
                      <Input
                        value={editLanguage}
                        onChange={(e) => setEditLanguage(e.target.value)}
                        placeholder="Language (e.g. typescript)"
                        className="h-6 text-[10px] w-32 px-1.5 bg-background border-primary/20"
                      />
                    )}
                </div>
              </div>
            </div>
            <SheetDescription className="sr-only">
              Item details drawer
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between gap-4 py-3 border-b sticky top-0 bg-background z-10">
              {isEditing ? (
                <div className="flex items-center gap-2 w-full">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isSaving || !editTitle.trim()}
                  >
                    {isSaving ? "Saving..." : "Save"}
                    {!isSaving && <Save className="ml-2 h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                    <X className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoading || !selectedItem}
                      aria-label="Favorite"
                      className={
                        selectedItem?.isFavorite
                          ? "text-yellow-500"
                          : "text-foreground"
                      }
                    >
                      <Star
                        className={
                          selectedItem?.isFavorite
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-current"
                        }
                      />
                      Favorite
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoading || !selectedItem}
                      aria-label="Pin"
                    >
                      <Pin
                        className={
                          selectedItem?.isPinned
                            ? "text-foreground rotate-45"
                            : "text-muted-foreground rotate-45"
                        }
                      />
                      Pin
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoading || !selectedItem}
                      aria-label="Copy"
                      onClick={() => {
                        const copyValue =
                          selectedItem?.content ?? selectedItem?.url ?? "";
                        if (copyValue) {
                          void navigator.clipboard.writeText(copyValue);
                          toast.success("Copied to clipboard");
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
                      onClick={handleEdit}
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
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </>
              )}
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
              <div className="space-y-6 pt-6 pb-4">
                <section className="space-y-2">
                  <p className="text-muted-foreground text-sm">Description</p>
                  {isEditing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a description..."
                      className="min-h-[80px] bg-secondary/20 border-primary/20 resize-none"
                    />
                  ) : (
                    <p className="text-foreground text-base leading-normal">
                      {selectedItem.description || "No description"}
                    </p>
                  )}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">Content</p>
                    {isEditing &&
                      selectedItem.itemType.name.toLowerCase() === "link" && (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-3 w-3 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground uppercase">
                            URL
                          </p>
                        </div>
                      )}
                  </div>

                  {isEditing ? (
                    <>
                      {selectedItem.itemType.name.toLowerCase() === "link" ? (
                        <Input
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="bg-secondary/20 border-primary/20"
                        />
                      ) : isCodeType(selectedItem.itemType.name) ? (
                        <CodeEditor
                          value={editContent}
                          onChange={(v) => setEditContent(v)}
                          language={editLanguage || "plaintext"}
                          readOnly={false}
                          maxHeight={400}
                        />
                      ) : (
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Paste content here..."
                          className="min-h-[200px] font-mono text-sm bg-secondary/20 border-primary/20 resize-y"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {selectedItem.itemType.name.toLowerCase() === "link" &&
                      selectedItem.url ? (
                        <a
                          href={selectedItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block max-h-[280px] overflow-auto rounded-lg border bg-secondary/40 p-4 text-sm leading-relaxed break-words text-blue-400 hover:text-blue-300 underline hover:underline-offset-2"
                        >
                          {selectedItem.url}
                        </a>
                      ) : isCodeType(selectedItem.itemType.name) ? (
                        <CodeEditor
                          value={selectedItem.content || ""}
                          language={selectedItem.language || "plaintext"}
                          readOnly={true}
                          maxHeight={400}
                        />
                      ) : (
                        <pre className="max-h-[280px] overflow-auto rounded-lg border bg-secondary/40 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-cyan-200">
                          {selectedItem.content ||
                            selectedItem.url ||
                            "No content"}
                        </pre>
                      )}
                    </>
                  )}
                </section>

                <Separator />

                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Tag className="h-4 w-4" />
                    <p>Tags</p>
                  </div>
                  {isEditing ? (
                    <div className="pl-6">
                      <Input
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="tag1, tag2, tag3"
                        className="bg-secondary/20 border-primary/20"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Separate tags with commas
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pl-6">
                      {selectedItem.tags.length > 0 ? (
                        selectedItem.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="font-normal lowercase"
                          >
                            {tag.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No tags
                        </p>
                      )}
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Folder className="h-4 w-4" />
                    <p>Collections</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {selectedItem.collections.length > 0 ? (
                      selectedItem.collections.map((entry) => (
                        <Badge
                          key={entry.collection.id}
                          variant="outline"
                          className="font-normal"
                        >
                          {entry.collection.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No collections
                      </p>
                    )}
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <p>Details</p>
                  </div>
                  <div className="space-y-2 pl-6 text-foreground text-sm">
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedItem?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
