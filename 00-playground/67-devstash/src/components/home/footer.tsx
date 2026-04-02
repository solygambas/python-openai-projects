import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card px-6 pb-6 pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-8 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="mb-2 flex items-center gap-2 font-bold">
              <div className="bg-primary/10 text-primary p-1 rounded-md">
                <Sparkles className="size-5" />
              </div>
              <span>DevStash</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A unified hub for developer knowledge.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-12">
            <div>
              <h4 className="mb-2 text-sm font-semibold">Product</h4>
              <nav className="flex flex-col gap-1.5">
                <Link
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Pricing
                </Link>
                <Link
                  href="#ai"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  AI Features
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Company</h4>
              <nav className="flex flex-col gap-1.5">
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  About
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Blog
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Contact
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold">Legal</h4>
              <nav className="flex flex-col gap-1.5">
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Privacy
                </Link>
                <Link
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Terms
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DevStash. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
