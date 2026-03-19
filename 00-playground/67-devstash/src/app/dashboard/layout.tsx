import { SidebarProvider } from "@/components/dashboard/sidebar-provider";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getDemoUser } from "@/lib/db/users";
import { getItemTypes } from "@/lib/db/item-types";
import { getItemTypeCounts } from "@/lib/db/items";
import { getRecentCollections } from "@/lib/db/collections";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demoUser = await getDemoUser();
  
  if (!demoUser) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col bg-background">
          <DashboardTopBar />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Demo user not found. Please run the seed script.</p>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const [itemTypes, itemTypeCounts, favoriteCollections, recentCollections] = await Promise.all([
    getItemTypes(),
    getItemTypeCounts(demoUser.id),
    getRecentCollections(demoUser.id, 5, true),
    getRecentCollections(demoUser.id, 5, false)
  ]);

  return (
    <SidebarProvider sidebarData={{
      user: demoUser,
      itemTypes,
      itemTypeCounts,
      favoriteCollections,
      recentCollections
    }}>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <DashboardTopBar />
        <DashboardContent>
          {children}
        </DashboardContent>
      </div>
    </SidebarProvider>
  );
}
