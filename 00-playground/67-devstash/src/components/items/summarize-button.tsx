"use client";

import { useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { summarizeContent } from "@/actions/ai";
import { toast } from "sonner";

interface SummarizeButtonProps {
  title: string;
  content: string;
  onSummaryGenerated: (summary: string) => void;
  isPro: boolean;
  disabled?: boolean;
}

export function SummarizeButton({
  title,
  content,
  onSummaryGenerated,
  isPro,
  disabled,
}: SummarizeButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSummarize = () => {
    if (!title.trim()) {
      toast.error("Please enter a title first");
      return;
    }

    startTransition(async () => {
      const result = await summarizeContent({
        title: title.trim(),
        content: content.trim() || "No content provided.",
      });

      if (result.success) {
        onSummaryGenerated(result.data.summary);

        if (result.remaining <= 2) {
          toast.success(
            `Summary generated (${result.remaining} requests remaining this hour)`,
          );
        } else {
          toast.success("Summary generated");
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  if (!isPro) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSummarize}
      disabled={disabled || isPending || !title.trim()}
      className="h-7 gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      Describe
    </Button>
  );
}
