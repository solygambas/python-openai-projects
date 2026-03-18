import { SidebarProvider } from "@/components/dashboard/sidebar-provider";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <DashboardTopBar />
        <DashboardContent>
          {children}
        </DashboardContent>
      </div>
    </SidebarProvider>
  );
}
