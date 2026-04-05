"use client";

import { useState, useTransition } from "react";
import { autoTagItem } from "@/actions/ai";
import { toast } from "sonner";

interface UseSuggestTagsOptions {
  title: string;
  content: string;
  description?: string;
  currentTags: string;
  onTagsChange: (tags: string) => void;
}

export function useSuggestTags({
  title,
  content,
  description,
  currentTags,
  onTagsChange,
}: UseSuggestTagsOptions) {
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

      if (result.success) {
        setSuggestedTags(result.data.tags);
        setShowSuggestions(true);

        if (result.remaining <= 2) {
          toast.success(
            `Suggested ${result.data.tags.length} tags (${result.remaining} requests remaining this hour)`,
          );
        } else {
          toast.success(`Suggested ${result.data.tags.length} tags`);
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleAcceptTag = (tag: string) => {
    const existingTags = currentTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (!existingTags.includes(tag)) {
      const newTags = [...existingTags, tag];
      onTagsChange(newTags.join(", "));
    }

    setSuggestedTags((prev) => {
      const remaining = prev.filter((t) => t !== tag);
      if (remaining.length === 0) {
        setShowSuggestions(false);
      }
      return remaining;
    });

    toast.success(`Added "${tag}" tag`);
  };

  const handleRejectTag = (tag: string) => {
    setSuggestedTags((prev) => {
      const remaining = prev.filter((t) => t !== tag);
      if (remaining.length === 0) {
        setShowSuggestions(false);
      }
      return remaining;
    });
  };

  const handleAcceptAll = () => {
    const existingTags = currentTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const mergedTags = [...new Set([...existingTags, ...suggestedTags])];
    onTagsChange(mergedTags.join(", "));

    setSuggestedTags([]);
    setShowSuggestions(false);
    toast.success(`Added ${suggestedTags.length} tags`);
  };

  const handleClearSuggestions = () => {
    setSuggestedTags([]);
    setShowSuggestions(false);
  };

  return {
    isPending,
    suggestedTags,
    showSuggestions,
    handleSuggestTags,
    handleAcceptTag,
    handleRejectTag,
    handleAcceptAll,
    handleClearSuggestions,
  };
}
