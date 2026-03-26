"use client";

import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

// Types that use text content field
const textContentTypes = ["snippet", "prompt", "command", "note"];
// Types that require language field
const languageTypes = ["snippet", "command"];
// Types that use MarkdownEditor
const markdownTypes = ["note", "prompt"];

export function isCodeType(typeName: string): boolean {
  return languageTypes.includes(typeName.toLowerCase());
}

export function isMarkdownType(typeName: string): boolean {
  return markdownTypes.includes(typeName.toLowerCase());
}

interface ItemContentEditorProps {
  typeName: string;
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  maxHeight?: number;
  readOnly?: boolean;
}

export function ItemContentEditor({
  typeName,
  value,
  onChange,
  language = "plaintext",
  placeholder = "Paste your content here...",
  maxHeight = 200,
  readOnly = false,
}: ItemContentEditorProps) {
  const typeLower = typeName.toLowerCase();

  if (isCodeType(typeLower)) {
    return (
      <CodeEditor
        value={value}
        onChange={onChange}
        language={language}
        readOnly={readOnly}
        maxHeight={maxHeight}
        className="bg-secondary/20 border-primary/20"
      />
    );
  }

  if (isMarkdownType(typeLower)) {
    return (
      <MarkdownEditor
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        maxHeight={maxHeight}
      />
    );
  }

  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="font-mono text-sm resize-y min-h-[120px]"
    />
  );
}

// Re-export the type check constants for use elsewhere
export { textContentTypes, languageTypes, markdownTypes };
