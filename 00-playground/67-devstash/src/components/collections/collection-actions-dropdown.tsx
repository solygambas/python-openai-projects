"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  deleteCollection,
  toggleFavoriteCollection,
} from "@/actions/collections";
import { toast } from "sonner";

interface CollectionActionsDropdownProps {
  collectionId: string;
  collectionName: string;
  onEdit: () => void;
}

export function CollectionActionsDropdown({
  collectionId,
  collectionName,
  onEdit,
}: CollectionActionsDropdownProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCollection({ collectionId });
      if (result.success) {
        toast.success("Collection deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete collection");
      }
    } catch (error) {
      console.error("DELETE_COLLECTION_ERROR", error);
      toast.error("Failed to delete collection");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleToggleFavorite = async () => {
    setIsTogglingFavorite(true);
    try {
      const result = await toggleFavoriteCollection({ collectionId });
      if (result.success) {
        toast.success(
          result.data?.isFavorite
            ? "Added to favorites"
            : "Removed from favorites",
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to toggle favorite");
      }
    } catch (error) {
      console.error("TOGGLE_FAVORITE_ERROR", error);
      toast.error("Failed to toggle favorite");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-accent flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite();
            }}
            disabled={isTogglingFavorite}
          >
            <Star className="mr-2 h-4 w-4" />
            {isTogglingFavorite ? "Toggling..." : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              {`This will delete "${collectionName}". Items in this collection will not be deleted, they will just be removed from this collection.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
