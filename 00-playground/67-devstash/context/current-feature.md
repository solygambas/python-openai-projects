# Current Feature

Implement Neon PostgreSQL and Prisma

## Status

Completed

## Tasks

- [x] Install Prisma 7 and `@prisma/client`
- [x] Initialize Prisma with `npx prisma init`
- [x] Configure `schema.prisma` with Neon PostgreSQL provider
- [x] Implement data models from `@context/project-overview.md`:
    - [x] `User` model
    - [x] NextAuth models (`Account`, `Session`, `VerificationToken`)
    - [x] `Item` model and `ContentType` enum
    - [x] `ItemType` model
    - [x] `Collection` model
    - [x] `ItemCollection` join table
    - [x] `Tag` model
- [x] Add appropriate indexes and cascade deletes as per `@context/features/database-spec.md`
- [x] Create the initial migration: `npx prisma migrate dev --name init`
- [x] Create a seed script `prisma/seed.ts` for system item types
- [x] Verify the setup by running the seed script
- [x] Create a singleton Prisma client in `src/lib/prisma.ts`
- [x] Added helper scripts to `package.json` (`db:migrate`, `db:seed`, etc.)
- [x] Configured `prisma.config.ts` for Prisma 7 (centralized config)
- [x] Created `scripts/test-db.ts` to verify database connection using `node --experimental-strip-types` and `--env-file` support
- [x] Removed `dotenv` and shifted to native Node.js `--env-file` for all scripts and Prisma config

## History

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
