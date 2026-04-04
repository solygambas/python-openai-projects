"use client";

import { useState, useTransition } from "react";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { autoTagItem } from "@/actions/ai";
import { toast } from "sonner";

interface SuggestTagsButtonProps {
  title: string;
  content: string;
  description?: string;
  currentTags: string;
  onTagsChange: (tags: string) => void;
  isPro: boolean;
  disabled?: boolean;
}

export function SuggestTagsButton({
  title,
  content,
  description,
  currentTags,
  onTagsChange,
  isPro,
  disabled,
}: SuggestTagsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSuggestTags = () => {
    if (!title.trim()) {
      toast.error("Please enter a title first");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter some content first");
      return;
    }

    startTransition(async () => {
      const result = await autoTagItem({
        title: title.trim(),
        content: content.trim(),
        description: description?.trim(),
      });

      if (result.success && result.data) {
        setSuggestedTags(result.data.tags);
        setShowSuggestions(true);

        if (result.remaining !== undefined) {
          toast.success(
            `Suggested ${result.data.tags.length} tags (${result.remaining} requests remaining today)`,
          );
        } else {
          toast.success(`Suggested ${result.data.tags.length} tags`);
        }
      } else {
        toast.error(result.error || "Failed to generate tags");
      }
    });
  };

  const handleAcceptTag = (tag: string) => {
    // Parse existing tags
    const existingTags = currentTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Add new tag if not already present
    if (!existingTags.includes(tag)) {
      const newTags = [...existingTags, tag];
      onTagsChange(newTags.join(", "));
    }

    // Remove from suggestions
    setSuggestedTags((prev) => prev.filter((t) => t !== tag));

    if (suggestedTags.length === 1) {
      setShowSuggestions(false);
      toast.success(`Added "${tag}" tag`);
    }
  };

  const handleRejectTag = (tag: string) => {
    setSuggestedTags((prev) => prev.filter((t) => t !== tag));

    if (suggestedTags.length === 1) {
      setShowSuggestions(false);
    }
  };

  const handleAcceptAll = () => {
    // Parse existing tags
    const existingTags = currentTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Merge with suggested tags, avoiding duplicates
    const mergedTags = [...new Set([...existingTags, ...suggestedTags])];
    onTagsChange(mergedTags.join(", "));

    setShowSuggestions(false);
    toast.success(`Added ${suggestedTags.length} tags`);
  };

  const handleClearSuggestions = () => {
    setSuggestedTags([]);
    setShowSuggestions(false);
  };

  // Don't render if not Pro
  if (!isPro) {
    return null;
  }

  // Show suggestions as inline badges next to the button
  if (showSuggestions && suggestedTags.length > 0) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {suggestedTags.map((tag) => (
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
              className="h-4 w-4 p-0 hover:bg-primary/20"
              onClick={() => handleAcceptTag(tag)}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-destructive/20"
              onClick={() => handleRejectTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAcceptAll}
          className="h-6 text-xs"
        >
          Accept All
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearSuggestions}
          className="h-6 text-xs"
        >
          Clear
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSuggestTags}
      disabled={disabled || isPending || !title.trim() || !content.trim()}
      className="h-7 gap-1 text-xs"
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
