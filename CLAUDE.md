# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

반려식탁 (Pet Table) — a nutrition-focused web app for pet owners. Calculates personalized feeding amounts (RER/DER), filters products by allergies, compares prices, and manages pet profiles. UI text is Korean; code and comments are English.

## Tech Stack

- **Framework:** React Router v7 (framework mode, SSR enabled)
- **UI:** React 19, TailwindCSS v4
- **Language:** TypeScript 5.9, strict mode
- **Database:** PostgreSQL via Prisma 6.5
- **Auth:** Supabase Auth (Google, Kakao OAuth)
- **Testing:** Vitest (node environment, no jsdom)
- **Deployment:** Cloudflare Workers (Wrangler) or Docker

## Commands

```bash
npm run dev              # Dev server at http://localhost:5173
npm run build            # Production build
npm run start            # Production server (react-router-serve)
npm run typecheck        # react-router typegen && tsc
npm run test             # vitest (all tests)
npx vitest run <file>    # Single test file
npx vitest run <file> -t "name"  # Single test by name
npm run db:migrate       # prisma migrate dev
npm run db:seed          # prisma db seed
npx prisma generate      # Generate Prisma client
npm run preview          # Build + wrangler dev (local CF testing)
npm run deploy           # Build + wrangler deploy to Cloudflare
```

No lint script or ESLint config exists in this repo.

## Architecture

### Data Flow & Fallback Strategy

The app gracefully handles missing Supabase config. `useCatalogData()` fetches from Supabase REST (client-side), normalizes snake_case rows with type guards, and falls back to mock data (`app/data/mock.ts`) if Supabase is unavailable. A `DataSourceBadge` component indicates the active data source. Avoid adding real network calls unless asked.

### Layout Routing (root.tsx)

`app/root.tsx` branches layout by route path:
- **Auth routes** (`/login`, `/auth/callback`, `/welcome`): centered, no navigation
- **Admin routes** (`/admin/*`): full-width sidebar layout
- **Main routes**: mobile-first frame (`max-w-md`) with fixed `BottomNavigation` (80px bottom padding)

### Nutrition Engine

Core logic in `app/utils/calc.ts`: RER (`70 * kg^0.75`), DER (RER × activity factor), daily grams, NFE calculation, calorie estimation via Modified Atwater formula, price positioning, and mix plan calculations. References AAFCO/FEDIAF standards.

Recommendation scoring in `app/utils/recommendation.ts`: weight-based nutrition targets, product match distance, value scoring.

### Auth & Roles

Supabase Auth with `AuthProvider`/`useAuth()` hook. Roles: guest, member, operator, master. `hasAdminAccess()` checks operator/master. User roles stored in `users_roles` Supabase table, profiles in `user_profiles` Prisma table.

### Route Conventions

Route files import types from `./+types/<route>`. Export `meta` with `Route.MetaArgs` and default-export the component. Data fetching is currently client-side via hooks; use `loader`/`action` only if adding server data. Keep route files focused on composition; push logic into hooks/utils.

## Environment Variables

```
VITE_SUPABASE_URL=        # Client-side Supabase URL
VITE_SUPABASE_ANON_KEY=   # Supabase anon public key
DATABASE_URL=             # PostgreSQL connection string (server-side)
```

## Code Conventions

- **Formatting:** double quotes, semicolons, trailing commas, 2-space indent
- **Imports:** `~/*` path alias for app imports. Order: React/Router → external → type-only (`./+types/*`) → side-effects (`./app.css`) → internal (`~/`) → relative. Use `import type` for type-only.
- **Naming:** PascalCase for components/types, camelCase for functions/variables, `is*/has*/should*` for booleans, `*Props` suffix for prop interfaces
- **Error handling:** avoid empty catch blocks, use `{ ok: true; data: T } | { ok: false; error: string }` result pattern
- **Hooks:** state as structured objects for related fields, `useCallback` for child handlers, `useEffect` cleanup with isMounted pattern
- **Styling:** TailwindCSS v4 with CSS variables in `:root` for brand colors (defined in `app/app.css`). Mobile-first, responsive breakpoint at 820px.
- **Testing:** co-locate tests next to modules (`app/**/*.test.ts`), use mock data, no network calls

## Key Files

- `app/utils/calc.ts` — core nutrition calculations (RER, DER, mix plans)
- `app/hooks/useCatalogData.ts` — Supabase data fetching with mock fallback
- `app/hooks/useAuth.tsx` — auth context and role management
- `app/root.tsx` — layout branching by route type
- `prisma/schema.prisma` — complete data model
- `app/data/mock.ts` — mock breeds, products, and type definitions
- `worker.ts` — Cloudflare Workers SSR entry point
