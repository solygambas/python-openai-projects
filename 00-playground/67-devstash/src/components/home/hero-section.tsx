import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChaosAnimation } from "./chaos-animation";
import { DashboardPreview } from "./dashboard-preview";

export function HeroSection() {
  return (
    <section className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-6 py-12 text-center">
      {/* Hero Text */}
      <div className="mb-8">
        <h1 className="mb-4 font-[family-name:var(--font-syne)] text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            From Chaos to Order
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground md:text-lg">
          One place for all your snippets, prompts, commands, notes, and links.
        </p>
      </div>

      {/* Visual: Chaos to Dashboard */}
      <div className="mb-10 flex w-full max-w-4xl flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
        {/* Chaos Container */}
        <div className="flex flex-col items-center">
          <ChaosAnimation />
          <span className="mt-2 text-xs text-muted-foreground">
            Your knowledge today...
          </span>
        </div>

        {/* Arrow */}
        <div className="text-2xl text-[#3b82f6] md:rotate-0 -rotate-90">→</div>

        {/* Dashboard Preview */}
        <div className="flex flex-col items-center">
          <DashboardPreview />
          <span className="mt-2 text-xs text-muted-foreground">
            ...with DevStash
          </span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="bg-[#3b82f6] text-white hover:bg-[#2563eb]"
        >
          <Link href="/register">Get Started Free</Link>
        </Button>
        <Button size="lg" variant="outline">
          <Link href="#features">Learn More</Link>
        </Button>
      </div>
    </section>
  );
}
