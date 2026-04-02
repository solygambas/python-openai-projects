# Homepage Spec

## Overview

Create the marketing homepage for DevStash based on the static prototype in `prototypes/homepage/`. The page should showcase the product's value proposition, features, and pricing.

## Routes

- `/` - Homepage (public, no auth required)

## Component Structure

### Server Components

1. **HomePage** (`src/app/page.tsx`)
   - Main page component
   - Renders all sections in order: Hero, Features, AI, Pricing, Footer

2. **HeroSection** (`src/components/home/hero-section.tsx`)
   - Title, subtitle, and CTA buttons
   - Static dashboard preview (no animation)
   - Static chaos icons (no animation)

3. **FeaturesSection** (`src/components/home/features-section.tsx`)
   - Grid of 6 feature cards
   - Icons, titles, descriptions

4. **AISection** (`src/components/home/ai-section.tsx`)
   - PRO badge
   - AI features list
   - Static code editor mockup with AI explanation

5. **PricingSection** (`src/components/home/pricing-section.tsx`)
   - Pricing toggle (monthly/yearly) - server renders default state
   - Free and Pro cards with feature lists

6. **Footer** (`src/components/home/footer.tsx`)
   - Brand, links, copyright

### Client Components

1. **ChaosAnimation** (`src/components/home/chaos-animation.tsx`)
   - Floating icons with mouse repulsion effect
   - Respects `prefers-reduced-motion`
   - Only rendered on client side

2. **PricingToggle** (`src/components/home/pricing-toggle.tsx`)
   - Toggle button for monthly/yearly pricing
   - Updates displayed price and note
   - Persists preference to localStorage

3. **MobileMenu** (`src/components/home/mobile-menu.tsx`)
   - Hamburger menu for mobile
   - Slide-out navigation

4. **ScrollAnimations** (`src/components/home/scroll-animations.tsx`)
   - Fade-in on scroll effect
   - Navbar background change on scroll

5. **CopyButton** (`src/components/home/copy-button.tsx`)
   - Copy code from AI demo section
   - Toast feedback on copy

## Navigation

### TopBar (`src/components/home/top-bar.tsx`)

- Fixed position with blur backdrop
- Logo links to `/`
- Nav links: Features (`#features`), AI (`#ai`), Pricing (`#pricing`)
- Sign In button links to `/sign-in`
- Get Started button links to `/register`
- Mobile menu toggle (hidden on desktop)

### Footer Links

- Features, Pricing, AI Features → anchor links
- About, Blog, Contact, Privacy, Terms → placeholder `#`
- Logo → `/`

## Styling

- Use Tailwind CSS with existing dark theme colors
- Reuse item type colors from `src/lib/constants/item-types.ts`
- Use ShadCN Button component for all buttons
- Use Syne font for headings (load via next/font or CSS)
- Use Inter for body text (already loaded)

### Color Tokens (match prototype)

```css
--color-snippet: #3b82f6 (blue) --color-prompt: #f59e0b (amber)
  --color-command: #06b6d4 (cyan) --color-note: #22c55e (green)
  --color-file: #64748b (slate) --color-image: #ec4899 (pink)
  --color-url: #6366f1 (indigo) --color-pro: #8b5cf6 (violet);
```

## Responsiveness

- Desktop: Full layout with animations
- Tablet: Stacked hero, 2-column feature grid
- Mobile: Single column, hamburger menu, simplified preview

## Accessibility

- All buttons and links have visible focus states
- `prefers-reduced-motion` disables animations
- Semantic HTML sections with proper headings
- Skip-to-content link for keyboard navigation

## Implementation Notes

1. The homepage should be a separate layout from the dashboard (no sidebar)
2. Use `'use client'` only where interactivity is required
3. Keep animation code DRY - extract shared utilities
4. Dashboard preview is a static mockup, not the real component
5. Pricing toggle updates price display client-side only
6. Consider using `framer-motion` for animations if preferred over raw JS

## Files to Create

```
src/
├── app/
│   └── page.tsx (homepage entry)
├── components/
│   └── home/
│       ├── top-bar.tsx
│       ├── hero-section.tsx
│       ├── chaos-animation.tsx
│       ├── features-section.tsx
│       ├── ai-section.tsx
│       ├── pricing-section.tsx
│       ├── pricing-toggle.tsx
│       ├── footer.tsx
│       ├── mobile-menu.tsx
│       ├── scroll-animations.tsx
│       └── copy-button.tsx
```

## References

- `prototypes/homepage/index.html` - HTML structure
- `prototypes/homepage/styles.css` - CSS styles and animations
- `prototypes/homepage/script.js` - JavaScript interactions
- `src/lib/constants/item-types.ts` - Type colors and icons
