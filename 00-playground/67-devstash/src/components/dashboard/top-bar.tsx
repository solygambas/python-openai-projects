"use client";

import {
  Search,
  Sparkles,
  PanelLeft,
  Menu,
  Star,
  Plus,
  FolderPlus,
  FilePlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { CreateItemDialog } from "@/components/dashboard/create-item-dialog";
import { CreateCollectionDialog } from "@/components/dashboard/create-collection-dialog";
import { useSidebar } from "./sidebar-provider";
import { useSearch } from "@/components/search/search-provider";

export function DashboardTopBar() {
  const {
    isCollapsed,
    setIsCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    sidebarData,
  } = useSidebar();
  const { openSearch } = useSearch();
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4">
      {/* Mobile Menu Trigger */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden" />}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 pt-12">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>
              Access your items, collections and account settings.
            </SheetDescription>
          </SheetHeader>
          {sidebarData && (
            <DashboardSidebar
              className="border-none bg-background w-full"
              user={sidebarData.user}
              itemTypes={sidebarData.itemTypes}
              itemTypeCounts={sidebarData.itemTypeCounts}
              favoriteCollections={sidebarData.favoriteCollections}
              recentCollections={sidebarData.recentCollections}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex h-9 w-9 text-muted-foreground"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-bold text-lg mr-4 hover:opacity-80 transition-opacity"
      >
        <div className="bg-primary/10 text-primary p-1 rounded-md">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="hidden lg:inline-block">DevStash</span>
      </Link>

      {/* Search - Desktop */}
      <button
        type="button"
        onClick={openSearch}
        className="hidden md:flex relative items-center h-10 flex-1 max-w-[500px] px-3 rounded-md bg-muted/30 text-muted-foreground text-sm cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <Search className="h-4 w-4 mr-2 text-muted-foreground/50" />
        <span className="flex-1 text-left">Search items...</span>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-background text-[10px] font-medium text-muted-foreground/50">
          <span className="text-xs">⌘</span>
          <span>K</span>
        </div>
      </button>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Search - Mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 text-muted-foreground"
          onClick={() => openSearch()}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search items</span>
        </Button>

        {/* Favorites */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
          onClick={() => (window.location.href = "/favorites")}
        >
          <Star className="h-5 w-5" />
          <span className="sr-only">Favorites</span>
        </Button>

        {/* New Collection - Desktop only */}
        <div className="hidden md:block">
          <CreateCollectionDialog />
        </div>

        {/* New Item - Desktop only */}
        {sidebarData && (
          <div className="hidden md:block">
            <CreateItemDialog itemTypes={sidebarData.itemTypes} />
          </div>
        )}

        {/* New dropdown - Mobile only */}
        <DropdownMenu>
          <DropdownMenuTrigger className="md:hidden inline-flex shrink-0 items-center justify-center rounded-lg size-9 bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors">
            <Plus className="h-5 w-5" />
            <span className="sr-only">Create new</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowCreateItem(true)}>
              <FilePlus className="h-4 w-4 mr-2" />
              New Item
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCreateCollection(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile dialogs */}
      {sidebarData && (
        <CreateItemDialog
          itemTypes={sidebarData.itemTypes}
          open={showCreateItem}
          onOpenChange={setShowCreateItem}
        />
      )}
      <CreateCollectionDialog
        open={showCreateCollection}
        onOpenChange={setShowCreateCollection}
      />
    </header>
  );
}
