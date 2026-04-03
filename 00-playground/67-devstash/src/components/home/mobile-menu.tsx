"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface MobileMenuProps {
  /**
   * Whether to show the navigation links (Features, AI Features, Pricing)
   * @default true
   */
  showNav?: boolean;
}

export function MobileMenu({ showNav = true }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="flex md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-x-0 top-[65px] z-40 border-b border-border bg-background p-6">
          {showNav && (
            <div className="flex flex-col gap-4">
              <Link
                href="#features"
                className="text-base font-medium"
                onClick={closeMenu}
              >
                Features
              </Link>
              <Link
                href="#ai"
                className="text-base font-medium"
                onClick={closeMenu}
              >
                AI Features
              </Link>
              <Link
                href="#pricing"
                className="text-base font-medium"
                onClick={closeMenu}
              >
                Pricing
              </Link>
            </div>
          )}
          <div
            className={
              showNav ? "mt-6 flex flex-col gap-3" : "flex flex-col gap-3"
            }
          >
            <Button variant="ghost" className="w-full">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="w-full bg-[#3b82f6] text-white hover:bg-[#2563eb]">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
