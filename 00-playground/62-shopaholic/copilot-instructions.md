# GitHub Copilot Instructions for Shopping List App

## Project Overview

- **Purpose:** Shopping list app where users can add/delete items and manage a "favs" list. Favorite items can be bulk imported into the main shopping list.
- **Target Users:** General users looking for a simple shopping list tracker.
- **Core Features:**
  1. Add and delete items in the shopping list
  2. Maintain a separate favorites list
  3. Bulk import favorite items into the shopping list

## Tech Stack

- **Next.js:** 15.5.3
- **React:** 19.1.0
- **TypeScript:** Strict mode enabled
- **App Router:** Enabled
- **Rendering:** Client-side rendering (CSR)
- **State Management:** React Context API (in a /context folder)
- **Styling:** Tailwind CSS + global `globals.css` for reusable styles
- **Icons:** Lucide icons imported as React components

## Data & API

- **Persistence:** Local-only (browser state)
- **Server Operations:** Use Next.js API routes or server-side operations whenever possible
- **Data Fetching:** Fetch data server-side when possible
- **Environment Variables:** Use `.env` config, do not hardcode keys

## File & Component Structure

- **Structure:** Flat structure
- **Components:** Prefer server components when possible
- **Shared UI:** Centralized in `/components`
- **Feature-specific logic:** Keep minimal, focus on simplicity

## Coding Conventions & Styling

- **Naming:** Default conventions
- **TypeScript:** Strict types enforced
- **Formatting:** Default (Prettier/ESLint recommended, follow community best practices)
- **Tailwind Usage:**
  - Apply reusable styles in `globals.css`
  - Only use Tailwind classes directly for non-reused styles
  - Avoid inline styles
  - Use semantic HTML elements
  - Maintain consistent styling
  - Support dark mode with the `.dark` class
- **Color Palette:**
  - Primary: `bg-blue-600` (buttons, primary actions)
  - Secondary: `bg-gray-200` (component backgrounds, secondary actions)
  - Text: `text-gray-800` for headings, `text-gray-600` for regular text

## Testing & Quality

- **Critical Components:** Jest + React Testing Library
- **Testing Examples:** Consistent across components
- **Feature Completion:** Check off implemented features in `_features.md`

## Performance

- Default performance optimizations
- No explicit caching or image optimization for now

## Deployment & CI/CD

- No deployment/CI setup required at this stage

## Security & Auth

- No authentication or secrets management
- Public-only app

## Copilot Preferences

- Use server components whenever possible
- Prefer Next.js API routes for server-side operations
- Fetch data server-side when possible
- Enforce strict TypeScript
- Keep components small and focused
- Follow Next.js and Tailwind community best practices
