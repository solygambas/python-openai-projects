# Feature Spec: Stripe Integration - Phase 2

## Status

Not Started

## Overview

Implement Stripe webhooks, feature gating in server actions, and UI components for subscription management. This phase requires Stripe CLI for local webhook testing and completes the full subscription flow.

## Dependencies

- Phase 1 completed (core infrastructure)
- Stripe CLI installed for local webhook testing
- Webhook secret from Stripe Dashboard

## Prerequisites

### 1. Configure Webhook in Stripe Dashboard

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy Webhook Signing Secret (`whsec_xxx`)

### 2. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Login to Stripe
stripe login
```

---

## Implementation Tasks

### 1. Stripe Webhook Handler

**File:** `src/app/api/webhooks/stripe/route.ts`

Events to handle:

- `checkout.session.completed` - Save customer ID to user
- `customer.subscription.created` - Set `isPro: true`
- `customer.subscription.updated` - Sync subscription status
- `customer.subscription.deleted` - Set `isPro: false`
- `invoice.payment_failed` - Log failure (grace period)

Key implementation details:

- Use `request.text()` for raw body (signature verification)
- Verify webhook signature with `stripe.webhooks.constructEvent()`
- Return 400 for invalid signatures
- Return 200 for successful processing

### 2. Feature Gating - Items

**File:** `src/actions/items.ts`

Add to `createItem`:

```typescript
import { checkItemLimit } from "@/lib/usage-limits";

const limitCheck = await checkItemLimit(userId);
if (!limitCheck.allowed) {
  return {
    success: false,
    error: `Free tier limited to ${limitCheck.limit} items. Upgrade to Pro for unlimited items.`,
  };
}
```

### 3. Feature Gating - Collections

**File:** `src/actions/collections.ts`

Add to `createCollection`:

```typescript
import { checkCollectionLimit } from "@/lib/usage-limits";

const limitCheck = await checkCollectionLimit(userId);
if (!limitCheck.allowed) {
  return {
    success: false,
    error: `Free tier limited to ${limitCheck.limit} collections. Upgrade to Pro for unlimited collections.`,
  };
}
```

### 4. Feature Gating - Upload

**File:** `src/app/api/upload/route.ts`

Add to `POST` handler:

```typescript
import { canUploadFiles } from "@/lib/usage-limits";

const canUpload = await canUploadFiles(session.user.id);
if (!canUpload) {
  return NextResponse.json(
    { error: "File uploads are a Pro feature. Upgrade to unlock." },
    { status: 403 },
  );
}
```

### 5. Pro Badge Component

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

### 6. Subscription Section Component

**File:** `src/components/settings/subscription-section.tsx`

Features:

- Plan selector (monthly/yearly) with "Save 25%" badge
- Feature list with checkmarks
- Subscribe button for free users
- "Manage Subscription" button for Pro users
- Loading states for API calls

### 7. Settings Page Update

**File:** `src/app/(dashboard)/settings/page.tsx`

Add subscription section:

```typescript
import { SubscriptionSection } from "@/components/settings/subscription-section";

// In the page JSX:
<SubscriptionSection user={user} />
```

---

## Testing with Stripe CLI

### Start Webhook Forwarding

```bash
# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Output shows webhook secret and events:
# Ready! Your webhook signing secret is 'whsec_xxx'
```

### Test Checkout Flow

1. Run `stripe listen` in terminal
2. Start dev server: `npm run dev`
3. Login as user and go to Settings
4. Click "Subscribe Now"
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout
7. Watch webhook event in terminal
8. Refresh page - Pro status should show

### Test Cards

| Card Number           | Result             |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | Success            |
| `4000 0000 0000 0002` | Decline            |
| `4000 0000 0000 9995` | Insufficient funds |

---

## Manual Testing Checklist

### Webhook Events

- [ ] `checkout.session.completed` updates user with customer ID
- [ ] `customer.subscription.created` sets `isPro: true`
- [ ] `customer.subscription.updated` syncs status
- [ ] `customer.subscription.deleted` sets `isPro: false`
- [ ] `invoice.payment_failed` logs error

### Feature Gating

- [ ] Free user cannot create item 51
- [ ] Free user cannot create collection 4
- [ ] Free user cannot upload files
- [ ] Pro user has no limits
- [ ] Error messages include upgrade prompt

### UI

- [ ] Pro badge shows in settings
- [ ] Subscribe button works for free users
- [ ] Manage Subscription button works for Pro users
- [ ] Plan toggle shows yearly savings
- [ ] Feature list displays correctly
- [ ] Loading states work

### Session Sync

- [ ] `isPro` in session after webhook
- [ ] Page refresh shows updated status
- [ ] Session syncs after subscription cancellation

---

## Acceptance Criteria

- [ ] Webhook handler verifies signature correctly
- [ ] All 5 webhook events processed correctly
- [ ] Item creation limited to 50 for free users
- [ ] Collection creation limited to 3 for free users
- [ ] File upload blocked for free users
- [ ] Pro badge displays correctly
- [ ] Subscription section shows in settings
- [ ] Checkout flow works with test cards
- [ ] Customer portal accessible for Pro users
- [ ] Build succeeds
- [ ] All existing tests still pass

---

## Edge Cases to Handle

1. **Webhook idempotency** - Same event delivered twice
2. **User deletion** - Cancel subscription before account deletion
3. **Session expiry** - Subscription ends mid-session
4. **Multiple checkouts** - User clicks subscribe multiple times
5. **Webhook failure** - Stripe retries, handle gracefully

---

## Future Enhancements (Out of Scope)

- Plan changes (monthly ↔ yearly)
- Trial period (7 days free)
- Promo codes
- Team plans
- Email notifications for subscription events

---

## Related Files

- Reference: `@docs/stripe-integration-plan.md`
- Phase 1 Spec: `@context/features/stripe-integration-phase-1.md`
