"use client";

import {
  File,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Download,
  Pin,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FileListCardProps {
  id: string;
  fileName: string;
  fileSize: number | null;
  createdAt: Date;
  isPinned?: boolean;
  onClick?: () => void;
  onDownload?: () => void;
}

// Map file extensions to icon names
const FILE_ICON_MAP: Record<
  string,
  "file" | "fileText" | "fileCode" | "fileSpreadsheet" | "fileArchive"
> = {
  // Documents
  pdf: "fileText",
  txt: "fileText",
  md: "fileText",
  doc: "fileText",
  docx: "fileText",
  // Code
  json: "fileCode",
  js: "fileCode",
  ts: "fileCode",
  tsx: "fileCode",
  jsx: "fileCode",
  py: "fileCode",
  yaml: "fileCode",
  yml: "fileCode",
  xml: "fileCode",
  html: "fileCode",
  css: "fileCode",
  // Data
  csv: "fileSpreadsheet",
  // Archives
  zip: "fileArchive",
  gz: "fileArchive",
  tar: "fileArchive",
  rar: "fileArchive",
};

function getFileIconName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return FILE_ICON_MAP[extension] || "file";
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function FileIcon({ iconName }: { iconName: string }) {
  switch (iconName) {
    case "fileText":
      return <FileText className="h-5 w-5 text-muted-foreground" />;
    case "fileCode":
      return <FileCode className="h-5 w-5 text-muted-foreground" />;
    case "fileSpreadsheet":
      return <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />;
    case "fileArchive":
      return <FileArchive className="h-5 w-5 text-muted-foreground" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
}

export function FileListCard({
  fileName,
  fileSize,
  createdAt,
  isPinned = false,
  onClick,
  onDownload,
}: FileListCardProps) {
  const iconName = getFileIconName(fileName);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group border border-transparent hover:border-border/50"
    >
      {/* File Icon */}
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <FileIcon iconName={iconName} />
      </div>

      {/* Pin icon for pinned items */}
      {isPinned && <Pin className="h-4 w-4 text-blue-500 rotate-45 shrink-0" />}

      {/* File Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <p className="text-xs text-muted-foreground md:hidden">
          {formatFileSize(fileSize)} • {formatDate(createdAt)}
        </p>
      </div>

      {/* Desktop: Size & Date */}
      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <span className="w-20 text-right">{formatFileSize(fileSize)}</span>
        <span className="w-28 text-right">{formatDate(createdAt)}</span>
      </div>

      {/* Download Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDownload?.();
        }}
        className="h-8 w-8 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity shrink-0"
        aria-label="Download file"
      >
        <Download className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
