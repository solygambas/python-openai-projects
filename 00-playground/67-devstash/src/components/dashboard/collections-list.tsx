"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Star,
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";

import { CollectionActionsDropdown } from "@/components/collections/collection-actions-dropdown";
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";

import {
  type Collection,
  type ItemType,
  type IconMap,
} from "@/types/dashboard";

const iconMap: IconMap = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
};

interface CollectionsListProps {
  collections: Collection[];
  itemTypes: ItemType[];
}

export function CollectionsList({
  collections,
  itemTypes,
}: CollectionsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => {
          const borderColor = collection.borderColor || "#6b7280";

          return (
            <Card
              key={collection.id}
              className="bg-card/50 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors group relative overflow-hidden"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: borderColor }}
              />
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <Link
                  href={`/collections/${collection.id}`}
                  className="space-y-1 flex-1"
                >
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                      {collection.name}
                    </CardTitle>
                    {collection.isFavorite && (
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {collection.itemCount} item
                    {collection.itemCount !== 1 ? "s" : ""}
                  </CardDescription>
                </Link>
                <CollectionActionsDropdown
                  collectionId={collection.id}
                  collectionName={collection.name}
                  onEdit={() => setEditingId(collection.id)}
                />
              </CardHeader>
              <Link href={`/collections/${collection.id}`}>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {collection.description}
                  </p>
                  <div className="flex gap-2 mt-4">
                    {collection.itemTypeIds.map((typeId) => {
                      const type = itemTypes.find((t) => t.id === typeId);
                      const Icon = iconMap[type?.icon || "File"] || File;
                      return (
                        <Icon
                          key={typeId}
                          className="h-4 w-4"
                          style={{ color: type?.color }}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Edit dialogs rendered at root level */}
      {collections.map((collection) => (
        <EditCollectionDialog
          key={collection.id}
          collectionId={collection.id}
          collectionName={collection.name}
          collectionDescription={collection.description}
          isOpen={editingId === collection.id}
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
        />
      ))}
    </>
  );
}
