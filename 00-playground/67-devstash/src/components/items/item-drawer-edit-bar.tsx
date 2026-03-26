"use client";

import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ItemDrawerEditBarProps {
  isSaving: boolean;
  hasTitle: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function ItemDrawerEditBar({
  isSaving,
  hasTitle,
  onSave,
  onCancel,
}: ItemDrawerEditBarProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <Button
        size="sm"
        className="flex-1"
        onClick={onSave}
        disabled={isSaving || !hasTitle}
      >
        {isSaving ? "Saving..." : "Save"}
        {!isSaving && <Save className="ml-2 h-4 w-4" />}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={onCancel}
        disabled={isSaving}
      >
        Cancel
        <X className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
