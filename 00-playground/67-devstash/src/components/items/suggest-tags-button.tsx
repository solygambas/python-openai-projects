"use client";

import { Sparkles, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SuggestTagsTriggerProps {
  onSuggest: () => void;
  isPending: boolean;
  disabled?: boolean;
}

export function SuggestTagsTrigger({
  onSuggest,
  isPending,
  disabled,
}: SuggestTagsTriggerProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onSuggest}
      disabled={disabled || isPending}
      className="h-7 gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      Suggest Tags
    </Button>
  );
}

interface TagSuggestionsListProps {
  tags: string[];
  onAccept: (tag: string) => void;
  onReject: (tag: string) => void;
  onAcceptAll: () => void;
  onClear: () => void;
}

export function TagSuggestionsList({
  tags,
  onAccept,
  onReject,
  onAcceptAll,
  onClear,
}: TagSuggestionsListProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="font-normal lowercase gap-1 pr-1"
        >
          {tag}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-primary/20 rounded-full"
            onClick={() => onAccept(tag)}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-destructive/20 rounded-full"
            onClick={() => onReject(tag)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <div className="flex items-center gap-1 ml-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAcceptAll}
          className="h-6 text-[10px] px-2"
        >
          Accept All
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 text-[10px] px-2"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
