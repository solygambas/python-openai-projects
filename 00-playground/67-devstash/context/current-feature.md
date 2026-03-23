# Current Feature: Setup Email Verification on Register

## Status

In Progress

## Goals

- Create and store a secure verification token in the database upon user registration.
- Send an email with a verification link to the newly registered user using Resend.
- Implement a `/api/auth/verify` endpoint to verify the token when the user clicks the link.
- Update the user's `emailVerified` status upon successful verification.
- Create `/verify-email` page to display the verification status (success, error, expired).
- Block sign in for unverified users.
- Add a "Resend verification email" functionality if token expires.
- Handle edge cases: expired tokens, already verified, invalid tokens.

## Notes

- We are using Resend for email delivery, which is already installed.
- The `RESEND_API_KEY` is available in the `.env` file.
- Use `onboarding@resend.dev` as the `from` email address for now.
- Users must click the link in their email to complete verification.
- Token expiration: 24 hours.

## History

- Project setup and boilerplate cleanup
- Created mock data at `src/lib/mock-data.ts`
- Started Dashboard UI Phase 1 implementation
- [x] Completed Phase 1: Basic layout, dark mode, and ShadCN setup.
- [x] Fixed dark mode by forcing `dark` class on `html` tag and disabling system override.
- **Dashboard UI Phase 1** (Completed)
    - [x] ShadCN UI initialization and components
    - [x] ShadCN component installation
    - [x] Dashboard route at /dashboard
    - [x] Main dashboard layout and any global styles
    - [x] Dark mode by default
    - [x] Top bar with search and new item button (display only)
    - [x] Placeholder for sidebar and main area. Just add an h2 with "Sidebar" and "Main" for now.
    - *Note:* This was phase 1 of 3 for the dashboard UI layout. Ref: `@context/screenshots/dashboard-ui-main.png`, `@context/features/dashboard-phase-1-spec.md`.
- **Dashboard UI Phase 2** (Completed)
    - [x] Collapsible sidebar
    - [x] Items/types with links to /items/TYPE (eg. /items/snippets)
    - [x] Favorite collections
    - [x] Most recent collections
    - [x] User avatar area at the bottom
    - [x] Drawer icon to open/close sidebar
    - [x] Always a drawer on mobile view
    - *Note:* This was phase 2 of 3 for the dashboard UI layout. Ref: `@context/screenshots/dashboard-ui-main.png`, `@context/features/dashboard-phase-2-spec.md`.
- **Dashboard UI Phase 3** (Completed)
    - [x] The main area to the right
    - [x] Recent collections
    - [x] Pinned Items
    - [x] 10 Recent items
    - [x] 4 stats cards at the top for number of items, collections, favorite items and favorite collections
    - *Note:* This was phase 3 of 3 for the dashboard UI layout. Ref: `@context/screenshots/dashboard-ui-main.png`, `@context/features/dashboard-phase-3-spec.md`.
- **Neon PostgreSQL and Prisma Setup** (Completed)
    - [x] Prisma 7 installation and configuration
    - [x] Database schema implementation
    - [x] Neon serverless adapter setup
    - [x] Initial migration and seeding
    - [x] Singleton Prisma client implementation
    - [x] Verified database connectivity with a custom test script using native Node env loading
    - [x] Cleaned up project by removing `dotenv` and `tsx` in favor of native Node 24+ features (`--experimental-strip-types`, `--env-file`)
- **Seed Sample Data** (Completed)
    - [x] Installed `bcryptjs` and `@types/bcryptjs`
    - [x] Updated `prisma/seed.ts` to hash password and seed comprehensive sample data
    - [x] Implemented idempotency in seed script by clearing existing user data
    - [x] Successfully ran `npm run db:seed`
- **Verification Script & Demo Data Integrity** (Completed)
    - [x] Updated `scripts/test-db.ts` to fetch and display demo data
    - [x] Enabled ESM support in `package.json` to fix module compatibility warnings
    - [x] Optimized `tsconfig.json` for script execution and TypeScript handling
    - [x] Verified full database and demo data integrity via `npm run db:test`
    - [x] Verified build succeeds and merged to main
- **Dashboard Collections** (Completed)
    - [x] Created `src/lib/db/collections.ts`, `src/lib/db/items.ts`, `src/lib/db/item-types.ts`, and `src/lib/db/users.ts` with real data fetching functions
    - [x] Updated `src/app/dashboard/page.tsx` to be an async server component fetching real data
    - [x] Implemented border color logic in `getRecentCollections` based on the most frequent content type
    - [x] Updated `RecentCollections`, `PinnedItems`, and `RecentItems` components to use real data from Prisma
    - [x] Verified build succeeds and database connectivity is working
- **Dashboard Items** (Completed)
    - [x] Created `src/lib/db/items.ts` with data fetching functions for pinned and recent items
    - [x] Updated `DashboardPage` to fetch real item data from Prisma
    - [x] Implemented type-based border indicators and icons in `PinnedItems` and `RecentItems`
    - [x] Added empty state handling for `PinnedItems` to hide the section when no items are pinned
    - [x] Verified stats display correctly using database counts
- **Stats & Sidebar Implementation** (Completed)
    - [x] Added `getItemTypeCounts(userId)` in `src/lib/db/items.ts`
    - [x] Updated `getRecentCollections` in `src/lib/db/collections.ts` to support favorite filtering
    - [x] Updated `SidebarProvider` to include `sidebarData` in context
    - [x] Updated `DashboardLayout` to fetch real sidebar data (user, types, counts, collections)
    - [x] Updated `DashboardSidebar` to use real data and implemented colored circle indicators for recent collections
    - [x] Added "View all collections" link in sidebar
    - [x] Verified build succeeds and real data is displayed in sidebar and stats
- **Add Pro Badge to Sidebar** (Completed)
    - [x] Added `PRO` badge to "Files" and "Images" in sidebar
    - [x] Used ShadCN UI `Badge` component
    - [x] Defined `ItemType` and `Collection` interfaces to fix TypeScript lint errors
    - [x] Updated `NavItem` for flexible child support
    - [x] Verified implementation via browser screenshot and lint check
- **Quick Wins & Optimizations** (Completed)
    - [x] Added DB indexes to Item and Collection models for `isPinned`, `isFavorite`, and `updatedAt`
    - [x] Refactored Dashboard to use `Suspense` and Skeleton loaders for improved performance
    - [x] Created shared `formatDate` utility in `src/lib/utils.ts`
    - [x] Added query limit validation to all DB fetching functions to prevent over-fetching
    - [x] Improved type safety in `src/lib/mock-data.ts`
    - [x] Successfully migrated database with new indexes
    - [x] Standardized date formatting across Dashboard components
- **Auth Setup - NextAuth + GitHub Provider** (Completed)
    - [x] Installed `next-auth@beta` and `@auth/prisma-adapter`
    - [x] Implemented split auth config pattern for Edge compatibility
    - [x] Added GitHub OAuth provider
    - [x] Secured `/dashboard/*` routes using Next.js 16 `src/proxy.ts` (named export)
    - [x] Implemented clean URL redirect strategy using an `auth-callback-url` cookie
    - [x] Extended `Session` type to include `user.id`
    - [x] Verified build and linting
- **Auth Phase 2 - Credentials Provider** (Completed)
    - [x] Added field definitions to `Credentials` provider for default UI rendering
    - [x] Implemented bcrypt validation in `authorize` callback
    - [x] Created `POST /api/auth/register` with input validation and password hashing
    - [x] Connected `DashboardLayout` to `auth()` to display real user data
    - [x] Verified end-to-end registration and login flow
- **Auth UI - Sign In, Register & Sign Out (Phase 3)** (Completed)
    - [x] Custom Sign In Page (`/sign-in`) with email/password and GitHub OAuth
    - [x] Custom Register Page (`/register`) with name/email/password inputs
    - [x] Component: Reusable Avatar with initials/image logic
    - [x] Sidebar Update: Bottom avatar with user info and dropdown
    - [x] Sidebar Update: Sign out functionality
    - [x] Sidebar Update: Profile link on avatar click
    - [x] Integrated `sonner` for themed, system-aware toast notifications
    - [x] Verified lint-free build
