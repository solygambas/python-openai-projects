"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { SearchCommand } from "./search-command";

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

interface SearchContextType {
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

interface SearchProviderProps {
  children: React.ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [items, setItems] = useState<SearchItem[]>([]);
  const [collections, setCollections] = useState<SearchCollection[]>([]);
  const [isReady, setIsReady] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetch("/api/search")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setItems(
            data.items.map((item: SearchItem) => ({
              ...item,
              type: "item" as const,
            })),
          );
        }
        if (data.collections) {
          setCollections(
            data.collections.map((collection: SearchCollection) => ({
              ...collection,
              type: "collection" as const,
            })),
          );
        }
        setIsReady(true);
      })
      .catch((err) => {
        console.error("Failed to fetch search data:", err);
      });
  }, []);

  const openSearch = useCallback(() => {
    // Dispatch custom event that SearchCommand listens to
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-search"));
    }
  }, []);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      {isReady && <SearchCommand items={items} collections={collections} />}
    </SearchContext.Provider>
  );
}
