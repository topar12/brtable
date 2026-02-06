# AGENTS.md - Repo Guide for Agents

This file describes how to build, test, and follow code conventions in this repo.
Keep changes small, match existing patterns, and avoid new deps unless needed.

## Quick Stack Facts
- Framework: React Router v7 (framework mode, SSR)
- UI: React 19 + TailwindCSS v4
- Language: TypeScript 5.9, strict mode
- Testing: Vitest (node environment)
- Database: PostgreSQL + Prisma
- Auth: Supabase Auth (Google, Kakao OAuth)
- Deployment: Cloudflare Workers (Wrangler)

## Commands (npm)

```bash
# Dev
npm run dev                # react-router dev

# Build
npm run build              # react-router build

# Typecheck
npm run typecheck          # react-router typegen && tsc

# Tests
npm run test               # vitest (runs all tests)
npx vitest run <file>      # run a single test file
npx vitest run <file> -t "name"  # run a single test by name
npx vitest --reporter=verbose

# Database
npm run db:migrate         # prisma migrate dev
npm run db:seed            # prisma db seed
npx prisma generate        # generate Prisma client
npx prisma studio          # Prisma Studio

# Production
npm run start              # react-router-serve ./build/server/index.js
npm run preview            # build + wrangler dev
npm run deploy             # build + wrangler deploy
```

Notes
- No lint script or ESLint config exists in this repo.
- Vitest config: `vitest.config.ts` uses `environment: "node"` and `include: ["app/**/*.test.ts"]`.
- Vite config: `vite.config.ts`; React Router config: `react-router.config.ts`.

## Project Structure

```
app/
  components/        # Shared UI components
  components/admin/  # Admin UI components
  data/              # Mock data and types
  hooks/             # Custom React hooks
  routes/            # React Router routes
  utils/             # Pure utility functions
  app.css            # Tailwind + global styles
prisma/
  schema.prisma      # Prisma schema
```

## TypeScript & Imports
- TS strict mode is enabled (see `tsconfig.json`).
- Use `~/*` path alias for app imports when reasonable.
- Prefer named imports; avoid default imports from React Router.
- Use `import type` for type-only imports.
- Keep import order in this sequence:
  1) React/Router framework imports
  2) External libraries
  3) Type-only imports (often from `./+types/*`)
  4) Side-effect imports (e.g., `./app.css`)
  5) Internal modules (`~/`, `./hooks`, `./utils`)
  6) Relative paths last
- Keep imports grouped; blank line between groups.

## Formatting & File Style
- Use double quotes for strings and imports.
- Use semicolons.
- Keep trailing commas in multiline objects/arrays/params.
- Two-space indentation is used throughout the repo.
- Prefer `const`; use `let` only when reassigned.
- Keep files small and focused; move logic to hooks/utils.

## Naming & Types
- Components/types: PascalCase (`ProductCard`, `UserProfile`).
- Functions/variables: camelCase (`calculateDer`, `pricePosition`).
- Boolean names: `is*`, `has*`, `should*`.
- Props interfaces use `Props` suffix (`ProductImageProps`).
- Prefer `export type` for unions/simple objects, `export interface` for complex shapes.
- Use explicit return types for non-trivial exported functions.
- Use type guards for external data (Supabase, `unknown`).
- Keep union types small and named if reused.

## React Router Patterns
- Route files import `Route` from `./+types/<route>`.
- Export `meta` using `Route.MetaArgs` and return an array of meta tags.
- Default-export the route component.
- Data fetching is currently client-side via hooks; use `loader`/`action` only if adding server data.
- `ErrorBoundary` is defined in `app/root.tsx`; follow that structure.
- Keep route files focused on composition; push logic into hooks/utils.

## State, Data, and Errors
- Supabase fetches should fall back to mock data if config is missing.
- Use `getSupabaseClient()` and `hasSupabaseConfig()` from `app/utils/supabase.ts`.
- Normalize Supabase rows with explicit type guards before use.
- Prefer early returns to reduce nesting.
- Avoid empty catch blocks; surface meaningful errors.
- Keep error objects consistent (`{ error: string }` or `Error`).
- Result pattern is common: `{ ok: true; data: T } | { ok: false; error: string }`.

## Hooks and Effects
- Keep state as a structured object when related fields are updated together.
- Use `useCallback` for handlers passed to children.
- Use `useEffect` cleanup for async work (isMounted pattern is used).
- Avoid setting state after unmount.

## Styling Conventions
- TailwindCSS v4 is used across the app.
- Global tokens and component styles live in `app/app.css`.
- Use CSS variables defined in `:root` for brand colors.
- Admin UI styling is defined in `app/app.css` under the admin section.
- Mobile-first layout; responsive breakpoint at `820px` in CSS.

## Testing Conventions
- Tests live in `app/**/*.test.ts`.
- Co-locate tests next to the module they cover.
- Use Vitest `describe`/`it` with `expect`.
- Avoid network calls; use mock data.
- Example single test: `npx vitest run app/utils/recommendation.test.ts`.
- Default test environment is `node` (see `vitest.config.ts`).

## Build and Runtime Notes
- SSR build uses `worker.ts` as the entry point (see `vite.config.ts`).
- Production server uses `react-router-serve` on `./build/server/index.js`.
- Wrangler deploy uses `./build/client` for assets.

## Environment Variables

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
DATABASE_URL=
```

## Repo-Specific Notes
- UI text is primarily Korean; code and comments are in English.
- Nutrition logic references AAFCO/FEDIAF standards.
- Some views are mock-only; avoid adding real network calls unless asked.

## Cursor / Copilot Rules
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## When Adding New Code
- Follow existing patterns and file locations.
- Keep diffs small; avoid refactors in bugfixes.
- If you add new commands, update `package.json` scripts and this file.
- If you add new env vars, document them here.
