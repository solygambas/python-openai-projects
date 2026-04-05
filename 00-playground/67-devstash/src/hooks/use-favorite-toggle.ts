"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleFavoriteItem } from "@/actions/items";
import { toggleFavoriteCollection } from "@/actions/collections";

interface UseFavoriteToggleOptions {
  type: "item" | "collection";
}

export function useFavoriteToggle({ type }: UseFavoriteToggleOptions) {
  const router = useRouter();

  const toggle = useCallback(
    async (id: string) => {
      try {
        const result =
          type === "item"
            ? await toggleFavoriteItem({ itemId: id })
            : await toggleFavoriteCollection({ collectionId: id });

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
      } catch {
        toast.error("An unexpected error occurred");
      }
    },
    [type, router],
  );

  return { toggle };
}
