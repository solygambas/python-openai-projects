# Current Feature

**Dashboard UI Phase 2**

- [x] Collapsible sidebar
- [x] Items/types with links to /items/TYPE (eg.items/snippets)
- [x] Favorite collections
- [x] Most recent collections
- [x] User avatar area at the bottom
- [x] Drawer icon to open/close sidebar
- [x] Always a drawer on mobile view

## Status

Completed

## History

- [x] Implemented Dashboard UI Phase 2:
    - [x] Created `DashboardSidebar` component with collapsible logic.
    - [x] Integrated `DashboardSidebar` into `DashboardLayout`.
    - [x] Added mobile drawer using ShadCN `Sheet` component.
    - [x] Populated sidebar with mock data (item types, favorites, recent collections).
    - [x] Added user avatar area with dropdown menu and settings icon.
    - [x] Fixed sidebar styling to match screenshot (colors, counts, filled stars, collapsible "Types" and "Collections").
    - [x] Improved top bar with sidebar toggle button and command shortcut hint.
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
