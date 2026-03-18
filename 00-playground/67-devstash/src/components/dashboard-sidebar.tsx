"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Code, 
  Sparkles, 
  Terminal, 
  StickyNote, 
  File, 
  Image, 
  Link as LinkIcon, 
  Star, 
  Folder,
  ChevronDown,
  ChevronRight,
  Settings,
  User,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  mockItemTypes, 
  mockCollections, 
  mockUser,
  mockItemTypeCounts
} from "@/lib/mock-data";

const iconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  count?: number;
  iconColor?: string;
  rightIcon?: LucideIcon;
  rightIconColor?: string;
  isCollapsed?: boolean;
  isActive?: boolean;
}

const NavItem = ({ 
  href, 
  icon: Icon, 
  children, 
  count,
  iconColor,
  rightIcon: RightIcon,
  rightIconColor,
  isCollapsed,
  isActive
}: NavItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon 
        className={cn("h-4 w-4 shrink-0")} 
        style={{ color: iconColor }}
      />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{children}</span>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground/60">{count}</span>
          )}
          {RightIcon && (
            <RightIcon className={cn("h-3.5 w-3.5", rightIconColor)} fill={rightIconColor ? "currentColor" : "none"} />
          )}
        </>
      )}
    </Link>
  );
};

interface SectionHeaderProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
}

const SectionHeader = ({ 
  title, 
  isOpen, 
  onToggle,
  isCollapsed
}: SectionHeaderProps) => (
  <button
    onClick={onToggle}
    className={cn(
      "flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors",
      isCollapsed && "justify-center"
    )}
  >
    {!isCollapsed && <span>{title}</span>}
    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
  </button>
);

interface DashboardSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function DashboardSidebar({ 
  isCollapsed, 
  className 
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isTypesOpen, setIsTypesOpen] = React.useState(true);
  const [isCollectionsOpen, setIsCollectionsOpen] = React.useState(true);
  
  const favoriteCollections = mockCollections.filter(c => c.isFavorite);
  const otherCollections = mockCollections.filter(c => !c.isFavorite);

  return (
    <aside 
      className={cn(
        "flex h-full flex-col bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 py-4">
          {/* Types Section */}
          <div className="px-1">
            <SectionHeader 
              title="Types" 
              isOpen={isTypesOpen} 
              onToggle={() => setIsTypesOpen(!isTypesOpen)} 
              isCollapsed={isCollapsed}
            />
            {isTypesOpen && (
              <div className="mt-1 space-y-0.5">
                {mockItemTypes.map((type) => (
                  <NavItem 
                    key={type.id} 
                    href={`/items/${type.name}s`} 
                    icon={iconMap[type.icon] || File}
                    iconColor={type.color}
                    count={mockItemTypeCounts[type.name as keyof typeof mockItemTypeCounts]}
                    isCollapsed={isCollapsed}
                    isActive={pathname === `/items/${type.name}s`}
                  >
                    {type.name.charAt(0).toUpperCase() + type.name.slice(1)}s
                  </NavItem>
                ))}
              </div>
            )}
          </div>

          {/* Collections Section */}
          <div className="px-1">
            <SectionHeader 
              title="Collections" 
              isOpen={isCollectionsOpen} 
              onToggle={() => setIsCollectionsOpen(!isCollectionsOpen)} 
              isCollapsed={isCollapsed}
            />
            {isCollectionsOpen && (
              <div className="mt-1 space-y-4">
                {/* Favorites Sub-section */}
                <div>
                  {!isCollapsed && (
                    <h4 className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      Favorites
                    </h4>
                  )}
                  <div className="space-y-0.5">
                    {favoriteCollections.map((coll) => (
                      <NavItem 
                        key={coll.id} 
                        href={`/collections/${coll.id}`} 
                        icon={Folder}
                        rightIcon={Star}
                        rightIconColor="text-yellow-500"
                        isCollapsed={isCollapsed}
                        isActive={pathname === `/collections/${coll.id}`}
                      >
                        {coll.name}
                      </NavItem>
                    ))}
                  </div>
                </div>

                {/* All Collections Sub-section */}
                <div>
                  {!isCollapsed && (
                    <h4 className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      All Collections
                    </h4>
                  )}
                  <div className="space-y-0.5">
                    {otherCollections.map((coll) => (
                      <NavItem 
                        key={coll.id} 
                        href={`/collections/${coll.id}`} 
                        icon={Folder}
                        count={coll.itemCount}
                        isCollapsed={isCollapsed}
                        isActive={pathname === `/collections/${coll.id}`}
                      >
                        {coll.name}
                      </NavItem>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="mt-auto border-t p-4">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden">
            <User className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex flex-1 flex-col overflow-hidden text-sm">
                <span className="truncate font-medium text-foreground">{mockUser.name}</span>
                <span className="truncate text-xs text-muted-foreground">{mockUser.email}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
