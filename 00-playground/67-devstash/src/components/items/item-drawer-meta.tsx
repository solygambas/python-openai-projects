"use client";

import { Tag, Folder, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/ui/multi-select";
import { SuggestTagsTrigger, TagSuggestionsList } from "./suggest-tags-button";
import { useSuggestTags } from "@/hooks/use-suggest-tags";

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

interface CollectionOption {
  id: string;
  name: string;
}

interface ItemDrawerMetaProps {
  tags: TagItem[];
  collections: CollectionItem[];
  createdAt: string;
  updatedAt: string;
  isEditing: boolean;
  editTags: string;
  onTagsChange: (value: string) => void;
  // Collection editing
  allCollections?: CollectionOption[];
  editCollectionIds?: string[];
  onCollectionIdsChange?: (ids: string[]) => void;
  // AI tag suggestions (Pro only)
  isPro?: boolean;
  itemTitle?: string;
  itemContent?: string;
  itemDescription?: string;
  itemTypeName?: string;
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
  isPro,
  itemTitle,
  itemContent,
  itemDescription,
  itemTypeName,
}: {
  tags: TagItem[];
  isEditing: boolean;
  editTags: string;
  onTagsChange: (value: string) => void;
  isPro?: boolean;
  itemTitle?: string;
  itemContent?: string;
  itemDescription?: string;
  itemTypeName?: string;
}) {
  const showSuggestButton =
    isEditing &&
    isPro &&
    itemTitle &&
    itemContent &&
    ["snippet", "prompt", "command", "note"].includes(itemTypeName || "");

  const {
    isPending: isTagsPending,
    suggestedTags,
    showSuggestions,
    handleSuggestTags,
    handleAcceptTag,
    handleRejectTag,
    handleAcceptAll: handleAcceptAllTags,
    handleClearSuggestions,
  } = useSuggestTags({
    title: itemTitle || "",
    content: itemContent || "",
    description: itemDescription,
    currentTags: editTags,
    onTagsChange: onTagsChange,
  });

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-muted-foreground text-sm">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <p>Tags</p>
        </div>
        {showSuggestButton && (
          <SuggestTagsTrigger
            onSuggest={handleSuggestTags}
            isPending={isTagsPending}
          />
        )}
      </div>
      {isEditing ? (
        <div className="pl-6 space-y-2">
          <Input
            value={editTags}
            onChange={(e) => onTagsChange(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="bg-secondary/20 border-primary/20"
          />
          {showSuggestions && (
            <TagSuggestionsList
              tags={suggestedTags}
              onAccept={handleAcceptTag}
              onReject={handleRejectTag}
              onAcceptAll={handleAcceptAllTags}
              onClear={handleClearSuggestions}
            />
          )}
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
  isEditing,
  allCollections,
  editCollectionIds,
  onCollectionIdsChange,
}: {
  collections: CollectionItem[];
  isEditing?: boolean;
  allCollections?: CollectionOption[];
  editCollectionIds?: string[];
  onCollectionIdsChange?: (ids: string[]) => void;
}) {
  if (isEditing && allCollections && onCollectionIdsChange) {
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Folder className="h-4 w-4" />
          <p>Collections</p>
        </div>
        <div className="pl-6">
          <MultiSelect
            options={allCollections}
            selected={editCollectionIds || []}
            onChange={onCollectionIdsChange}
            placeholder="Select collections..."
            emptyMessage="No collections found."
          />
        </div>
      </section>
    );
  }

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
  allCollections,
  editCollectionIds,
  onCollectionIdsChange,
  isPro,
  itemTitle,
  itemContent,
  itemDescription,
  itemTypeName,
}: ItemDrawerMetaProps) {
  return (
    <>
      <ItemDrawerTags
        tags={tags}
        isEditing={isEditing}
        editTags={editTags}
        onTagsChange={onTagsChange}
        isPro={isPro}
        itemTitle={itemTitle}
        itemContent={itemContent}
        itemDescription={itemDescription}
        itemTypeName={itemTypeName}
      />

      <Separator />

      <ItemDrawerCollections
        collections={collections}
        isEditing={isEditing}
        allCollections={allCollections}
        editCollectionIds={editCollectionIds}
        onCollectionIdsChange={onCollectionIdsChange}
      />

      <Separator />

      <ItemDrawerDetails createdAt={createdAt} updatedAt={updatedAt} />
    </>
  );
}
