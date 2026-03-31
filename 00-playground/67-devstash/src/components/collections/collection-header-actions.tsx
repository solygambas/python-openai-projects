"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";
import { deleteCollection } from "@/actions/collections";
import { toast } from "sonner";

interface CollectionHeaderActionsProps {
  collectionId: string;
  collectionName: string;
  collectionDescription: string | null;
  isFavorite: boolean;
}

export function CollectionHeaderActions({
  collectionId,
  collectionName,
  collectionDescription,
  isFavorite,
}: CollectionHeaderActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCollection({ collectionId });
      if (result.success) {
        toast.success("Collection deleted");
        setShowDeleteDialog(false);
        router.push("/collections");
      } else {
        toast.error(result.error || "Failed to delete collection");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("DELETE_COLLECTION_ERROR", error);
      toast.error("Failed to delete collection");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // TODO: Implement favorite toggle
          toast.info("Favorite functionality coming soon");
        }}
      >
        <Star
          className={`mr-2 h-4 w-4 ${isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`}
        />
        {isFavorite ? "Favorited" : "Favorite"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowEditDialog(true)}
      >
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>

      <EditCollectionDialog
        collectionId={collectionId}
        collectionName={collectionName}
        collectionDescription={collectionDescription}
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

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
    </div>
  );
}
