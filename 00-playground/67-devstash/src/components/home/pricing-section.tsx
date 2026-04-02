"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { usePricingToggle } from "./pricing-toggle";

const freeFeatures = [
  { text: "50 items total", included: true },
  { text: "3 collections", included: true },
  { text: "Snippets, Prompts, Commands, Notes, Links", included: true },
  { text: "Basic search", included: true },
  { text: "File & Image uploads", included: false },
  { text: "AI features", included: false },
  { text: "Data export", included: false },
];

const proFeatures = [
  { text: "Unlimited items", included: true },
  { text: "Unlimited collections", included: true },
  { text: "All item types including Files & Images", included: true },
  { text: "Advanced search", included: true },
  { text: "File & Image uploads", included: true },
  { text: "AI auto-tagging", included: true },
  { text: "AI code explanation", included: true },
  { text: "AI prompt optimizer", included: true },
  { text: "Data export (JSON/ZIP)", included: true },
  { text: "Priority support", included: true },
];

export function PricingSection() {
  const { isYearly, togglePricing, mounted } = usePricingToggle();

  const proPrice = isYearly ? "$72" : "$8";
  const proPriceNote = isYearly ? "Billed yearly ($6/mo)" : "Billed monthly";

  return (
    <section id="pricing" className="px-6 pb-20 pt-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center font-[family-name:var(--font-syne)] text-3xl font-bold md:text-4xl">
          Simple Pricing
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-muted-foreground">
          Start free, upgrade when you need more.
        </p>

        {/* Toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <span
            className={`text-sm ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}
          >
            Monthly
          </span>
          <button
            onClick={togglePricing}
            className="relative h-7 w-12 rounded-full border border-border bg-card transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
            aria-pressed={isYearly}
            disabled={!mounted}
          >
            <span
              className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-[#3b82f6] transition-transform ${isYearly ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
          <span className="flex items-center gap-1.5 text-sm">
            <span
              className={isYearly ? "text-foreground" : "text-muted-foreground"}
            >
              Yearly
            </span>
            <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs font-medium text-green-500">
              Save 25%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* Free Tier */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 text-center">
              <h3 className="mb-1 font-[family-name:var(--font-syne)] text-xl font-bold">
                Free
              </h3>
              <div className="flex items-baseline justify-center gap-0.5">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            <ul className="mb-6 space-y-2.5">
              {freeFeatures.map((feature, index) => (
                <li
                  key={index}
                  className={`flex items-center gap-2 text-sm ${feature.included ? "" : "text-muted-foreground"}`}
                >
                  {feature.included ? (
                    <Check className="size-4 shrink-0 text-green-500" />
                  ) : (
                    <X className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  {feature.text}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-xl border border-[#3b82f6] bg-card p-6 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3b82f6] px-3 py-1 text-xs font-semibold text-white">
              Most Popular
            </div>
            <div className="mb-6 text-center">
              <h3 className="mb-1 font-[family-name:var(--font-syne)] text-xl font-bold">
                Pro
              </h3>
              <div className="flex items-baseline justify-center gap-0.5">
                <span className="text-4xl font-bold">
                  {mounted ? proPrice : "$8"}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {mounted ? proPriceNote : "Billed monthly"}
              </p>
            </div>
            <ul className="mb-6 space-y-2.5">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-green-500" />
                  {feature.text}
                </li>
              ))}
            </ul>
            <Button className="w-full bg-[#3b82f6] text-white hover:bg-[#2563eb]">
              <Link href="/register">Start Pro Trial</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
