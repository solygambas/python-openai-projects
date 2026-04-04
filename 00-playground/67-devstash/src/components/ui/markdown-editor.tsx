"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  debounceMs?: number;
  showCopy?: boolean;
  showHeader?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = true,
  className,
  minHeight = 100,
  maxHeight = 400,
  debounceMs = 150,
  showCopy = true,
  showHeader = true,
}: MarkdownEditorProps) {
  const [copied, setCopied] = useState(false);
  // In readonly mode, always show preview. In edit mode, default to write.
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  // Local state for immediate UI updates (debounced to parent)
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Debounced onChange handler
  useEffect(() => {
    if (!onChange || localValue === value) return;

    const timeoutId = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [localValue, onChange, debounceMs, value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
  };

  // In readonly mode, only show preview tab
  const showTabs = !readOnly;

  // Determine what to display: in readonly mode always show preview
  const effectiveTab = readOnly ? "preview" : activeTab;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border border-white/10 overflow-hidden bg-[#1e1e1e]",
        className,
      )}
    >
      {/* macOS-style window header */}
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 bg-secondary/40 border-b border-white/5 z-10">
          {/* Window dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
          </div>

          {/* Tabs and copy button */}
          <div className="flex items-center gap-2">
            {showTabs && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors",
                    effectiveTab === "write"
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  <Pencil className="h-3 w-3" />
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors",
                    effectiveTab === "preview"
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
              </div>
            )}
            {showCopy && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
                disabled={!value}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content area */}
      <div
        className="relative flex-1 min-h-0 overflow-auto"
        style={{ minHeight, maxHeight }}
      >
        {effectiveTab === "write" ? (
          <Textarea
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your markdown here..."
            className="h-full min-h-[inherit] max-h-[inherit] bg-transparent border-0 rounded-none resize-none p-4 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        ) : (
          <div className="markdown-preview p-4 text-sm leading-relaxed">
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">No content</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
