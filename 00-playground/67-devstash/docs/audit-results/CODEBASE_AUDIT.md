# DevStash Codebase Security Audit

**Date:** 2026-03-31
**Auditor:** Claude Opus 4.6
**Scope:** Security, Performance, Code Quality, Architecture
**Updated:** 2026-03-31 (Top 3 priority fixes applied)

---

## Executive Summary

This audit reviewed the DevStash Next.js application, focusing on security vulnerabilities, performance issues, code quality, and architectural concerns. The codebase demonstrates generally good security practices with proper authentication, input validation, and rate limiting.

**Update:** The top 3 priority security issues have been fixed:

1. ✅ GitHub OAuth Email Account Linking - Fixed (allowDangerousEmailAccountLinking: false)
2. ✅ Content-Disposition Header Injection - Fixed (filename sanitization added)
3. ✅ ReactMarkdown XSS Prevention - Fixed (rehype-sanitize plugin added)

---

## Security Issues

### HIGH Severity

#### 1. GitHub OAuth Email Account Linking Risk

**File:** `src/auth.ts`
**Line(s):** 81-83

```typescript
GitHub({
  allowDangerousEmailAccountLinking: true,
}),
```

**Problem:** The `allowDangerousEmailAccountLinking: true` setting allows any GitHub account with a verified email to link to an existing DevStash account. If an attacker can register the same email on GitHub before the legitimate user, they could potentially take over the account.

**Fix:** Consider implementing email verification before linking accounts, or use a more restrictive approach:

```typescript
GitHub({
  allowDangerousEmailAccountLinking: false,
}),
```

Then implement explicit account linking flow where users must verify ownership of both accounts.

---

#### 2. Missing CSRF Protection for Server Actions

**File:** `src/actions/items.ts`
**Line(s):** 102-153, 155-198, 200-248

```typescript
export async function createItem(
  input: CreateItemInput,
): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  // ... directly processes input
}
```

**Problem:** Server Actions in Next.js are protected against CSRF by default when called from forms with the `action` prop. However, when called programmatically from client components using `startTransition`, ensure proper origin validation. While Next.js handles this automatically, the current implementation should verify that all form submissions use proper form actions or include CSRF tokens for programmatic submissions.

**Fix:** For programmatic submissions, consider adding a CSRF token to sensitive operations or ensure the calling components use proper form submission patterns.

---

### MEDIUM Severity

#### 3. Content-Disposition Header Filename Injection

**File:** `src/app/api/download/[id]/route.ts`
**Line(s):** 54-58

```typescript
return new NextResponse(uint8Array, {
  headers: {
    "Content-Type": fileData.contentType,
    "Content-Disposition": `attachment; filename="${item.fileName || "download"}"`,
    "Content-Length": uint8Array.byteLength.toString(),
  },
});
```

**Problem:** The filename from `item.fileName` is directly interpolated into the `Content-Disposition` header without sanitization. This could allow header injection if the filename contains quotes or newlines. While the R2 upload sanitizes the filename, the original filename is stored and could potentially contain malicious characters.

**Fix:** Sanitize the filename before use:

```typescript
const sanitizedFileName = (item.fileName || "download")
  .replace(/[^a-zA-Z0-9._-]/g, "_")
  .substring(0, 255);

return new NextResponse(uint8Array, {
  headers: {
    "Content-Type": fileData.contentType,
    "Content-Disposition": `attachment; filename="${sanitizedFileName}"`,
    "Content-Length": uint8Array.byteLength.toString(),
  },
});
```

---

#### 4. Potential XSS via ReactMarkdown

**File:** `src/components/ui/markdown-editor.tsx`
**Line(s):** 124-127

```typescript
<div className="markdown-preview p-4 text-sm leading-relaxed">
  {value ? (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
  ) : (
    <p className="text-muted-foreground italic">No content</p>
  )}
</div>
```

**Problem:** User-supplied markdown content is rendered without explicit sanitization. While `react-markdown` uses React's default escaping for HTML, this should be verified against XSS vectors, especially with GFM (GitHub Flavored Markdown) extensions enabled.

**Fix:** Add explicit sanitization using a library like `dompurify`:

```typescript
import DOMPurify from "dompurify";

// Before rendering, sanitize the markdown or use rehype-sanitize plugin
```

Alternatively, add `rehype-sanitize` to the remark plugins:

```typescript
import rehypeSanitize from 'rehype-sanitize';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeSanitize]}
>
  {value}
</ReactMarkdown>
```

---

#### 5. Email Enumeration in Password Reset

**File:** `src/app/api/auth/forgot-password/route.ts`
**Line(s):** 40-51

```typescript
// Always return success to prevent email enumeration
const user = await prisma.user.findUnique({ where: { email } });

if (user) {
  const resetToken = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(email, resetToken.token);
}

return NextResponse.json({
  message: "If an account with that email exists, a reset link has been sent.",
});
```

**Status:** Good - The code correctly prevents email enumeration by always returning the same response. This is a positive security practice.

---

#### 6. Rate Limiting Bypass via Fail-Open

**File:** `src/lib/rate-limit.ts`
**Line(s):** 122-128, 146-152

```typescript
if (!redisConfigured) {
  return {
    success: true,
    remaining: limit,
    reset: Date.now(),
  };
}

// ...

} catch {
  return {
    success: true,
    remaining: limit,
    reset: Date.now(),
  };
}
```

**Problem:** The rate limiter uses a fail-open pattern - if Redis is unavailable or an error occurs, all requests are allowed. While this ensures availability, it could allow abuse during outages.

**Fix:** Consider adding monitoring and alerts for rate limiter failures. For high-risk endpoints, consider temporarily blocking requests or using a local in-memory fallback counter.

---

### LOW Severity

#### 7. Error Messages May Leak Information

**File:** `src/app/api/upload/route.ts`
**Line(s):** 50-51

```typescript
console.error("UPLOAD_ERROR", error);
return NextResponse.json({ error: "Upload failed" }, { status: 500 });
```

**Status:** Good - Error details are logged server-side but not exposed to clients. This is proper practice.

---

## Performance Issues

### MEDIUM Severity

#### 1. N+1 Query Pattern in Collections

**File:** `src/lib/db/collections.ts`
**Line(s):** 44-86

```typescript
return collections.map((collection) => {
  const itemTypesMap = new Map<string, string>();
  const typeFrequency = new Map<string, number>();

  collection.items.forEach((itemCollection) => {
    const typeId = itemCollection.item.itemTypeId;
    const color = itemCollection.item.itemType.color;
    // ...
  });
  // ...
});
```

**Problem:** While the query fetches items with their item types in a single query, the subsequent processing iterates over all items for each collection. For large collections, this could be slow.

**Fix:** The current implementation is acceptable for the expected data volumes, but consider adding pagination for collections with many items.

---

#### 2. Separate Database Calls for Item Type Counts

**File:** `src/lib/db/items.ts`
**Line(s):** 93-122

```typescript
export async function getItemTypeCounts(userId: string) {
  const counts = await prisma.item.groupBy({
    by: ["itemTypeId"],
    where: { userId },
    _count: { _all: true },
  });

  // Get item types to map IDs to names
  const itemTypes = await prisma.itemType.findMany();
  // ...
}
```

**Problem:** Two separate database queries are made when the item type names could be included in the groupBy or fetched with a join.

**Fix:** This is acceptable since item types are a small, static dataset that could be cached. Consider caching the itemTypes lookup:

```typescript
// Cache item types since they rarely change
let itemTypesCache: Map<string, string> | null = null;

export async function getItemTypeCounts(userId: string) {
  const counts = await prisma.item.groupBy({...});

  if (!itemTypesCache) {
    const types = await prisma.itemType.findMany();
    itemTypesCache = new Map(types.map(t => [t.id, t.name]));
  }
  // ...
}
```

---

#### 3. Missing Database Indexes

**File:** `prisma/schema.prisma`
**Line(s):** 91-124

```prisma
model Item {
  // ...
  @@index([userId])
  @@index([itemTypeId])
  @@index([createdAt])
  @@index([updatedAt])
  @@index([isPinned])
  @@index([isFavorite])
  @@map("items")
}
```

**Status:** Good - Proper indexes exist for commonly queried fields.

**Missing Index:** Consider adding a composite index for common query patterns:

```prisma
@@index([userId, isPinned, updatedAt])  // For getPinnedItems
@@index([userId, isFavorite])            // For favorite queries
@@index([userId, createdAt])             // For getRecentItems
```

---

#### 4. Large Client Bundle with ItemsWithDrawer Component

**File:** `src/components/dashboard/items-with-drawer.tsx`
**Line(s):** 1-683

**Problem:** The `ItemsWithDrawer` component is 683 lines and includes substantial logic for rendering, state management, and multiple variants. This could increase client bundle size.

**Fix:** The component has already been partially refactored with extracted sub-components (ItemDrawerHeader, ItemDrawerActionBar, etc.). Consider further code-splitting by lazy loading the drawer:

```typescript
const ItemDrawer = dynamic(() => import('./ItemDrawer'), {
  loading: () => <DrawerSkeleton />
});
```

---

## Code Quality Issues

### MEDIUM Severity

#### 1. Inconsistent Error Handling Patterns

**File:** `src/actions/items.ts`
**Line(s):** 148-153

```typescript
} catch (error) {
  console.error("CREATE_ITEM_ERROR", error);
  return { success: false, error: "Failed to create item" };
}
```

**Problem:** Error handling uses `console.error` without structured logging. Different files use slightly different patterns.

**Fix:** Create a centralized error logging utility:

```typescript
// src/lib/logger.ts
export function logError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
  // Could integrate with error tracking service
}
```

---

#### 2. Type Duplication

**File:** `src/components/dashboard/items-with-drawer.tsx`
**Line(s):** 57-90

```typescript
interface ItemCollectionJoin {
  collection: { id: string; name: string };
}

interface ItemDetail {
  id: string;
  title: string;
  // ... 20+ fields
}
```

**Problem:** `ItemDetail` interface is defined locally in the component rather than being shared from a central types file. This duplicates type definitions.

**Fix:** Move shared types to `src/types/` directory:

```typescript
// src/types/item.ts
export interface ItemDetail {
  /* ... */
}

// Then import in components
import { ItemDetail } from "@/types/item";
```

---

#### 3. Missing Input Validation for File Size

**File:** `src/lib/r2.ts`
**Line(s):** 73-103

```typescript
export function validateFile(
  file: File,
  typeName: "image" | "file",
): { valid: boolean; error?: string } {
  const constraints = FILE_CONSTRAINTS[typeName];
  // Check file size
  if (file.size > constraints.maxSize) {
    /* ... */
  }
  // ...
}
```

**Status:** Good - File validation includes size, extension, and MIME type checks. However, the server-side validation in `upload/route.ts` relies solely on this client-side definition.

**Fix:** The upload route also validates, which is correct. No action needed.

---

### LOW Severity

#### 4. Unused Imports in Some Components

**File:** `src/components/dashboard/items-with-drawer.tsx`
**Line(s):** 14-16

```typescript
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Pin,
  Star,
  Copy,
} from "lucide-react";
```

**Problem:** All imports appear to be used. No dead code found.

**Status:** Good - No unused imports detected in reviewed files.

---

#### 5. Component Responsibility - item-card.tsx

**File:** `src/components/dashboard/item-card.tsx`
**Line(s):** 17-83

```typescript
export function ItemCard({ item, iconMap, onClick, onCopy }: ItemCardProps) {
  const itemType = item.itemType;
  const Icon = iconMap[itemType?.icon || "File"] || File;
  const borderColor = itemType?.color || "#6b7280";
  const [showCopy, setShowCopy] = useState(false);
  // ...
}
```

**Problem:** The component mixes presentation with state management for the copy button visibility. This is a minor concern.

**Fix:** Consider using CSS hover states instead of React state for the visibility toggle:

```typescript
// Use group-hover instead of useState for copy button visibility
<button className="opacity-0 group-hover:opacity-100 transition-opacity">
```

---

## Architecture Issues

### MEDIUM Severity

#### 1. Mixed Server/Client Component Patterns

**File:** `src/app/(dashboard)/layout.tsx`
**Line(s):** 11-64

```typescript
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <SidebarProvider>
        {/* ... */}
      </SidebarProvider>
    );
  }
  // ... data fetching and rendering
}
```

**Problem:** The layout handles both authentication checking and data fetching. When auth fails, it renders a placeholder instead of redirecting, which differs from the page-level pattern.

**Fix:** Standardize the auth handling pattern. The layout shows a placeholder, but the proxy middleware handles redirects. Consider adding a comment explaining this dual approach:

```typescript
// Note: The proxy middleware redirects unauthenticated users to /sign-in.
// This fallback is shown if somehow the middleware is bypassed or during SSR.
if (!userId) {
  return <UnauthenticatedState />;
}
```

---

#### 2. Proxy Middleware Configuration

**File:** `src/proxy.ts`
**Line(s):** 33-36

```typescript
export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
```

**Problem:** The matcher excludes all API routes from auth checking. However, most API routes implement their own auth checks. This is intentional but could be documented better.

**Fix:** Add a comment explaining the security model:

```typescript
// API routes are excluded because they implement their own authentication.
// All sensitive API endpoints use `auth()` to verify user sessions.
```

---

### LOW Severity

#### 3. Inconsistent Date Formatting

**File:** `src/lib/utils.ts`
**Line(s):** 8-14

```typescript
export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d);
}
```

**Status:** Good - A shared utility exists for date formatting and is used consistently.

---

## Summary

### Total Issues by Severity

| Severity | Count |
| -------- | ----- |
| CRITICAL | 0     |
| HIGH     | 2     |
| MEDIUM   | 8     |
| LOW      | 4     |

### Top 3 Priority Fixes

1. **GitHub Account Linking Security** - Review `allowDangerousEmailAccountLinking` policy and implement explicit account linking flow.

2. **Content-Disposition Header Sanitization** - Sanitize filenames before using them in HTTP headers to prevent injection attacks.

3. **ReactMarkdown XSS Prevention** - Add `rehype-sanitize` to markdown rendering to prevent potential XSS vectors.

### Overall Assessment

The DevStash codebase demonstrates solid security practices with proper authentication flows, rate limiting, and input validation. The codebase is well-organized with clear separation between server actions, API routes, and UI components. Key areas for improvement include:

- Strengthening OAuth account linking security
- Adding explicit sanitization for user-supplied content in HTTP headers and markdown
- Improving error handling patterns with structured logging
- Adding composite database indexes for common query patterns

No critical vulnerabilities were found. The existing security controls (authentication, authorization checks, input validation, rate limiting) are properly implemented.
