"use client";

import { useCallback } from "react";
import { File, Pin, Star, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  SummarizeButton,
} from "@/components/items";
import { formatDate } from "@/lib/utils";
import { ICON_MAP } from "@/lib/constants/item-types";
import { type DashboardItem } from "@/types/dashboard";
import { type ItemsWithDrawerVariant } from "@/types/item-detail";
import { useItemDetail } from "@/hooks/use-item-detail";
import { useCollections } from "@/hooks/use-collections";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { updateItem } from "@/actions/items";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ItemsWithDrawerProps {
  items: DashboardItem[];
  variant: ItemsWithDrawerVariant;
  isPro?: boolean;
}

// Pinned item card component
function PinnedItemCard({
  item,
  onOpen,
  onCopy,
}: {
  item: DashboardItem;
  onOpen: () => void;
  onCopy: () => void;
}) {
  const itemType = item.itemType;
  const Icon = ICON_MAP[itemType?.icon] || File;
  const borderColor = itemType?.color || "#6b7280";

  return (
    <Card
      onClick={onOpen}
      className="bg-card/50 backdrop-blur-sm border-white/5 group hover:border-primary/50 transition-colors relative overflow-hidden cursor-pointer"
    >
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
              <Pin className="h-3 w-3 text-blue-500 rotate-45" />
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
              onCopy();
            }}
            className="h-7 w-7 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity shrink-0"
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
  );
}

// Recent item card component
function RecentItemCard({
  item,
  onOpen,
  onCopy,
}: {
  item: DashboardItem;
  onOpen: () => void;
  onCopy: () => void;
}) {
  const itemType = item.itemType;
  const Icon = ICON_MAP[itemType?.icon] || File;
  const borderColor = itemType?.color || "#6b7280";

  return (
    <div
      onClick={onOpen}
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
          {item.isPinned && (
            <Pin className="h-3.5 w-3.5 text-blue-500 rotate-45" />
          )}
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
            onCopy();
          }}
          className="h-6 w-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity shrink-0"
          aria-label="Copy to clipboard"
        >
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground w-12 text-right">
          {formatDate(item.createdAt)}
        </span>
      </div>
    </div>
  );
}

export function ItemsWithDrawer({
  items,
  variant,
  isPro = false,
}: ItemsWithDrawerProps) {
  const router = useRouter();
  const {
    open,
    setOpen,
    isLoading,
    selectedItem,
    loadError,
    isEditing,
    isSaving,
    isDeleting,
    showDeleteDialog,
    setShowDeleteDialog,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editContent,
    setEditContent,
    editUrl,
    setEditUrl,
    editLanguage,
    setEditLanguage,
    editTags,
    setEditTags,
    editCollectionIds,
    setEditCollectionIds,
    openItem,
    startEditing,
    cancelEditing,
    saveItem,
    confirmDelete,
    copyItem,
    copySelectedItem,
    toggleFavorite,
    togglePin,
  } = useItemDetail();

  const { collections: allCollections } = useCollections();
  const { toggle: toggleItemFavorite } = useFavoriteToggle({ type: "item" });

  const handleAcceptOptimization = useCallback(
    async (newContent: string) => {
      if (!selectedItem) return;

      try {
        const result = await updateItem({
          itemId: selectedItem.id,
          title: selectedItem.title,
          description: selectedItem.description ?? undefined,
          content: newContent,
          url: selectedItem.url ?? undefined,
          language: selectedItem.language ?? undefined,
          tags: selectedItem.tags.map((t) => t.name),
          collectionIds: selectedItem.collections.map((c) => c.collection.id),
        });

        if (result.success) {
          toast.success("Prompt updated with optimized version");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to save optimized prompt");
        }
      } catch {
        toast.error("An unexpected error occurred");
      }
    },
    [selectedItem, router],
  );

  const itemCards = (() => {
    if (variant === "grid") {
      // Check if all items are images
      const allImages = items.every(
        (item) => item.itemType?.name === "image" && item.fileUrl,
      );

      if (allImages) {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ImageCard
                key={item.id}
                id={item.id}
                title={item.title}
                isPinned={item.isPinned}
                onClick={() => openItem(item.id)}
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
        return (
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <FileListCard
                key={item.id}
                id={item.id}
                fileName={item.fileName || item.title}
                fileSize={item.fileSize ?? null}
                createdAt={new Date(item.createdAt)}
                isPinned={item.isPinned}
                onClick={() => openItem(item.id)}
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
              iconMap={ICON_MAP}
              onClick={() => openItem(item.id)}
              onCopy={() => copyItem(item.id)}
              onToggleFavorite={() => toggleItemFavorite(item.id)}
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
              onClick={() => openItem(item.id)}
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
          {items.map((item) => (
            <PinnedItemCard
              key={item.id}
              item={item}
              onOpen={() => openItem(item.id)}
              onCopy={() => copyItem(item.id)}
            />
          ))}
        </div>
      );
    }

    // variant === "recent"
    return (
      <div className="grid gap-4">
        {items.map((item) => (
          <RecentItemCard
            key={item.id}
            item={item}
            onOpen={() => openItem(item.id)}
            onCopy={() => copyItem(item.id)}
          />
        ))}
      </div>
    );
  })();

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
                  onSave={saveItem}
                  onCancel={cancelEditing}
                />
              ) : selectedItem ? (
                <ItemDrawerActionBar
                  isLoading={isLoading}
                  isFavorite={selectedItem.isFavorite}
                  isPinned={selectedItem.isPinned}
                  hasFile={!!selectedItem.fileUrl}
                  hasContent={!!(selectedItem.content || selectedItem.url)}
                  onFavorite={toggleFavorite}
                  onPin={togglePin}
                  onCopy={copySelectedItem}
                  onDownload={() =>
                    window.open(`/api/download/${selectedItem.id}`, "_blank")
                  }
                  onEdit={startEditing}
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
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">Description</p>
                    {isEditing && isPro && (
                      <SummarizeButton
                        title={editTitle}
                        content={editContent || editUrl || ""}
                        onSummaryGenerated={setEditDescription}
                        isPro={isPro}
                        disabled={isSaving}
                      />
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a description..."
                      className="w-full min-h-[80px] bg-secondary/20 border border-primary/20 rounded-md p-2 resize-none text-sm"
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
                  editLanguage={editLanguage}
                  onLanguageChange={setEditLanguage}
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
                    onLanguageChange={setEditLanguage}
                    isPro={isPro}
                    itemTitle={selectedItem.title}
                    onAcceptOptimization={handleAcceptOptimization}
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
                  allCollections={allCollections}
                  editCollectionIds={editCollectionIds}
                  onCollectionIdsChange={setEditCollectionIds}
                  isPro={isPro}
                  itemTitle={selectedItem.title}
                  itemContent={selectedItem.content || undefined}
                  itemDescription={selectedItem.description || undefined}
                  itemTypeName={selectedItem.itemType.name}
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
              onClick={confirmDelete}
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
