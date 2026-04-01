"use client";

import { Star, Pin, Copy, Download, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ItemDrawerActionBarProps {
  isLoading: boolean;
  isFavorite: boolean;
  isPinned: boolean;
  hasFile: boolean;
  hasContent: boolean;
  onFavorite: () => void;
  onPin: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ItemDrawerActionBar({
  isLoading,
  isFavorite,
  isPinned,
  hasFile,
  hasContent,
  onFavorite,
  onPin,
  onCopy,
  onDownload,
  onEdit,
  onDelete,
}: ItemDrawerActionBarProps) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          aria-label="Favorite"
          onClick={onFavorite}
          className={isFavorite ? "text-yellow-500" : "text-foreground"}
        >
          <Star
            className={
              isFavorite ? "fill-yellow-500 text-yellow-500" : "text-current"
            }
          />
          Favorite
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          aria-label="Pin"
          onClick={onPin}
          className={isPinned ? "text-blue-500" : "text-foreground"}
        >
          <Pin
            className={
              isPinned
                ? "text-blue-500 rotate-45"
                : "text-muted-foreground rotate-45"
            }
          />
          Pin
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading || !hasContent}
          aria-label="Copy"
          onClick={onCopy}
        >
          <Copy className="text-muted-foreground" />
          Copy
        </Button>
        {hasFile && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            aria-label="Download"
            onClick={onDownload}
          >
            <Download className="text-muted-foreground" />
            Download
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          aria-label="Edit"
          className="ml-2"
          onClick={onEdit}
        >
          <Pencil className="text-muted-foreground" />
          Edit
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={isLoading}
        aria-label="Delete"
        className="text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="text-destructive" />
      </Button>
    </>
  );
}
