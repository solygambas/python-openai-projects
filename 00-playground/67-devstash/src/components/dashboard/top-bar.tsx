"use client";

import { Search, Plus, Sparkles, PanelLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useSidebar } from "./sidebar-provider";

export function DashboardTopBar() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4">
      {/* Mobile Menu Trigger */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
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
          <DashboardSidebar className="border-none bg-background w-full" />
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              type="search"
              placeholder="Search items..."
              className="pl-9 h-10 sm:w-[300px] md:w-[200px] lg:w-[500px] bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border bg-background text-[10px] font-medium text-muted-foreground/50">
              <span className="text-xs">⌘</span>
              <span>K</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button variant="ghost" className="hidden sm:flex text-muted-foreground" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            New Item
          </Button>
        </div>
      </div>
    </header>
  );
}
