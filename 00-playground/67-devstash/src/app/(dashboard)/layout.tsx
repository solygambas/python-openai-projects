import { SidebarProvider } from "@/components/dashboard/sidebar-provider";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { SearchProvider } from "@/components/search/search-provider";
import { GlobalItemDrawer } from "@/components/search/global-item-drawer";
import { ItemDrawerProvider } from "@/contexts/item-drawer-context";
import { getUserById } from "@/lib/db/users";
import { getItemTypes } from "@/lib/db/item-types";
import { getItemTypeCounts } from "@/lib/db/items";
import { getRecentCollections } from "@/lib/db/collections";
import { DASHBOARD_COLLECTIONS_LIMIT } from "@/lib/utils";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <SidebarProvider>
        <ItemDrawerProvider>
          <SearchProvider>
            <div className="flex min-h-screen w-full flex-col bg-background">
              <DashboardTopBar />
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Please sign in to view your dashboard.
                </p>
              </div>
              <GlobalItemDrawer />
            </div>
          </SearchProvider>
        </ItemDrawerProvider>
      </SidebarProvider>
    );
  }

  const user = await getUserById(userId);

  if (!user) {
    redirect("/sign-in?error=UserNotFound");
  }

  const [itemTypes, itemTypeCounts, favoriteCollections, recentCollections] =
    await Promise.all([
      getItemTypes(),
      getItemTypeCounts(user.id),
      getRecentCollections(user.id, DASHBOARD_COLLECTIONS_LIMIT, true),
      getRecentCollections(user.id, DASHBOARD_COLLECTIONS_LIMIT, false),
    ]);

  return (
    <SidebarProvider
      sidebarData={{
        user,
        itemTypes,
        itemTypeCounts,
        favoriteCollections,
        recentCollections,
      }}
    >
      <ItemDrawerProvider>
        <SearchProvider>
          <div className="flex min-h-screen w-full flex-col bg-background">
            <DashboardTopBar />
            <DashboardContent>{children}</DashboardContent>
            <GlobalItemDrawer />
          </div>
        </SearchProvider>
      </ItemDrawerProvider>
    </SidebarProvider>
  );
}
