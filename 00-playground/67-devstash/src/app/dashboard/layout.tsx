import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Sparkles } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="bg-primary text-primary-foreground p-1 rounded-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="hidden sm:inline-block">DevStash</span>
        </div>

        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search items..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[400px] bg-muted/50 border-none"
              />
            </div>
          </form>
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <Button variant="outline" className="hidden sm:flex" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Collection
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Placeholder */}
        <aside className="hidden w-64 border-r bg-muted/20 md:block">
          <div className="flex h-full flex-col gap-2 p-6">
            <h2 className="text-lg font-semibold tracking-tight">Sidebar</h2>
          </div>
        </aside>

        {/* Main Content Area Placeholder */}
        <main className="flex flex-1 flex-col overflow-y-auto bg-background p-6">
          <div className="flex h-full flex-col gap-2">
            <h2 className="text-lg font-semibold tracking-tight md:hidden">Main</h2>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
