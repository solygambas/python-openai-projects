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
  Image as ImageIcon, 
  Link as LinkIcon, 
  Star, 
  ChevronDown,
  ChevronRight,
  Settings,
  User,
  LucideIcon
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";


const iconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon, 
};

interface NavItemProps {
  href: string;
  icon?: LucideIcon;
  customIcon?: React.ReactNode;
  fillIcon?: boolean;
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
  customIcon,
  fillIcon,
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
        "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors group",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      {customIcon ? (
        <div className="flex h-4 w-4 shrink-0 items-center justify-center">
          {customIcon}
        </div>
      ) : Icon ? (
        <Icon 
          className={cn("h-4 w-4 shrink-0")} 
          style={{ color: iconColor }}
          fill={fillIcon ? "currentColor" : "none"}
        />
      ) : null}
      {!isCollapsed && (
        <>
          {children}
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

interface ItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Collection {
  id: string;
  name: string;
  itemCount: number;
  borderColor?: string;
}

interface DashboardSidebarProps {
  isCollapsed?: boolean;
  className?: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
  itemTypes: ItemType[];
  itemTypeCounts: Record<string, number>;
  favoriteCollections: Collection[];
  recentCollections: Collection[];
}


export function DashboardSidebar({ 
  isCollapsed, 
  className,
  user,
  itemTypes,
  itemTypeCounts,
  favoriteCollections,
  recentCollections
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isTypesOpen, setIsTypesOpen] = React.useState(true);
  const [isCollectionsOpen, setIsCollectionsOpen] = React.useState(true);

  // Custom sort order for item types
  const typeOrder = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link'];
  const sortedItemTypes = [...itemTypes].sort((a, b) => {
    const indexA = typeOrder.indexOf(a.name);
    const indexB = typeOrder.indexOf(b.name);
    
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });

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
                {sortedItemTypes.map((type) => (
                  <NavItem 
                    key={type.id} 
                    href={`/items/${type.name}s`} 
                    icon={iconMap[type.icon] || File}
                    iconColor={type.color}
                    count={itemTypeCounts[type.name] || 0}
                    isCollapsed={isCollapsed}
                    isActive={pathname === `/items/${type.name}s`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="truncate">{type.name.charAt(0).toUpperCase() + type.name.slice(1)}s</span>
                      {(type.name === 'file' || type.name === 'image') && (
                        <Badge 
                          variant="secondary" 
                          className="h-3.5 px-1 text-[9px] font-bold leading-none bg-primary/20 text-primary border-none"
                        >
                          PRO
                        </Badge>
                      )}
                    </div>
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
                {favoriteCollections.length > 0 && (
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
                          icon={Star}
                          iconColor="#eab308"
                          fillIcon={true}
                          count={coll.itemCount}
                          isCollapsed={isCollapsed}
                          isActive={pathname === `/collections/${coll.id}`}
                        >
                          <span className="flex-1 truncate">{coll.name}</span>
                        </NavItem>
                      ))}
                    </div>
                  </div>
                )}
 
                 {/* Recent Collections Sub-section */}
                 <div>
                   {!isCollapsed && (
                     <h4 className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                       Recent
                     </h4>
                   )}
                   <div className="space-y-0.5">
                     {recentCollections.map((coll) => (
                       <NavItem 
                         key={coll.id} 
                         href={`/collections/${coll.id}`} 
                         customIcon={
                           <div 
                             className="h-2 w-2 rounded-full" 
                             style={{ backgroundColor: coll.borderColor || '#6b7280' }} 
                           />
                         }
                         count={coll.itemCount}
                         isCollapsed={isCollapsed}
                         isActive={pathname === `/collections/${coll.id}`}
                       >
                         <span className="flex-1 truncate">{coll.name}</span>
                       </NavItem>
                     ))}
                     
                     {!isCollapsed && (
                       <div className="mt-2 pt-2 border-t border-muted/30">
                         <NavItem 
                           href="/collections" 
                           isCollapsed={isCollapsed}
                           isActive={pathname === "/collections"}
                         >
                           <span className="flex-1 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 group-hover:text-foreground">
                             View all collections
                           </span>
                         </NavItem>
                      </div>
                    )}
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
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden">
            {user.image ? (
              <Image 
                src={user.image} 
                alt={user.name || ""} 
                width={36}
                height={36}
                className="h-full w-full object-cover" 
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex flex-1 flex-col overflow-hidden text-sm">
                <span className="truncate font-medium text-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
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
