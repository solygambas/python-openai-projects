"use client";

import { File, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

interface ItemDrawerContentProps {
  typeName: string;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  itemId: string;
  isEditing: boolean;
  editContent: string;
  editUrl: string;
  editLanguage: string;
  onContentChange: (value: string) => void;
  onUrlChange: (value: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isCodeType(typeName: string): boolean {
  const lower = typeName.toLowerCase();
  return lower === "snippet" || lower === "command";
}

function isMarkdownType(typeName: string): boolean {
  const lower = typeName.toLowerCase();
  return lower === "note" || lower === "prompt";
}

function isFileType(typeName: string): boolean {
  const lower = typeName.toLowerCase();
  return lower === "file" || lower === "image";
}

export function ItemDrawerContent({
  typeName,
  content,
  url,
  fileUrl,
  fileName,
  fileSize,
  language,
  itemId,
  isEditing,
  editContent,
  editUrl,
  editLanguage,
  onContentChange,
  onUrlChange,
}: ItemDrawerContentProps) {
  const typeLower = typeName.toLowerCase();

  // Editing mode
  if (isEditing) {
    if (typeLower === "link") {
      return (
        <Input
          value={editUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://example.com"
          className="bg-secondary/20 border-primary/20"
        />
      );
    }

    if (isCodeType(typeName)) {
      return (
        <CodeEditor
          value={editContent}
          onChange={onContentChange}
          language={editLanguage || "plaintext"}
          readOnly={false}
          maxHeight={400}
        />
      );
    }

    if (isMarkdownType(typeName)) {
      return (
        <MarkdownEditor
          value={editContent}
          onChange={onContentChange}
          readOnly={false}
          maxHeight={400}
        />
      );
    }

    return (
      <Textarea
        value={editContent}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Paste content here..."
        className="min-h-[200px] font-mono text-sm bg-secondary/20 border-primary/20 resize-y"
      />
    );
  }

  // View mode - File/Image display
  if (isFileType(typeName) && fileUrl) {
    if (typeLower === "image") {
      return (
        <div className="rounded-lg border bg-secondary/40 p-4">
          <div className="relative max-h-[400px] mx-auto flex justify-center">
            <Image
              src={`/api/download/${itemId}`}
              alt={fileName || "Image"}
              width={800}
              height={400}
              className="max-w-full max-h-[400px] rounded object-contain"
            />
          </div>
          {fileName && fileSize && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {fileName} ({formatFileSize(fileSize)})
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-lg border bg-secondary/40 p-4 flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
          <File className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{fileName || "Unknown file"}</p>
          {fileSize && (
            <p className="text-xs text-muted-foreground">
              {formatFileSize(fileSize)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // View mode - Link display
  if (typeLower === "link" && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-h-[280px] overflow-auto rounded-lg border bg-secondary/40 p-4 text-sm leading-relaxed break-words text-blue-400 hover:text-blue-300 underline hover:underline-offset-2"
      >
        {url}
      </a>
    );
  }

  // View mode - Code display
  if (isCodeType(typeName)) {
    return (
      <CodeEditor
        value={content || ""}
        language={language || "plaintext"}
        readOnly={true}
        maxHeight={400}
      />
    );
  }

  // View mode - Markdown display
  if (isMarkdownType(typeName)) {
    return (
      <MarkdownEditor value={content || ""} readOnly={true} maxHeight={400} />
    );
  }

  // View mode - Plain text display
  return (
    <pre className="max-h-[280px] overflow-auto rounded-lg border bg-secondary/40 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-cyan-200">
      {content || url || "No content"}
    </pre>
  );
}

// Section wrapper component
export function ItemDrawerContentSection({
  typeName,
  isEditing,
  children,
}: {
  typeName: string;
  isEditing: boolean;
  children: React.ReactNode;
}) {
  const isFile = isFileType(typeName);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {isFile ? "File" : "Content"}
        </p>
        {isEditing && typeName.toLowerCase() === "link" && (
          <div className="flex items-center gap-2">
            <LinkIcon className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase">URL</p>
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
