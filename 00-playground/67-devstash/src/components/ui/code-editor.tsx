"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
}

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  readOnly = true,
  className,
  minHeight = 100,
  maxHeight = 600,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editorHeight, setEditorHeight] = useState(minHeight);
  const editorRef = useRef<MonacoEditor | null>(null);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
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
      className={`relative flex flex-col rounded-lg border border-white/10 overflow-hidden bg-[#1e1e1e] ${className ?? ""}`}
    >
      {/* macOS-style window header */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/40 border-b border-white/5 z-10">
        {/* Window dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
        </div>

        {/* Language badge and copy button */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            {language}
          </span>
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
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
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
          onMount={handleEditorDidMount}
          theme="vs-dark"
          loading={<div />}
          options={{
            readOnly,
            minimap: { enabled: false },
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
            fontSize: 13,
            fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
            wordWrap: "on",
            automaticLayout: true,
            fixedOverflowWidgets: true,
          }}
        />
      </div>
    </div>
  );
}
