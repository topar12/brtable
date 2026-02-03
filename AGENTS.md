# AGENTS.md - Repo Guide for Agents

This file describes how to build, test, and follow code conventions in this repo.
Keep changes small, match existing patterns, and avoid adding new deps unless needed.

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
- Use `import type` for type-only imports.
- Keep import order: React/Router, external libs, internal modules, relative paths.
- Keep side-effect imports (if any) last.
- React Router route files import `Route` from `./+types/<route>`.

## Formatting & File Style
- Use double quotes for strings and imports.
- Use semicolons.
- Keep trailing commas in multiline objects/arrays/params.
- Two-space indentation is used throughout the repo.
- Prefer `const`; use `let` only when reassigned.
- Keep files small and focused; avoid mixing data fetching with UI composition.

## Naming & Types
- Components/types: PascalCase (`ProductCard`, `UserProfile`).
- Functions/variables: camelCase (`calculateDer`, `pricePosition`).
- Boolean names: `is*`, `has*`, `should*`.
- Exported utilities: use explicit return types when non-trivial.
- Prefer precise types over `any`; use type guards for external data.
- Keep union types small and named if reused.

## React Router Patterns
- Use `loader`/`action` for data work in routes.
- `ErrorBoundary` is defined in `app/root.tsx`; follow that pattern.
- Keep route files focused on composition, put logic in hooks/utils.
- Route files typically default-export the component.
- `meta` exports use `Route.MetaArgs` from the `+types` file.

## State, Data, and Errors
- Supabase data fetches should fall back to mock data if missing config.
- Validate external data (see `app/hooks/useCatalogData.ts`).
- Prefer early returns to reduce nesting.
- Avoid empty catch blocks; surface meaningful errors.
- Use `getSupabaseClient()` and `hasSupabaseConfig()` from `app/utils/supabase.ts`.
- Normalize Supabase rows with explicit type guards before use.
- Keep error objects consistent (`{ error: string }` or `Error`).

## Styling Conventions
- TailwindCSS v4 is used across the app.
- Global tokens and component styles live in `app/app.css`.
- Use CSS variables defined in `:root` for brand colors.
- Admin UI styling is defined in `app/app.css` under the admin section.
- Mobile-first layout; responsive breakpoint at `820px` in CSS.

## Testing Conventions
- Tests live in `app/**/*.test.ts`.
- Co-locate tests next to the module they cover.
- Use descriptive test names; avoid network calls.
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
- Some views are mock-only; avoid adding real network calls to UI unless asked.

## Cursor / Copilot Rules
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## When Adding New Code
- Follow existing patterns and file locations.
- Keep diffs small; avoid refactors in bugfixes.
- If you add new commands, update `package.json` scripts and this file.
