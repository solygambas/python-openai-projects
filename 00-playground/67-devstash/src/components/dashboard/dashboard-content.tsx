"use client";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-provider";

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:block h-full transition-all duration-300 border-r",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <DashboardSidebar 
          isCollapsed={isCollapsed} 
        />
      </div>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-background/50">
        <div className="flex h-full flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
