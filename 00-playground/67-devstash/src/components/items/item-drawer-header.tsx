"use client";

import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SheetTitle } from "@/components/ui/sheet";
import type { IconMap } from "@/types/dashboard";

const iconMap: IconMap = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

interface ItemDrawerHeaderProps {
  icon: string;
  color: string;
  typeName: string;
  title: string;
  language?: string | null;
  isEditing: boolean;
  editTitle: string;
  editLanguage: string;
  onTitleChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
}

export function ItemDrawerHeader({
  icon,
  color,
  typeName,
  title,
  language,
  isEditing,
  editTitle,
  editLanguage,
  onTitleChange,
  onLanguageChange,
}: ItemDrawerHeaderProps) {
  const Icon = iconMap[icon] || File;
  const isCodeType =
    typeName.toLowerCase() === "snippet" ||
    typeName.toLowerCase() === "command";

  return (
    <div className="flex items-start gap-3 pr-8">
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="space-y-1 min-w-0 flex-1">
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Item title"
            className="h-8 text-lg font-semibold px-2 -ml-2 bg-background border-primary/20 focus-visible:ring-primary/30"
            autoFocus
          />
        ) : (
          <SheetTitle className="text-xl leading-snug truncate">
            {title}
          </SheetTitle>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {typeName}
          </Badge>
          {!isEditing && language && (
            <Badge variant="outline" className="font-normal lowercase">
              {language}
            </Badge>
          )}
          {isEditing && isCodeType && (
            <Input
              value={editLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              placeholder="Language (e.g. typescript)"
              className="h-6 text-[10px] w-32 px-1.5 bg-background border-primary/20"
            />
          )}
        </div>
      </div>
    </div>
  );
}
