# Current Feature

[Feature Title]

## Status

Not Started

## Tasks

- [ ] Task 1
- [ ] Task 2

## History

- **Dashboard Collections** (Completed)
    - [x] Created `src/lib/db/collections.ts`, `src/lib/db/items.ts`, `src/lib/db/item-types.ts`, and `src/lib/db/users.ts` with real data fetching functions
    - [x] Updated `src/app/dashboard/page.tsx` to be an async server component fetching real data
    - [x] Implemented border color logic in `getRecentCollections` based on the most frequent content type
    - [x] Updated `RecentCollections`, `PinnedItems`, and `RecentItems` components to use real data from Prisma
    - [x] Verified build succeeds and database connectivity is working
- **Verification Script & Demo Data Integrity** (Completed)
    - [x] Updated `scripts/test-db.ts` to fetch and display demo data
    - [x] Enabled ESM support in `package.json` to fix module compatibility warnings
    - [x] Optimized `tsconfig.json` for script execution and TypeScript handling
    - [x] Verified full database and demo data integrity via `npm run db:test`
    - [x] Verified build succeeds and merged to main
- **Seed Sample Data** (Completed)
    - [x] Installed `bcryptjs` and `@types/bcryptjs`
    - [x] Updated `prisma/seed.ts` to hash password and seed comprehensive sample data
    - [x] Implemented idempotency in seed script by clearing existing user data
    - [x] Successfully ran `npm run db:seed`
- **Neon PostgreSQL and Prisma Setup** (Completed)
    - [x] Prisma 7 installation and configuration
    - [x] Database schema implementation
    - [x] Neon serverless adapter setup
    - [x] Initial migration and seeding
    - [x] Singleton Prisma client implementation
    - [x] Verified database connectivity with a custom test script using native Node env loading
    - [x] Cleaned up project by removing `dotenv` and `tsx` in favor of native Node 24+ features (`--experimental-strip-types`, `--env-file`)
- **Dashboard UI Phase 3** (Completed)
    - [x] The main area to the right
    - [x] Recent collections
    - [x] Pinned Items
    - [x] 10 Recent items
    - [x] 4 stats cards at the top for number of items, collections, favorite items and favorite collections
    - *Note:* This was phase 3 of 3 for the dashboard UI layout. Ref: `@context/screenshots/dashboard-ui-main.png`, `@context/features/dashboard-phase-3-spec.md`.
- **Dashboard UI Phase 2** (Completed)
    - [x] Collapsible sidebar
    - [x] Items/types with links to /items/TYPE (eg. /items/snippets)
    - [x] Favorite collections
    - [x] Most recent collections
    - [x] User avatar area at the bottom
    - [x] Drawer icon to open/close sidebar
    - [x] Always a drawer on mobile view
    - *Note:* This was phase 2 of 3 for the dashboard UI layout. Ref: `@context/screenshots/dashboard-ui-main.png`, `@context/features/dashboard-phase-2-spec.md`.
- **Dashboard UI Phase 1** (Completed)
    - [x] ShadCN UI initialization and components
    - [x] ShadCN component installation
    - [x] Dashboard route at /dashboard
    - [x] Main dashboard layout and any global styles
    - [x] Dark mode by default
    - [x] Top bar with search and new item button (display only)
    - [x] Placeholder for sidebar and main area. Just add an h2 with "Sidebar" and "Main" for now.
    - *Note:* This was phase 1 of 3 for the dashboard UI layout. Ref: `@context/screenshots/dashboard-ui-main.png`, `@context/features/dashboard-phase-1-spec.md`.
- Project setup and boilerplate cleanup
- Created mock data at `src/lib/mock-data.ts`
- Started Dashboard UI Phase 1 implementation
- [x] Completed Phase 1: Basic layout, dark mode, and ShadCN setup.
- [x] Fixed dark mode by forcing `dark` class on `html` tag and disabling system override.
