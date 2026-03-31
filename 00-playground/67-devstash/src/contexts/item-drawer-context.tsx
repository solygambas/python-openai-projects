"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface ItemDrawerContextType {
  openItemDrawer: (itemId: string) => void;
  closeItemDrawer: () => void;
  currentItemId: string | null;
  isOpen: boolean;
}

const ItemDrawerContext = createContext<ItemDrawerContextType | null>(null);

export function useItemDrawer() {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}

interface ItemDrawerProviderProps {
  children: ReactNode;
}

export function ItemDrawerProvider({ children }: ItemDrawerProviderProps) {
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openItemDrawer = useCallback((itemId: string) => {
    setCurrentItemId(itemId);
    setIsOpen(true);
  }, []);

  const closeItemDrawer = useCallback(() => {
    setIsOpen(false);
    // Don't clear currentItemId immediately to allow closing animation
    setTimeout(() => {
      setCurrentItemId(null);
    }, 300);
  }, []);

  return (
    <ItemDrawerContext.Provider
      value={{
        openItemDrawer,
        closeItemDrawer,
        currentItemId,
        isOpen,
      }}
    >
      {children}
    </ItemDrawerContext.Provider>
  );
}
