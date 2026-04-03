# Stripe Subscription Integration Plan

## Overview

This document outlines the complete implementation plan for Stripe subscription billing in DevStash, enabling Pro tier access at $8/month or $72/year (25% savings).

---

## 1. Current State Analysis

### 1.1 User Model Schema

The User model in `prisma/schema.prisma` already has the required fields:

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  emailVerified         DateTime?
  name                  String?
  image                 String?
  password              String?
  isPro                 Boolean   @default(false)       // ✅ Already exists
  stripeCustomerId      String?   @unique               // ✅ Already exists
  stripeSubscriptionId  String?   @unique               // ✅ Already exists
  editorPreferences     Json?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  // ... relations
}
```

**Status:** Schema is ready for Stripe integration. No migration needed.

### 1.2 NextAuth Configuration

Current auth setup (`src/auth.ts`):

- Uses JWT strategy with Prisma adapter
- Session callback adds `user.id` to session
- Credentials and GitHub providers configured

**Gap:** Session does not include `isPro` status. This needs to be added so client components can check Pro status without additional API calls.

### 1.3 User Data Access Patterns

| Location          | Pattern                      | Notes                                  |
| ----------------- | ---------------------------- | -------------------------------------- |
| Server Actions    | `auth()` → `session.user.id` | Standard pattern in `src/actions/*.ts` |
| Server Components | `auth()` → `session.user.id` | Used in dashboard, profile, settings   |
| Client Components | `useSession()` hook          | Session available via NextAuth context |

### 1.4 Free Tier Limits (from project spec)

| Resource            | Free Tier | Pro Tier  |
| ------------------- | --------- | --------- |
| Items               | 50        | Unlimited |
| Collections         | 3         | Unlimited |
| File uploads        | ❌        | ✅        |
| Image uploads       | ❌        | ✅        |
| AI auto-tagging     | ❌        | ✅        |
| AI code explanation | ❌        | ✅        |
| AI prompt optimizer | ❌        | ✅        |
| Data export         | ❌        | ✅        |

### 1.5 Existing Pro-Related Code

- `src/components/profile/profile-info.tsx` - Displays "Pro Member" or "Free Plan"
- No usage limit checks currently implemented
- File/Image types are UI-visible but not gated

---

## 2. Files to Create

### 2.1 Stripe Client Library

**File:** `src/lib/stripe.ts`

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

// Price IDs (from Stripe Dashboard)
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!, // $8/month
  yearly: process.env.STRIPE_PRICE_YEARLY!, // $72/year
};

// Product configuration
export const SUBSCRIPTION_CONFIG = {
  name: "DevStash Pro",
  features: [
    "Unlimited items",
    "Unlimited collections",
    "File & Image uploads",
    "AI auto-tagging",
    "AI code explanation",
    "AI prompt optimizer",
    "Data export (JSON/ZIP)",
    "Priority support",
  ],
};
```

### 2.2 Stripe Webhook Handler

**File:** `src/app/api/webhooks/stripe/route.ts`

> **Important:** Stripe requires the _raw_ request body for signature verification. Next.js App Router parses JSON automatically, so we need to use `request.text()` to get the raw body.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Get raw body as text for signature verification
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 },
    );
  }

  // Handle events
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WEBHOOK_HANDLER_ERROR", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const customerId = session.customer as string;

  if (!userId || !customerId) {
    console.error("Missing userId or customerId in checkout session");
    return;
  }

  // Update user with Stripe customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customerId },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`User not found for customer: ${customerId}`);
    return;
  }

  // Determine if subscription is active
  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: isActive,
      stripeSubscriptionId: isActive ? subscription.id : null,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: false,
      stripeSubscriptionId: null,
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Log payment failure - could send email notification
  console.error(`Payment failed for user: ${user.id}`);

  // If subscription is past_due for too long, downgrade user
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string,
    );

    if (subscription.status === "past_due") {
      // Give grace period - don't immediately downgrade
      // After 7 days of past_due, webhook will send subscription.deleted
    }
  }
}
```

### 2.3 Checkout Session API

**File:** `src/app/api/stripe/checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await request.json();
  const priceId =
    plan === "yearly" ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly;

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already Pro
  if (user.isPro) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
  }

  // Create or retrieve Stripe customer
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    // Save customer ID
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.id,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    metadata: {
      userId: user.id,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

### 2.4 Customer Portal API

**File:** `src/app/api/stripe/portal/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
```

### 2.5 Usage Limits Utility

**File:** `src/lib/usage-limits.ts`

```typescript
import prisma from "./prisma";

export const FREE_TIER_LIMITS = {
  maxItems: 50,
  maxCollections: 3,
} as const;

export async function checkItemLimit(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  if (!user) {
    return { allowed: false, current: 0, limit: 0 };
  }

  if (user.isPro) {
    return { allowed: true, current: 0, limit: null }; // No limit
  }

  const itemCount = await prisma.item.count({
    where: { userId },
  });

  return {
    allowed: itemCount < FREE_TIER_LIMITS.maxItems,
    current: itemCount,
    limit: FREE_TIER_LIMITS.maxItems,
  };
}

export async function checkCollectionLimit(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  if (!user) {
    return { allowed: false, current: 0, limit: 0 };
  }

  if (user.isPro) {
    return { allowed: true, current: 0, limit: null }; // No limit
  }

  const collectionCount = await prisma.collection.count({
    where: { userId },
  });

  return {
    allowed: collectionCount < FREE_TIER_LIMITS.maxCollections,
    current: collectionCount,
    limit: FREE_TIER_LIMITS.maxCollections,
  };
}

export async function canUploadFiles(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  return user?.isPro ?? false;
}

export async function canUseAI(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  return user?.isPro ?? false;
}
```

### 2.6 Pro Badge Component

**File:** `src/components/ui/pro-badge.tsx`

```typescript
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface ProBadgeProps {
  className?: string;
}

export function ProBadge({ className }: ProBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 ${className}`}
    >
      <Crown className="h-3 w-3 mr-1" />
      PRO
    </Badge>
  );
}
```

---

## 3. Files to Modify

### 3.1 Update NextAuth Session

**File:** `src/auth.ts`

Add `isPro` to the session callback:

```typescript
// In the callbacks object, update the session callback:
async session({ session, token }) {
  if (token.sub && session.user) {
    session.user.id = token.sub;
    session.user.isPro = token.isPro as boolean; // Add this line
  }
  return session;
},

// Add JWT callback to sync isPro from database:
async jwt({ token, user, trigger }) {
  if (user) {
    token.sub = user.id;
  }

  // Always sync isPro from database to catch webhook updates
  if (token.sub) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { isPro: true },
    });
    token.isPro = dbUser?.isPro ?? false;
  }

  return token;
},
```

### 3.2 Update Session Types

**File:** `src/types/next-auth.d.ts`

```typescript
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean; // Add this
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    isPro?: boolean; // Add this
  }
}
```

### 3.3 Update Create Item Action

**File:** `src/actions/items.ts`

Add limit check to `createItem`:

```typescript
import { checkItemLimit } from "@/lib/usage-limits";

export async function createItem(
  input: CreateItemInput,
): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // Check item limit for free users
  const limitCheck = await checkItemLimit(userId);
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: `Free tier limited to ${limitCheck.limit} items. Upgrade to Pro for unlimited items.`,
    };
  }

  // ... rest of implementation
}
```

### 3.4 Update Create Collection Action

**File:** `src/actions/collections.ts`

Add limit check to `createCollection`:

```typescript
import { checkCollectionLimit } from "@/lib/usage-limits";

export async function createCollection(
  input: CreateCollectionInput,
): Promise<CreateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // Check collection limit for free users
  const limitCheck = await checkCollectionLimit(userId);
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: `Free tier limited to ${limitCheck.limit} collections. Upgrade to Pro for unlimited collections.`,
    };
  }

  // ... rest of implementation
}
```

### 3.5 Update Upload API

**File:** `src/app/api/upload/route.ts`

Add Pro check:

```typescript
import { canUploadFiles } from "@/lib/usage-limits";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user can upload files (Pro only)
  const canUpload = await canUploadFiles(session.user.id);
  if (!canUpload) {
    return NextResponse.json(
      { error: "File uploads are a Pro feature. Upgrade to unlock." },
      { status: 403 },
    );
  }

  // ... rest of implementation
}
```

### 3.6 Update Settings Page

**File:** `src/app/(dashboard)/settings/page.tsx`

Add subscription section:

```typescript
import { SubscriptionSection } from "@/components/settings/subscription-section";

export default async function SettingsPage() {
  // ... existing code

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      {/* ... existing sections */}

      {/* Add subscription section - only for non-Pro users or for management */}
      <SubscriptionSection user={user} />

      <EditorPreferencesProvider initialPreferences={editorPreferences}>
        <EditorPreferencesForm />
      </EditorPreferencesProvider>
      <AccountActions isEmailUser={isEmailUser} />
    </div>
  );
}
```

### 3.7 Create Subscription Section Component

**File:** `src/components/settings/subscription-section.tsx`

```typescript
"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProBadge } from "@/components/ui/pro-badge";
import { Crown, Check } from "lucide-react";

interface SubscriptionSectionProps {
  user: User;
}

export function SubscriptionSection({ user }: SubscriptionSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user.isPro) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Subscription</CardTitle>
            <ProBadge />
          </div>
          <CardDescription>
            You have access to all Pro features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleManage} disabled={isLoading} variant="outline">
            Manage Subscription
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upgrade to Pro</CardTitle>
        <CardDescription>
          Unlock unlimited items, file uploads, and AI features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Toggle */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`p-4 rounded-lg border text-left ${
              selectedPlan === "monthly"
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="font-semibold">$8/month</div>
            <div className="text-sm text-muted-foreground">Billed monthly</div>
          </button>
          <button
            onClick={() => setSelectedPlan("yearly")}
            className={`p-4 rounded-lg border text-left relative ${
              selectedPlan === "yearly"
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="absolute -top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              Save 25%
            </div>
            <div className="font-semibold">$72/year</div>
            <div className="text-sm text-muted-foreground">$6/month equivalent</div>
          </button>
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {[
            "Unlimited items",
            "Unlimited collections",
            "File & Image uploads",
            "AI auto-tagging",
            "AI code explanation",
            "AI prompt optimizer",
            "Data export (JSON/ZIP)",
            "Priority support",
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>

        <Button onClick={handleSubscribe} disabled={isLoading} className="w-full">
          <Crown className="h-4 w-4 mr-2" />
          {isLoading ? "Loading..." : "Subscribe Now"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 4. Stripe Dashboard Setup

### 4.1 Create Product and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create a new product:
   - Name: "DevStash Pro"
   - Description: "Unlimited items, collections, file uploads, and AI features"

3. Add two prices:
   - **Monthly:** $8/month, recurring monthly
   - **Yearly:** $72/year, recurring yearly

4. Copy the Price IDs (format: `price_xxx`) for environment variables

### 4.2 Configure Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

4. Copy the Webhook Signing Secret (format: `whsec_xxx`)

### 4.3 Configure Customer Portal

> **Recommended:** Use Stripe's hosted Customer Portal for subscription management instead of building custom UI. This is faster to implement and handles all edge cases.

1. Go to [Stripe Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable the portal
3. Configure allowed features (minimum recommended):
   - **Payment Method Updates** ✅ (minimum required)
4. Additional features to consider:
   - **Subscription Cancellation** - Allow customers to cancel
   - **Invoice History** - View and download past invoices
   - **Plan Changes** - Allow switching between monthly/yearly (if configured)
5. Set the default return URL (e.g., `https://your-domain.com/settings`)

**Portal Capabilities:**

- Customers authenticate with email address
- View and manage active subscriptions
- Update payment methods
- Download invoices
- Cancel or pause subscriptions
- All changes reflect in real-time in your Stripe account

---

## 5. Environment Variables

Add to `.env` and Vercel: (already done)

```bash
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_YEARLY=price_xxx

# App URL (for redirect URLs)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 6. Testing Checklist

### 6.1 Stripe Testing (Test Mode)

- [ ] Use Stripe CLI to forward webhooks locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Test webhook signature verification with Stripe CLI test helper:
  ```typescript
  // Generate test header for local testing
  const testPayload = JSON.stringify({
    id: "evt_test_webhook",
    object: "event",
    type: "checkout.session.completed",
  });
  const testHeader = stripe.webhooks.generateTestHeaderString({
    payload: testPayload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });
  ```
- [ ] Test checkout with test card: `4242 4242 4242 4242`
- [ ] Verify webhook receives `checkout.session.completed`
- [ ] Check user's `isPro` is set to `true` after checkout
- [ ] Test customer portal access
- [ ] Test subscription cancellation (sets `isPro` to `false`)
- [ ] Test subscription resumption
- [ ] Test payment failure handling

### 6.2 Feature Gating Testing

- [ ] Free user cannot create item 51
- [ ] Free user cannot create collection 4
- [ ] Free user cannot upload files/images
- [ ] Pro user has no limits
- [ ] Pro badge shows correctly in UI
- [ ] Session updates after webhook (refresh page)

### 6.3 Edge Cases

- [ ] User deletes account while subscribed (cancel subscription first)
- [ ] Subscription expires mid-session (handle gracefully)
- [ ] Webhook delivery failures (Stripe retries, handle idempotency)
- [ ] Multiple checkout sessions for same user

---

## 7. Implementation Order

### Phase 1: Core Infrastructure (Day 1)

1. Create `src/lib/stripe.ts`
2. Create `src/app/api/webhooks/stripe/route.ts`
3. Create `src/app/api/stripe/checkout/route.ts`
4. Create `src/app/api/stripe/portal/route.ts`
5. Add environment variables
6. Update `src/auth.ts` session callback
7. Update `src/types/next-auth.d.ts`

### Phase 2: Feature Gating (Day 2)

1. Create `src/lib/usage-limits.ts`
2. Update `src/actions/items.ts` - add limit check
3. Update `src/actions/collections.ts` - add limit check
4. Update `src/app/api/upload/route.ts` - add Pro check
5. Add Pro checks to AI features (when implemented)

### Phase 3: UI Updates (Day 3)

1. Create `src/components/ui/pro-badge.tsx`
2. Create `src/components/settings/subscription-section.tsx`
3. Update `src/app/(dashboard)/settings/page.tsx`
4. Update sidebar to show Pro status
5. Add "Upgrade to Pro" prompts in limit error messages

### Phase 4: Testing & Polish (Day 4)

1. Test all webhook events
2. Test checkout flow end-to-end
3. Test customer portal
4. Verify feature gating works
5. Add error handling and edge case handling
6. Deploy to staging

---

## 8. Notes

### Documentation References

This plan was created using official documentation from:

- **Stripe Node.js SDK** - Webhook signature verification, checkout sessions, and billing portal
- **Auth.js (NextAuth v5)** - Session extension patterns, JWT callbacks, and TypeScript types

### Webhook Idempotency

Stripe may deliver the same webhook event multiple times. The current implementation should be idempotent because:

- `isPro` updates are idempotent (setting same value)
- Customer ID updates use upsert pattern

For production, consider adding an event log to track processed events.

### Session Sync Strategy

The research prompt mentioned using the JWT callback to sync `isPro` from the database on every session validation. This approach:

- Adds one small DB query per session validation
- Guarantees the session stays in sync after webhook updates
- A simple page reload after checkout is sufficient

### Alternative: Stripe Customer Portal

For faster implementation, consider using Stripe's hosted Customer Portal instead of building custom subscription management UI. The portal handles:

- Payment method updates
- Subscription cancellation
- Invoice history
- Plan changes (if configured)

The implementation above uses the portal for subscription management.

### Migration Consideration

No database migration needed - the User model already has `stripeCustomerId`, `stripeSubscriptionId`, and `isPro` fields.

---

## 9. Future Enhancements

1. **Plan Changes:** Allow monthly ↔ yearly switching
2. **Trial Period:** Add 7-day free trial
3. **Coupons/Discounts:** Support promo codes
4. **Team Plans:** Multi-user subscriptions (future)
5. **Grace Period:** 7-day grace for failed payments before downgrade
6. **Email Notifications:** Send confirmation emails on subscription events
