"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProBadge } from "@/components/ui/pro-badge";
import { Check, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { FREE_TIER_LIMITS } from "@/lib/constants/limits";
import { UpgradeCta } from "./upgrade-cta";

interface SubscriptionSectionProps {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
}

const PRO_FEATURES = [
  "Unlimited items",
  "Unlimited collections",
  "File & image uploads",
  "AI auto-tagging",
  "AI code explanation",
  "AI prompt optimizer",
  "Priority support",
];

export function SubscriptionSection({
  isPro,
  itemCount,
  collectionCount,
}: SubscriptionSectionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("PORTAL_ERROR", error);
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPro) {
    return (
      <Card className="border-purple-500/20 bg-gradient-to-b from-purple-950/20 to-background">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-xl">DevStash Pro</CardTitle>
            <ProBadge />
          </div>
          <CardDescription>
            You have access to all Pro features. Manage your subscription
            anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {PRO_FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-4 w-4 text-purple-400" />
                {feature}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Manage Subscription"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Subscription</CardTitle>
        <CardDescription>
          Upgrade to Pro for unlimited items, file uploads, and AI features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Free Plan</div>
              <div className="text-sm text-muted-foreground">
                {itemCount}/{FREE_TIER_LIMITS.maxItems} items, {collectionCount}
                /{FREE_TIER_LIMITS.maxCollections} collections
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">$0</div>
              <div className="text-sm text-muted-foreground">/month</div>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Basic item types
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Search functionality
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Dark mode
            </li>
          </ul>
        </div>

        <UpgradeCta variant="side-by-side" />
      </CardContent>
    </Card>
  );
}
