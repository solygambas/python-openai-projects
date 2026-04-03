# Feature Spec: Stripe Integration - Phase 1

## Status

Not Started

## Overview

Implement core Stripe infrastructure including the Stripe client library, checkout and portal API routes, and usage limits utility. This phase focuses on the foundation that enables subscription billing, with comprehensive unit tests for the usage-limits module.

## Dependencies

- Stripe account with test mode enabled
- Product and prices created in Stripe Dashboard (see Prerequisites)
- Environment variables configured

## Prerequisites

### 1. Stripe Dashboard Setup

#### Create Product and Prices (done)

1. Go to [Stripe Dashboard - Products](https://dashboard.stripe.com/products)
2. Create product "DevStash Pro"
3. Add two prices:
   - **Monthly**: $8/month (recurring monthly)
   - **Yearly**: $72/year (recurring yearly)
4. Copy Price IDs (`price_xxx`) for environment variables

#### Configure Customer Portal (done)

1. Go to [Stripe Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable the portal
3. Configure features:
   - ✅ Payment Method Updates (minimum required)
   - ✅ Subscription Cancellation
   - ✅ Invoice History
4. Set return URL: `http://localhost:3000/settings`

### 2. Environment Variables (done)

Add to `.env`:

```bash
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # For Phase 2
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_YEARLY=price_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Implementation Tasks

### 1. Stripe Client Library

**File:** `src/lib/stripe.ts`

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

// Price IDs (from Stripe Dashboard)
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  yearly: process.env.STRIPE_PRICE_YEARLY!,
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

### 2. Checkout Session API

**File:** `src/app/api/stripe/checkout/route.ts`

- POST endpoint to create Stripe checkout session
- Validates user authentication
- Creates/retrieves Stripe customer
- Returns checkout URL for redirect

### 3. Customer Portal API

**File:** `src/app/api/stripe/portal/route.ts`

- POST endpoint to create Stripe billing portal session
- Validates user authentication and subscription status
- Returns portal URL for subscription management

### 4. Usage Limits Utility

**File:** `src/lib/usage-limits.ts`

Functions:

- `checkItemLimit(userId)` - Check if user can create more items
- `checkCollectionLimit(userId)` - Check if user can create more collections
- `canUploadFiles(userId)` - Check file upload permission
- `canUseAI(userId)` - Check AI feature permission

Constants:

```typescript
export const FREE_TIER_LIMITS = {
  maxItems: 50,
  maxCollections: 3,
} as const;
```

### 5. Update NextAuth Session

**File:** `src/auth.ts`

Add `isPro` to session callback:

- JWT callback syncs `isPro` from database
- Session callback exposes `isPro` to client

### 6. Update Session Types

**File:** `src/types/next-auth.d.ts`

Extend Session and JWT interfaces with `isPro: boolean`.

---

## Unit Tests

### Test File: `src/lib/usage-limits.test.ts`

#### Test Categories

**1. checkItemLimit**

- [ ] Returns allowed=true for Pro user (no limit)
- [ ] Returns allowed=false when free user hits 50 items
- [ ] Returns correct current count
- [ ] Returns null limit for Pro users
- [ ] Returns correct limit for free users
- [ ] Returns allowed=false for non-existent user

**2. checkCollectionLimit**

- [ ] Returns allowed=true for Pro user (no limit)
- [ ] Returns allowed=false when free user hits 3 collections
- [ ] Returns correct current count
- [ ] Returns null limit for Pro users
- [ ] Returns correct limit for free users
- [ ] Returns allowed=false for non-existent user

**3. canUploadFiles**

- [ ] Returns true for Pro user
- [ ] Returns false for free user
- [ ] Returns false for non-existent user

**4. canUseAI**

- [ ] Returns true for Pro user
- [ ] Returns false for free user
- [ ] Returns false for non-existent user

#### Test Setup Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkItemLimit,
  checkCollectionLimit,
  canUploadFiles,
  canUseAI,
} from "./usage-limits";

// Mock Prisma
vi.mock("./prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    item: {
      count: vi.fn(),
    },
    collection: {
      count: vi.fn(),
    },
  },
}));

import prisma from "./prisma";

describe("usage-limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests...
});
```

---

## Acceptance Criteria

- [ ] `src/lib/stripe.ts` exports Stripe client and price constants
- [ ] `POST /api/stripe/checkout` creates checkout session and returns URL
- [ ] `POST /api/stripe/portal` creates portal session and returns URL
- [ ] `src/lib/usage-limits.ts` exports all 4 check functions
- [ ] Session includes `isPro` status from database
- [ ] All 20 unit tests pass
- [ ] Build succeeds with no TypeScript errors
- [ ] ESLint passes with no warnings

---

## Testing Commands

```bash
# Run unit tests
npm test src/lib/usage-limits.test.ts

# Run all tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

---

## Notes

- This phase does NOT include webhook handling (Phase 2)
- After checkout, users must manually refresh page for Pro status (webhooks in Phase 2)
- Customer Portal handles subscription cancellation/updates
- Usage limits are enforced server-side only in this phase

---

## Related Files

- Reference: `@docs/stripe-integration-plan.md`
- Phase 2 Spec: `@context/features/stripe-integration-phase-2.md`
