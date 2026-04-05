"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useItemDrawer } from "@/contexts/item-drawer-context";
import { ICON_MAP } from "@/lib/constants/item-types";

interface SearchItem {
  id: string;
  title: string;
  content: string | null;
  type: "item";
  itemType: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
  type: "collection";
}

type SearchResult = SearchItem | SearchCollection;

interface SearchCommandProps {
  items: SearchItem[];
  collections: SearchCollection[];
}

export function SearchCommand({ items, collections }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { openItemDrawer } = useItemDrawer();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Listen for custom event from SearchProvider
  useEffect(() => {
    const handleOpenSearch = () => setOpen(true);
    window.addEventListener("open-search", handleOpenSearch);
    return () => window.removeEventListener("open-search", handleOpenSearch);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);

      if (result.type === "item") {
        // Open the global item drawer
        openItemDrawer(result.id);
      } else {
        router.push(`/collections/${result.id}`);
      }
    },
    [router, openItemDrawer],
  );

  // Build searchable string for items (title + type + content preview)
  const getItemSearchValue = (item: SearchItem): string => {
    const contentPreview = item.content?.slice(0, 100) || "";
    return `${item.title} ${item.itemType.name} ${contentPreview}`;
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search items and collections"
    >
      <Command
        className="bg-transparent"
        filter={(value, search) => {
          // Custom filter for fuzzy matching
          const lowerValue = value.toLowerCase();
          const lowerSearch = search.toLowerCase();

          // Check if search term appears as substring (fuzzy match)
          let searchIndex = 0;
          for (
            let i = 0;
            i < lowerValue.length && searchIndex < lowerSearch.length;
            i++
          ) {
            if (lowerValue[i] === lowerSearch[searchIndex]) {
              searchIndex++;
            }
          }

          if (searchIndex === lowerSearch.length) return 1;

          // Also check for substring match
          if (lowerValue.includes(lowerSearch)) return 1;

          return 0;
        }}
      >
        <CommandInput placeholder="Search items and collections..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Items">
            {items.slice(0, 10).map((item) => {
              const IconComponent = ICON_MAP[item.itemType.icon];
              return (
                <CommandItem
                  key={item.id}
                  value={getItemSearchValue(item)}
                  onSelect={() => handleSelect(item)}
                >
                  {IconComponent && (
                    <IconComponent
                      className="h-4 w-4 mr-2"
                      style={{ color: item.itemType.color }}
                    />
                  )}
                  <span className="truncate">{item.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {item.itemType.name}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Collections">
            {collections.slice(0, 5).map((collection) => (
              <CommandItem
                key={collection.id}
                value={`${collection.name} collection`}
                onSelect={() => handleSelect(collection)}
              >
                <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="truncate">{collection.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {collection.itemCount} item
                  {collection.itemCount !== 1 ? "s" : ""}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
