"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface UpgradeCtaProps {
  feature?: string;
  variant?: "stacked" | "side-by-side";
}

export function UpgradeCta({ feature, variant = "stacked" }: UpgradeCtaProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("CHECKOUT_ERROR", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isStacked = variant === "stacked";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={
          isStacked
            ? "flex w-full max-w-xs flex-col gap-3"
            : "grid w-full max-w-lg grid-cols-1 lg:grid-cols-2 gap-3"
        }
      >
        <Button
          onClick={() => handleUpgrade("monthly")}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade $8/month
            </>
          )}
        </Button>
        <Button
          onClick={() => handleUpgrade("yearly")}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade $72/year
              <span className="ml-1 text-xs opacity-80">(save 25%)</span>
            </>
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Cancel anytime</p>
      {feature && (
        <p className="text-sm text-muted-foreground">
          <Link href="/#ai" className="underline hover:text-foreground">
            Learn more about AI features
          </Link>
        </p>
      )}
    </div>
  );
}
