"use client";

import { useState, useRef, useEffect, useCallback, useContext } from "react";
import { Copy, Check, Loader2, Sparkles, Crown, Code } from "lucide-react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EditorPreferencesContext } from "@/contexts/editor-preferences-context";
import { DEFAULT_EDITOR_PREFERENCES } from "@/types/editor-preferences";
import { explainCode } from "@/actions/ai";
import { cn } from "@/lib/utils";

const handleBeforeMount: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("monokai", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "75715e", fontStyle: "italic" },
      { token: "keyword", foreground: "f92672" },
      { token: "string", foreground: "e6db74" },
      { token: "number", foreground: "ae81ff" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "class", foreground: "a6e22e" },
      { token: "function", foreground: "a6e22e" },
      { token: "variable", foreground: "f8f8f2" },
      { token: "operator", foreground: "f92672" },
      { token: "delimiter", foreground: "f8f8f2" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editorLineNumber.foreground": "#75715e",
      "editorCursor.foreground": "#f8f8f0",
      "editor.selectionBackground": "#49483e",
      "editor.inactiveSelectionBackground": "#3e3d32",
      "editorIndentGuide.background1": "#3b3a32",
    },
  });

  monaco.editor.defineTheme("github-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8b949e", fontStyle: "italic" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "string", foreground: "a5d6ff" },
      { token: "number", foreground: "79c0ff" },
      { token: "type", foreground: "ffa657" },
      { token: "class", foreground: "d2a8ff" },
      { token: "function", foreground: "d2a8ff" },
      { token: "variable", foreground: "c9d1d9" },
      { token: "operator", foreground: "ff7b72" },
      { token: "delimiter", foreground: "c9d1d9" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#c9d1d9",
      "editorLineNumber.foreground": "#6e7681",
      "editorCursor.foreground": "#c9d1d9",
      "editor.selectionBackground": "#264f78",
      "editor.inactiveSelectionBackground": "#1f2937",
      "editorIndentGuide.background1": "#21262d",
    },
  });
};

// Use a simplified interface for the editor instance
interface MonacoEditor {
  getContentHeight: () => number;
  layout: () => void;
  onDidContentSizeChange: (callback: () => void) => void;
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  // AI Explain props
  showAIExplain?: boolean;
  isPro?: boolean;
  itemTitle?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  readOnly = true,
  className,
  minHeight = 100,
  maxHeight = 600,
  showAIExplain = false,
  isPro = false,
  itemTitle = "Untitled",
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editorHeight, setEditorHeight] = useState(minHeight);
  const [activeTab, setActiveTab] = useState<"code" | "explain">("code");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const editorRef = useRef<MonacoEditor | null>(null);

  const prefsCtx = useContext(EditorPreferencesContext);
  const prefs = prefsCtx?.preferences ?? DEFAULT_EDITOR_PREFERENCES;

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(
      activeTab === "code" ? value : explanation || "",
    );
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplain = async () => {
    if (!isPro) return;
    if (isExplaining) return;

    if (explanation) {
      setActiveTab("explain");
      return;
    }

    setIsExplaining(true);
    setActiveTab("explain");

    try {
      const result = await explainCode({
        title: itemTitle,
        content: value,
        language,
      });

      if (result.success) {
        setExplanation(result.data.explanation);
      } else {
        toast.error(result.error);
        setActiveTab("code");
      }
    } catch {
      toast.error("An unexpected error occurred");
      setActiveTab("code");
    } finally {
      setIsExplaining(false);
    }
  };

  const updateHeight = useCallback(() => {
    if (editorRef.current) {
      const contentHeight = Math.min(
        maxHeight,
        Math.max(minHeight, editorRef.current.getContentHeight()),
      );
      setEditorHeight(contentHeight);
      editorRef.current.layout();
    }
  }, [minHeight, maxHeight]);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor as unknown as MonacoEditor;
    setIsLoaded(true);

    // Initial height adjustment
    updateHeight();

    // Listen for content changes to adjust height
    editorRef.current.onDidContentSizeChange(() => {
      updateHeight();
    });
  };

  // Adjust height when value changes externally
  useEffect(() => {
    if (isLoaded) {
      updateHeight();
    }
  }, [value, isLoaded, updateHeight]);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg border border-white/10 overflow-hidden bg-[#1e1e1e]",
        className,
      )}
    >
      {/* macOS-style window header */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/40 border-b border-white/5 z-10">
        {/* Window dots / Tabs */}
        <div className="flex items-center gap-1.5 font-sans">
          {explanation || isExplaining ? (
            <div className="flex bg-background/40 rounded-md p-0.5 border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-medium transition-all",
                  activeTab === "code"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                <Code className="h-3 w-3" />
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("explain")}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-medium transition-all",
                  activeTab === "explain"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                <Sparkles className="h-3 w-3" />
                Explain
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {activeTab === "code" && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              {language}
            </span>
          )}

          <div className="flex items-center bg-black/20 rounded-md border border-white/5 overflow-hidden">
            {showAIExplain && activeTab === "code" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 flex items-center gap-1.5 hover:bg-white/5 rounded-none border-r border-white/5 text-[10px] font-medium uppercase tracking-wider"
                onClick={handleExplain}
                disabled={isExplaining}
                title={
                  isPro
                    ? "Explain with AI"
                    : "AI features require Pro subscription"
                }
              >
                {isPro ? (
                  <Sparkles
                    className={cn(
                      "h-3 w-3 text-purple-400",
                      isExplaining && "animate-pulse",
                    )}
                  />
                ) : (
                  <Crown className="h-3 w-3 text-amber-500/50" />
                )}
                <span>Explain</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 flex items-center gap-1.5 hover:bg-white/5 rounded-none text-[10px] font-medium uppercase tracking-wider"
              onClick={handleCopy}
              disabled={!value && activeTab === "code"}
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
              <span>Copy</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 bg-[#1e1e1e]">
        {activeTab === "code" ? (
          <>
            {!isLoaded && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-20"
                style={{ height: minHeight }}
              >
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <Editor
              height={editorHeight}
              defaultLanguage={language}
              language={language}
              value={value}
              onChange={(v) => onChange?.(v ?? "")}
              beforeMount={handleBeforeMount}
              onMount={handleEditorDidMount}
              theme={prefs.theme}
              loading={<div />}
              options={{
                readOnly,
                minimap: { enabled: prefs.minimap },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderLineHighlight: "none",
                scrollbar: {
                  vertical: "auto",
                  horizontal: "auto",
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                  alwaysConsumeMouseWheel: false,
                },
                padding: { top: 12, bottom: 12 },
                fontSize: prefs.fontSize,
                tabSize: prefs.tabSize,
                fontFamily:
                  "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
                wordWrap: prefs.wordWrap ? "on" : "off",
                automaticLayout: true,
                fixedOverflowWidgets: true,
              }}
            />
          </>
        ) : (
          <div
            className="p-6 prose-invert max-w-none overflow-y-auto scrollbar-thin"
            style={{ height: editorHeight, minHeight }}
          >
            {isExplaining ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground animate-in fade-in duration-500">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <p className="text-sm font-medium">Generating explanation...</p>
              </div>
            ) : explanation ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 markdown-preview p-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {explanation}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
