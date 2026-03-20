"use client";

import React, { createContext, useContext, useState } from "react";

import type { User, ItemType, Collection } from "@prisma/client";

interface CollectionWithStats extends Collection {
  itemCount: number;
  borderColor?: string;
  itemTypeIds: string[];
}

interface SidebarData {
  user: User;
  itemTypes: ItemType[];
  itemTypeCounts: Record<string, number>;
  favoriteCollections: CollectionWithStats[];
  recentCollections: CollectionWithStats[];
}

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
  sidebarData?: SidebarData;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ 
  children,
  sidebarData
}: { 
  children: React.ReactNode;
  sidebarData?: SidebarData;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider 
      value={{ 
        isCollapsed, 
        setIsCollapsed, 
        isMobileOpen, 
        setIsMobileOpen,
        sidebarData
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
