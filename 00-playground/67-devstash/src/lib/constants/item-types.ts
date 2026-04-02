import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link,
} from "lucide-react";

export const ITEM_TYPE_ICONS = {
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: Image,
  link: Link,
} as const;

export const ITEM_TYPE_COLORS = {
  snippet: "#3b82f6",
  prompt: "#f59e0b",
  command: "#06b6d4",
  note: "#22c55e",
  file: "#64748b",
  image: "#ec4899",
  link: "#6366f1",
} as const;

export const ITEM_TYPE_LABELS = {
  snippet: "Snippet",
  prompt: "Prompt",
  command: "Command",
  note: "Note",
  file: "File",
  image: "Image",
  link: "Link",
} as const;

export type ItemTypeName = keyof typeof ITEM_TYPE_COLORS;

export const PRO_COLOR = "#8b5cf6";
