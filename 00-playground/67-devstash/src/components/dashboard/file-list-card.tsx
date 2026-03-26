"use client";

import { useMemo } from "react";
import {
  File,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FileListCardProps {
  id: string;
  fileName: string;
  fileSize: number | null;
  createdAt: Date;
  onClick?: () => void;
  onDownload?: () => void;
}

// Map file extensions to icons
const FILE_ICON_MAP: Record<string, typeof File> = {
  // Documents
  pdf: FileText,
  txt: FileText,
  md: FileText,
  doc: FileText,
  docx: FileText,
  // Code
  json: FileCode,
  js: FileCode,
  ts: FileCode,
  tsx: FileCode,
  jsx: FileCode,
  py: FileCode,
  yaml: FileCode,
  yml: FileCode,
  xml: FileCode,
  html: FileCode,
  css: FileCode,
  // Data
  csv: FileSpreadsheet,
  // Archives
  zip: FileArchive,
  gz: FileArchive,
  tar: FileArchive,
  rar: FileArchive,
};

function getFileIcon(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return FILE_ICON_MAP[extension] || File;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileListCard({
  fileName,
  fileSize,
  createdAt,
  onClick,
  onDownload,
}: FileListCardProps) {
  const Icon = useMemo(() => getFileIcon(fileName), [fileName]);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group border border-transparent hover:border-border/50"
    >
      {/* File Icon */}
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

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
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
