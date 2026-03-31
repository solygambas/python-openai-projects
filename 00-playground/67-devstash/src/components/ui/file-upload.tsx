"use client";

import { useCallback, useRef, useState } from "react";
import { X, File, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  type: "file" | "image";
  onUploadComplete: (data: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
  }) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

// File constraints for display
const FILE_LIMITS = {
  image: {
    maxSize: "5 MB",
    extensions: ".png, .jpg, .jpeg, .gif, .webp, .svg",
  },
  file: {
    maxSize: "10 MB",
    extensions: ".pdf, .txt, .md, .json, .yaml, .yml, .xml, .csv, .toml, .ini",
  },
};

export function FileUpload({
  type,
  onUploadComplete,
  onUploadError,
  className,
  disabled,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const limits = FILE_LIMITS[type];

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed");
      }

      onUploadComplete({
        fileUrl: result.data.fileUrl,
        fileName: result.data.fileName,
        fileSize: result.data.fileSize,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(message);
      clearFile();
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        handleFileSelect(file);
      }
    },
    [disabled],
  );

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Create preview for images
    if (type === "image" && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Start upload
    uploadFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [previewUrl]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging && !disabled && "border-primary bg-primary/5",
          !isDragging && "border-border",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={limits.extensions.split(", ").join(",")}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {type === "image" ? (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          ) : (
            <File className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isUploading
                ? "Uploading..."
                : "Drop file here or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {limits.maxSize} • {limits.extensions}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && !isUploading && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center">
              <File className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
