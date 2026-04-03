import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DevStashLogo } from "./devstash-logo";
import { MobileMenu } from "./mobile-menu";

interface TopBarProps {
  /**
   * Whether to show the navigation links (Features, AI Features, Pricing)
   * @default true
   */
  showNav?: boolean;
}

export function TopBar({ showNav = true }: TopBarProps) {
  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md"
        id="navbar"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <DevStashLogo href="/" />

          {/* Desktop Nav */}
          {showNav && (
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="#features"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="#ai"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                AI Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </Link>
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="bg-[#3b82f6] text-white hover:bg-[#2563eb]">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <MobileMenu showNav={showNav} />
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-[57px]" />
    </>
  );
}
