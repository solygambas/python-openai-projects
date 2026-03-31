"use client";

import { Search, Sparkles, PanelLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
        <SheetContent side="left" className="p-0 w-64 pt-12">
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
      <div className="flex items-center gap-2 font-bold text-lg mr-4">
        <div className="bg-primary/10 text-primary p-1 rounded-md">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="hidden lg:inline-block">DevStash</span>
      </div>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={openSearch}
            className="relative flex items-center h-10 w-full sm:w-[300px] md:w-[200px] lg:w-[500px] px-3 rounded-md bg-muted/30 text-muted-foreground text-sm cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <Search className="h-4 w-4 mr-2 text-muted-foreground/50" />
            <span className="flex-1 text-left">Search items...</span>
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border bg-background text-[10px] font-medium text-muted-foreground/50">
              <span className="text-xs">⌘</span>
              <span>K</span>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <CreateCollectionDialog />
          {sidebarData && (
            <CreateItemDialog itemTypes={sidebarData.itemTypes} />
          )}
        </div>
      </div>
    </header>
  );
}
