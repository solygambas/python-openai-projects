"use client";

import { Tag, Folder, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface TagItem {
  id: string;
  name: string;
}

interface CollectionItem {
  collection: {
    id: string;
    name: string;
  };
}

interface ItemDrawerMetaProps {
  tags: TagItem[];
  collections: CollectionItem[];
  createdAt: string;
  updatedAt: string;
  isEditing: boolean;
  editTags: string;
  onTagsChange: (value: string) => void;
}

function formatDetailsDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function ItemDrawerTags({
  tags,
  isEditing,
  editTags,
  onTagsChange,
}: {
  tags: TagItem[];
  isEditing: boolean;
  editTags: string;
  onTagsChange: (value: string) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Tag className="h-4 w-4" />
        <p>Tags</p>
      </div>
      {isEditing ? (
        <div className="pl-6">
          <Input
            value={editTags}
            onChange={(e) => onTagsChange(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="bg-secondary/20 border-primary/20"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Separate tags with commas
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pl-6">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="font-normal lowercase"
              >
                {tag.name}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">No tags</p>
          )}
        </div>
      )}
    </section>
  );
}

export function ItemDrawerCollections({
  collections,
}: {
  collections: CollectionItem[];
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Folder className="h-4 w-4" />
        <p>Collections</p>
      </div>
      <div className="flex flex-wrap gap-2 pl-6">
        {collections.length > 0 ? (
          collections.map((entry) => (
            <Badge
              key={entry.collection.id}
              variant="outline"
              className="font-normal"
            >
              {entry.collection.name}
            </Badge>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic">No collections</p>
        )}
      </div>
    </section>
  );
}

export function ItemDrawerDetails({
  createdAt,
  updatedAt,
}: {
  createdAt: string;
  updatedAt: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Calendar className="h-4 w-4" />
        <p>Details</p>
      </div>
      <div className="space-y-2 pl-6 text-foreground text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground">Created</p>
          <p>{formatDetailsDate(createdAt)}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground">Updated</p>
          <p>{formatDetailsDate(updatedAt)}</p>
        </div>
      </div>
    </section>
  );
}

export function ItemDrawerMeta({
  tags,
  collections,
  createdAt,
  updatedAt,
  isEditing,
  editTags,
  onTagsChange,
}: ItemDrawerMetaProps) {
  return (
    <>
      <ItemDrawerTags
        tags={tags}
        isEditing={isEditing}
        editTags={editTags}
        onTagsChange={onTagsChange}
      />

      <Separator />

      <ItemDrawerCollections collections={collections} />

      <Separator />

      <ItemDrawerDetails createdAt={createdAt} updatedAt={updatedAt} />
    </>
  );
}
