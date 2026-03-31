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
  Pin,
  Star,
  Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { ImageCard } from "@/components/dashboard/image-card";
import { FileListCard } from "@/components/dashboard/file-list-card";
import {
  ItemDrawerHeader,
  ItemDrawerActionBar,
  ItemDrawerEditBar,
  ItemDrawerContent,
  ItemDrawerContentSection,
  ItemDrawerMeta,
} from "@/components/items";
import { formatDate } from "@/lib/utils";
import { type DashboardItem, type IconMap } from "@/types/dashboard";
import { updateItem, deleteItem } from "@/actions/items";
import { toast } from "sonner";

type ItemsWithDrawerVariant = "grid" | "recent" | "pinned" | "list";

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
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
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
        error instanceof Error ? error.message : "Unable to load item",
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

  const handleCopyItem = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`);
      if (!response.ok) {
        toast.error("Failed to copy");
        return;
      }
      const data = (await response.json()) as ItemDetailResponse;
      const copyValue = data.item.content ?? data.item.url ?? "";
      if (copyValue) {
        await navigator.clipboard.writeText(copyValue);
        toast.success("Copied to clipboard");
      } else {
        toast.error("Nothing to copy");
      }
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  const handleCopySelected = () => {
    const copyValue = selectedItem?.content ?? selectedItem?.url ?? "";
    if (copyValue) {
      void navigator.clipboard.writeText(copyValue);
      toast.success("Copied to clipboard");
    }
  };

  const itemCards = useMemo(() => {
    if (variant === "grid") {
      // Check if all items are images
      const allImages = items.every(
        (item) => item.itemType?.name === "image" && item.fileUrl,
      );

      if (allImages) {
        // Use image gallery grid for images
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ImageCard
                key={item.id}
                id={item.id}
                title={item.title}
                onClick={() => onOpenItem(item.id)}
              />
            ))}
          </div>
        );
      }

      // Check if all items are files
      const allFiles = items.every(
        (item) => item.itemType?.name === "file" && item.fileUrl,
      );

      if (allFiles) {
        // Use list view for files
        return (
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <FileListCard
                key={item.id}
                id={item.id}
                fileName={item.fileName || item.title}
                fileSize={item.fileSize ?? null}
                createdAt={new Date(item.createdAt)}
                onClick={() => onOpenItem(item.id)}
                onDownload={() =>
                  window.open(`/api/download/${item.id}`, "_blank")
                }
              />
            ))}
          </div>
        );
      }

      // Regular grid for other item types
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              iconMap={iconMap}
              onClick={() => onOpenItem(item.id)}
              onCopy={() => handleCopyItem(item.id)}
            />
          ))}
        </div>
      );
    }

    if (variant === "list") {
      return (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <FileListCard
              key={item.id}
              id={item.id}
              fileName={item.fileName || item.title}
              fileSize={item.fileSize ?? null}
              createdAt={new Date(item.createdAt)}
              onClick={() => onOpenItem(item.id)}
              onDownload={() =>
                window.open(`/api/download/${item.id}`, "_blank")
              }
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
                className="w-full text-left group/card"
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
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyItem(item.id);
                        }}
                        className="h-7 w-7 rounded flex items-center justify-center opacity-0 group-hover/card:opacity-100 hover:bg-secondary transition-opacity shrink-0"
                        aria-label="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </span>
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
              className="w-full text-left flex items-center justify-between p-2 pl-3 rounded-lg hover:bg-secondary/50 transition-colors group cursor-pointer border border-transparent hover:border-white/5 relative overflow-hidden group/card"
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyItem(item.id);
                  }}
                  className="h-6 w-6 rounded flex items-center justify-center opacity-0 group-hover/card:opacity-100 hover:bg-secondary transition-opacity shrink-0"
                  aria-label="Copy to clipboard"
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }, [items, onOpenItem, handleCopyItem, variant]);

  return (
    <>
      {itemCards}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="p-0 gap-0 flex flex-col h-full">
          <SheetHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            {selectedItem ? (
              <ItemDrawerHeader
                icon={selectedItem.itemType.icon}
                color={selectedItem.itemType.color}
                typeName={selectedItem.itemType.name}
                title={selectedItem.title}
                language={selectedItem.language}
                isEditing={isEditing}
                editTitle={editTitle}
                editLanguage={editLanguage}
                onTitleChange={setEditTitle}
                onLanguageChange={setEditLanguage}
              />
            ) : (
              <div className="flex items-start gap-3 pr-8">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
                <SheetTitle className="text-xl leading-snug truncate">
                  Loading item
                </SheetTitle>
              </div>
            )}
            <SheetDescription className="sr-only">
              Item details drawer
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6 overflow-y-auto flex-1">
            <div className="flex items-center justify-between gap-4 py-3 border-b sticky top-0 bg-background z-10">
              {isEditing ? (
                <ItemDrawerEditBar
                  isSaving={isSaving}
                  hasTitle={editTitle.trim().length > 0}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : selectedItem ? (
                <ItemDrawerActionBar
                  isLoading={isLoading}
                  isFavorite={selectedItem.isFavorite}
                  isPinned={selectedItem.isPinned}
                  hasFile={!!selectedItem.fileUrl}
                  hasContent={!!(selectedItem.content || selectedItem.url)}
                  onFavorite={() => {}}
                  onPin={() => {}}
                  onCopy={handleCopySelected}
                  onDownload={() =>
                    window.open(`/api/download/${selectedItem.id}`, "_blank")
                  }
                  onEdit={handleEdit}
                  onDelete={() => setShowDeleteDialog(true)}
                />
              ) : null}
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

                <ItemDrawerContentSection
                  typeName={selectedItem.itemType.name}
                  isEditing={isEditing}
                >
                  <ItemDrawerContent
                    typeName={selectedItem.itemType.name}
                    content={selectedItem.content}
                    url={selectedItem.url}
                    fileUrl={selectedItem.fileUrl}
                    fileName={selectedItem.fileName}
                    fileSize={selectedItem.fileSize}
                    language={selectedItem.language}
                    itemId={selectedItem.id}
                    isEditing={isEditing}
                    editContent={editContent}
                    editUrl={editUrl}
                    editLanguage={editLanguage}
                    onContentChange={setEditContent}
                    onUrlChange={setEditUrl}
                  />
                </ItemDrawerContentSection>

                <Separator />

                <ItemDrawerMeta
                  tags={selectedItem.tags}
                  collections={selectedItem.collections}
                  createdAt={selectedItem.createdAt}
                  updatedAt={selectedItem.updatedAt}
                  isEditing={isEditing}
                  editTags={editTags}
                  onTagsChange={setEditTags}
                />
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
