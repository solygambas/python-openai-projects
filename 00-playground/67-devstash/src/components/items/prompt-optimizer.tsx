"use client";

import { useState } from "react";
import {
  Sparkles,
  Crown,
  Loader2,
  Check,
  Copy,
  ClipboardCheck,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { optimizePrompt } from "@/actions/ai";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PromptOptimizerProps {
  content: string;
  title: string;
  isPro: boolean;
  maxHeight?: number;
  onAcceptOptimization?: (content: string) => void;
}

type OptimizeTab = "original" | "optimized";

export function PromptOptimizer({
  content,
  title,
  isPro,
  maxHeight = 400,
  onAcceptOptimization,
}: PromptOptimizerProps) {
  const [activeTab, setActiveTab] = useState<OptimizeTab>("original");
  const [optimizedContent, setOptimizedContent] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  // Local content mirrors prop but updates immediately on accept
  const [localContent, setLocalContent] = useState(content);

  const handleOptimize = async () => {
    if (!isPro || isOptimizing) return;

    if (optimizedContent) {
      setActiveTab("optimized");
      return;
    }

    setIsOptimizing(true);
    setActiveTab("optimized");

    try {
      const result = await optimizePrompt({ title, content: localContent });

      if (result.success && result.data) {
        setOptimizedContent(result.data.optimizedPrompt);
        if (result.remaining !== undefined && result.remaining <= 2) {
          toast.success(
            `Prompt optimized (${result.remaining} requests remaining this hour)`,
          );
        } else {
          toast.success("Prompt optimized");
        }
      } else {
        toast.error(result.error || "Failed to optimize prompt");
        setActiveTab("original");
      }
    } catch {
      toast.error("An unexpected error occurred");
      setActiveTab("original");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = async () => {
    const text =
      activeTab === "optimized" && optimizedContent
        ? optimizedContent
        : localContent;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccept = () => {
    if (!optimizedContent || !onAcceptOptimization) return;
    // Update local display immediately so the user sees the change right away
    setLocalContent(optimizedContent);
    setOptimizedContent(null);
    setActiveTab("original");
    onAcceptOptimization(optimizedContent);
  };

  const showTabs = optimizedContent !== null || isOptimizing;

  return (
    <div className="flex flex-col gap-0">
      {/* Single unified header row — mirrors code editor layout */}
      <div className="flex items-center justify-between px-3 py-2 rounded-t-lg border border-white/10 bg-secondary/40 border-b-0">
        {/* Left: macOS dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
        </div>

        {/* Right: label/tabs + actions */}
        <div className="flex items-center gap-2">
          {showTabs ? (
            <div className="flex bg-background/40 rounded-md p-0.5 border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab("original")}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-medium transition-all",
                  activeTab === "original"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("optimized")}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-medium transition-all",
                  activeTab === "optimized"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                <Sparkles className="h-3 w-3" />
                Optimized
              </button>
            </div>
          ) : (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              prompt
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center bg-black/20 rounded-md border border-white/5 overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 flex items-center gap-1.5 hover:bg-white/5 rounded-none border-r border-white/5 text-[10px] font-medium uppercase tracking-wider"
              onClick={handleOptimize}
              disabled={isOptimizing}
              title={
                isPro
                  ? "Optimize this prompt with AI"
                  : "AI features require Pro subscription"
              }
            >
              {isOptimizing ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              ) : isPro ? (
                <Sparkles
                  className={cn(
                    "h-3 w-3 text-purple-400",
                    isOptimizing && "animate-pulse",
                  )}
                />
              ) : (
                <Crown className="h-3 w-3 text-amber-500/50" />
              )}
              <span>Optimize</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 flex items-center gap-1.5 hover:bg-white/5 rounded-none border-r border-white/5 text-[10px] font-medium uppercase tracking-wider"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? (
                <ClipboardCheck className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
              <span>Copy</span>
            </Button>

            {activeTab === "optimized" &&
              optimizedContent &&
              onAcceptOptimization && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 flex items-center gap-1.5 hover:bg-white/5 rounded-none text-[10px] font-medium uppercase tracking-wider text-green-400 hover:text-green-300"
                  onClick={handleAccept}
                  title="Replace current content with optimized version"
                >
                  <Check className="h-3 w-3" />
                  <span>Use This</span>
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === "original" && (
        <MarkdownEditor
          value={localContent}
          readOnly={true}
          maxHeight={maxHeight}
          className="rounded-t-none border-t-0"
          showCopy={false}
          showHeader={false}
        />
      )}

      {activeTab === "optimized" && (
        <div
          className="rounded-b-lg border border-white/10 bg-[#1e1e1e] overflow-auto"
          style={{ maxHeight }}
        >
          {isOptimizing ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground animate-in fade-in duration-500">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <p className="text-sm font-medium">Optimizing your prompt...</p>
            </div>
          ) : optimizedContent ? (
            <div className="markdown-preview p-4 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {optimizedContent}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
