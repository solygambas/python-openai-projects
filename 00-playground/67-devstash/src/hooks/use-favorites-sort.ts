"use client";

import { useState, useCallback, useEffect } from "react";

export type ItemSortKey =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "type";
export type CollectionSortKey = "newest" | "oldest" | "name-asc" | "name-desc";

interface FavoritesSortPreference {
  items: ItemSortKey;
  collections: CollectionSortKey;
}

const STORAGE_KEY = "favorites-sort-preference";

const DEFAULT_PREFERENCE: FavoritesSortPreference = {
  items: "newest",
  collections: "newest",
};

const TYPE_ORDER: Record<string, number> = {
  snippet: 0,
  prompt: 1,
  command: 2,
  note: 3,
  link: 4,
  image: 5,
  file: 6,
};

const VALID_ITEM_KEYS = new Set<ItemSortKey>([
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
  "type",
]);
const VALID_COLLECTION_KEYS = new Set<CollectionSortKey>([
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
]);

function loadPreference(): FavoritesSortPreference | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FavoritesSortPreference>;
    const items =
      parsed.items && VALID_ITEM_KEYS.has(parsed.items)
        ? parsed.items
        : DEFAULT_PREFERENCE.items;
    const collections =
      parsed.collections && VALID_COLLECTION_KEYS.has(parsed.collections)
        ? parsed.collections
        : DEFAULT_PREFERENCE.collections;
    return { items, collections };
  } catch {
    return null;
  }
}

function savePreference(pref: FavoritesSortPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
  } catch {
    // localStorage may be unavailable (e.g. private browsing quota)
  }
}

export interface FavoriteItem {
  id: string;
  title: string;
  itemType: { name: string; icon: string; color: string };
  updatedAt: Date;
}

export interface FavoriteCollection {
  id: string;
  name: string;
  updatedAt: Date;
  _count: { items: number };
}

export function sortItems(
  items: FavoriteItem[],
  key: ItemSortKey,
): FavoriteItem[] {
  const copy = [...items];
  switch (key) {
    case "newest":
      return copy.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    case "oldest":
      return copy.sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
    case "name-asc":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "name-desc":
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    case "type":
      return copy.sort((a, b) => {
        const orderA = TYPE_ORDER[a.itemType.name] ?? 99;
        const orderB = TYPE_ORDER[b.itemType.name] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.title.localeCompare(b.title);
      });
  }
}

export function sortCollections(
  collections: FavoriteCollection[],
  key: CollectionSortKey,
): FavoriteCollection[] {
  const copy = [...collections];
  switch (key) {
    case "newest":
      return copy.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    case "oldest":
      return copy.sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
  }
}

export function useFavoritesSort() {
  const [preference, setPreference] =
    useState<FavoritesSortPreference>(DEFAULT_PREFERENCE);
  const [mounted, setMounted] = useState(false);

  // Load preference from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = loadPreference();
    if (stored) {
      setPreference(stored);
    }
    setMounted(true);
  }, []);

  const setItemSort = useCallback((key: ItemSortKey) => {
    setPreference((prev) => {
      const next = { ...prev, items: key };
      savePreference(next);
      return next;
    });
  }, []);

  const setCollectionSort = useCallback((key: CollectionSortKey) => {
    setPreference((prev) => {
      const next = { ...prev, collections: key };
      savePreference(next);
      return next;
    });
  }, []);

  return {
    itemSort: preference.items,
    collectionSort: preference.collections,
    setItemSort,
    setCollectionSort,
    mounted,
  };
}
