"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateItem, deleteItem, toggleFavoriteItem } from "@/actions/items";
import { toast } from "sonner";
import type { ItemDetail, ItemDetailResponse } from "@/types/item-detail";

interface UseItemDetailOptions {
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export function useItemDetail(options: UseItemDetailOptions = {}) {
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
  const [editCollectionIds, setEditCollectionIds] = useState<string[]>([]);

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openItem = useCallback(async (itemId: string) => {
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

  const startEditing = useCallback(() => {
    if (!selectedItem) return;

    setEditTitle(selectedItem.title);
    setEditDescription(selectedItem.description || "");
    setEditContent(selectedItem.content || "");
    setEditUrl(selectedItem.url || "");
    setEditLanguage(selectedItem.language || "");
    setEditTags(selectedItem.tags.map((t) => t.name).join(", "));
    setEditCollectionIds(selectedItem.collections.map((c) => c.collection.id));
    setIsEditing(true);
  }, [selectedItem]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const saveItem = useCallback(async () => {
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
        collectionIds: editCollectionIds,
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
        } as ItemDetail;

        setSelectedItem(updatedItem);
        setIsEditing(false);
        toast.success("Item updated successfully");
        router.refresh();
        options.onUpdateSuccess?.();
      } else {
        toast.error(result.error || "Failed to update item");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedItem,
    editTitle,
    editDescription,
    editContent,
    editUrl,
    editLanguage,
    editTags,
    editCollectionIds,
    router,
    options,
  ]);

  const confirmDelete = useCallback(async () => {
    if (!selectedItem) return;

    setIsDeleting(true);

    try {
      const result = await deleteItem({ itemId: selectedItem.id });

      if (result.success) {
        toast.success("Item deleted successfully");
        setOpen(false);
        setSelectedItem(null);
        router.refresh();
        options.onDeleteSuccess?.();
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
  }, [selectedItem, router, options]);

  const copyItem = useCallback(async (itemId: string) => {
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

  const copySelectedItem = useCallback(() => {
    const copyValue = selectedItem?.content ?? selectedItem?.url ?? "";
    if (copyValue) {
      void navigator.clipboard.writeText(copyValue);
      toast.success("Copied to clipboard");
    }
  }, [selectedItem]);

  const toggleFavorite = useCallback(async () => {
    if (!selectedItem) return;

    try {
      const result = await toggleFavoriteItem({ itemId: selectedItem.id });

      if (result.success && result.data) {
        setSelectedItem({
          ...selectedItem,
          isFavorite: result.data.isFavorite,
        });
        toast.success(
          result.data.isFavorite
            ? "Added to favorites"
            : "Removed from favorites",
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to toggle favorite");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    }
  }, [selectedItem, router]);

  return {
    // State
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
    // Edit state
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
    // Actions
    openItem,
    startEditing,
    cancelEditing,
    saveItem,
    confirmDelete,
    copyItem,
    copySelectedItem,
    toggleFavorite,
  };
}
