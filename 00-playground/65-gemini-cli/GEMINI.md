# FoodSmash - Gemini CLI Starter App

This project is a Nuxt 3/4 starter application named "FoodSmash," designed to showcase the capabilities of the Gemini CLI. It allows users to discover and create unique food combinations.

## Project Overview

- **Purpose:** Educational starter app for Gemini CLI.
- **Framework:** [Nuxt 4](https://nuxt.com/) (Compatibility date: 2025-07-15).
- **Frontend:** [Vue 3](https://vuejs.org/) with Composition API and Script Setup.
- **Icons:** [Lucide Vue Next](https://lucide.dev/).
- **Testing:** [Vitest](https://vitest.dev/) with [@nuxt/test-utils](https://nuxt.com/docs/getting-started/testing).
- **Styling:** Vanilla CSS located in `app/assets/css/main.css`.

## Project Structure

- `app/`: Contains the main source code of the Nuxt application.
  - `assets/css/`: Global stylesheets.
  - `layouts/`: Nuxt layout components.
  - `pages/`: Application pages (auto-routed by Nuxt).
- `public/`: Static assets like icons and robots.txt.
- `test/nuxt/`: Component and integration tests using Nuxt's test environment.

## Building and Running

### Prerequisites
- Node.js (Latest LTS recommended)
- npm

### Commands
- **Install Dependencies:** `npm install`
- **Development Server:** `npm run dev` (starts on http://localhost:3000)
- **Production Build:** `npm run build`
- **Static Generation:** `npm run generate`
- **Preview Production Build:** `npm run preview`
- **Run Tests:** `npm test` or `npx vitest`

## Development Conventions

- **Component Testing:** Use `mountSuspended` from `@nuxt/test-utils/runtime` for testing pages and components within the Nuxt environment.
- **State Management:** Currently uses local component state with `ref`.
- **Styling:** Adhere to the existing vanilla CSS patterns in `app/assets/css/main.css`.
- **File Naming:** Use lowercase with hyphens for directories and PascalCase or lowercase for Vue files as per project current state (e.g., `create.vue`, `index.vue`).
- **Imports:** Prefer explicit imports for Vue and Vitest utilities.

## Coding Preferences

- Do not use semicolons for any JS/TS file.
- Do not use Tailwind classes in component templates.
- Keep project dependencies minimal.
- Use relative imports and NOT a path alias.
