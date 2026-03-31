"use client";

import { useEffect } from "react";
import { File } from "lucide-react";
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
import {
  ItemDrawerHeader,
  ItemDrawerActionBar,
  ItemDrawerEditBar,
  ItemDrawerContent,
  ItemDrawerContentSection,
  ItemDrawerMeta,
} from "@/components/items";
import { useItemDrawer } from "@/contexts/item-drawer-context";
import { useItemDetail } from "@/hooks/use-item-detail";
import { useCollections } from "@/hooks/use-collections";

export function GlobalItemDrawer() {
  const { currentItemId, isOpen, closeItemDrawer } = useItemDrawer();
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
    copySelectedItem,
  } = useItemDetail();

  const { collections: allCollections } = useCollections();

  // Sync global drawer state with local hook state
  useEffect(() => {
    if (isOpen && currentItemId) {
      openItem(currentItemId);
    } else if (!isOpen) {
      setOpen(false);
    }
  }, [isOpen, currentItemId, openItem, setOpen]);

  // Handle close
  const handleClose = (open: boolean) => {
    if (!open) {
      closeItemDrawer();
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
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
                onFavorite={() => {}}
                onPin={() => {}}
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
                <p className="text-muted-foreground text-sm">Description</p>
                {isEditing ? (
                  <input
                    type="text"
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
                allCollections={allCollections}
                editCollectionIds={editCollectionIds}
                onCollectionIdsChange={setEditCollectionIds}
              />
            </div>
          ) : (
            <p className="pt-6 text-sm text-muted-foreground">
              Select an item to view details.
            </p>
          )}
        </div>
      </SheetContent>

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
    </Sheet>
  );
}
