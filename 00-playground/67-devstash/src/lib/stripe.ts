import Stripe from "stripe";

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// Price IDs for DevStash Pro subscription
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  yearly: process.env.STRIPE_PRICE_YEARLY!,
} as const;

// Price amounts in cents (for display purposes)
export const STRIPE_PRICE_AMOUNTS = {
  monthly: 800, // $8.00
  yearly: 7200, // $72.00
} as const;

// Subscription status type
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";

// Check if subscription is active (user has Pro access)
export function isSubscriptionActive(
  status: SubscriptionStatus | null,
): boolean {
  return status === "active" || status === "trialing";
}
