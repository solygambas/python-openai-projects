"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { ItemTypeSelector, ItemContentEditor } from "@/components/items";
import { createItem } from "@/actions/items";

interface ItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
}

interface CreateItemDialogProps {
  itemTypes: ItemType[];
  defaultTypeId?: string;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateItemDialog({
  itemTypes,
  defaultTypeId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateItemDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [isPending, startTransition] = useTransition();

  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState<string>(
    defaultTypeId || "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState("");

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const selectedType = itemTypes.find((t) => t.id === selectedTypeId);
  const typeName = selectedType?.name?.toLowerCase() || "";

  const showContentField = ["snippet", "prompt", "command", "note"].includes(
    typeName,
  );
  const showUrlField = typeName === "link";
  const showLanguageField = typeName === "snippet" || typeName === "command";
  const showFileUpload = typeName === "file" || typeName === "image";

  const resetForm = () => {
    setSelectedTypeId(defaultTypeId || "");
    setTitle("");
    setDescription("");
    setContent("");
    setUrl("");
    setLanguage("");
    setTags("");
    setUploadedFile(null);
    setIsUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTypeId) {
      toast.error("Please select a type");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (showUrlField && !url.trim()) {
      toast.error("URL is required for links");
      return;
    }

    if (showFileUpload && !uploadedFile) {
      toast.error("Please upload a file");
      return;
    }

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    startTransition(async () => {
      const result = await createItem({
        title: title.trim(),
        description: description.trim() || null,
        content: showContentField ? content : null,
        url: showUrlField ? url.trim() : null,
        language: showLanguageField ? language.trim() : null,
        tags: tagsArray,
        typeId: selectedTypeId,
        fileUrl: showFileUpload && uploadedFile ? uploadedFile.fileUrl : null,
        fileName: showFileUpload && uploadedFile ? uploadedFile.fileName : null,
        fileSize: showFileUpload && uploadedFile ? uploadedFile.fileSize : null,
      });

      if (result.success) {
        toast.success("Item created successfully");
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create item");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    resetForm();
  };

  const handleFileUploadComplete = (data: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
  }) => {
    setUploadedFile(data);
    setIsUploading(false);
  };

  const handleFileUploadError = (error: string) => {
    toast.error(error);
    setUploadedFile(null);
    setIsUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger || (
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg" key={defaultTypeId}>
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
          <DialogDescription>
            Add a new snippet, prompt, command, note, file, image, or link to
            your collection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <ItemTypeSelector
            types={itemTypes}
            selectedTypeId={selectedTypeId}
            onSelect={(typeId) => {
              setSelectedTypeId(typeId);
              setUploadedFile(null);
            }}
          />

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Content (for text types) */}
          {showContentField && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <ItemContentEditor
                typeName={typeName}
                value={content}
                onChange={setContent}
                language={language || "plaintext"}
              />
            </div>
          )}

          {/* URL (for link type) */}
          {showUrlField && (
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
          )}

          {/* File Upload (for file/image types) */}
          {showFileUpload && (
            <div className="space-y-2">
              <Label>File</Label>
              <FileUpload
                type={typeName as "file" | "image"}
                onUploadComplete={handleFileUploadComplete}
                onUploadError={handleFileUploadError}
                disabled={isPending}
              />
            </div>
          )}

          {/* Language (for snippet/command types) */}
          {showLanguageField && (
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. typescript, python, bash"
                className="lowercase"
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedTypeId || isUploading}
            >
              {isPending ? "Creating..." : "Create Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
