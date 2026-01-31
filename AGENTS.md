# Agent Guidelines for 반려식탁 (Pet Dining)

## Build/Test/Lint Commands

```bash
# Development
npm run dev              # Start dev server (Vite + React Router)

# Build
npm run build            # Production build (React Router)
npm run typecheck        # TypeScript type checking

# Testing
npm run test             # Run all tests (Vitest)
npx vitest run <file>    # Run single test file
npx vitest --reporter=verbose  # Verbose test output

# Database
npm run db:migrate       # Prisma migrate dev
npm run db:seed          # Seed database
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio

# Production
npm run start            # Start production server
```

## Tech Stack

- **Framework**: React Router v7 (framework mode, SSR enabled)
- **UI**: React 19, TailwindCSS v4
- **Language**: TypeScript 5.9 (strict mode)
- **Testing**: Vitest (node environment, tests in `app/**/*.test.ts`)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Supabase Auth (Google, Kakao OAuth)
- **Build**: Vite with tsconfig-paths

## Code Style

### Imports
- Use `~/*` path alias for app imports: `import { x } from "~/utils/calc"`
- Group imports: React/Router → External libs → Internal (~/*)
- Use `type` keyword for type imports: `import type { Product } from "~/data/mock"`

### Types & Naming
- PascalCase for types/interfaces/components: `Product`, `PetProfile`
- camelCase for variables/functions: `calculateDer`, `weightKg`
- SCREAMING_SNAKE_CASE for constants: `Species = "DOG" | "CAT"`
- Prefix boolean props with verb: `isNeutered`, `hasAdminAccess`

### Functions
- Use explicit return types for exported utilities
- Prefer pure functions for calculations (see `app/utils/calc.ts`)
- Use early returns to reduce nesting

### Error Handling
- Use React Router's `ErrorBoundary` in routes
- Check for null/undefined before accessing nested properties
- Mock data fallback when Supabase fails (see `useCatalogData.ts`)

### React Patterns
- Use React Router's `loader`/`action` for data fetching
- Custom hooks for reusable logic: `useAuth`, `useStoredProfile`
- Context providers wrap the app in `root.tsx`

### Styling
- TailwindCSS v4 with custom CSS variables in `app/app.css`
- CSS variables: `--ink`, `--muted`, `--accent`, `--card`, `--stroke`
- Mobile-first responsive design (breakpoint at 820px)

### Testing
- Co-locate tests: `utils/recommendation.test.ts` next to `recommendation.ts`
- Use descriptive test names: `it("excludes products with allergens")`
- Mock data in tests, avoid external dependencies

## Project Structure

```
app/
├── routes/           # Route components (React Router)
├── components/       # Shared UI components
├── hooks/           # Custom React hooks
├── utils/           # Pure utility functions
├── data/            # Mock data and types
└── app.css          # Global styles + Tailwind
prisma/
└── schema.prisma    # Database schema
```

## Environment Variables

```bash
VITE_SUPABASE_URL=         # Supabase project URL
VITE_SUPABASE_ANON_KEY=    # Supabase anon key
DATABASE_URL=              # PostgreSQL connection string
```

## Key Conventions

- Routes use `+types` imports: `import type { Route } from "./+types/root"`
- Meta exports for SEO: `export function meta({}: Route.MetaArgs)`
- Korean UI text, English code/comments
- Nutrition calculations use AAFCO/FEDIAF standards
- Allergen filtering is case-sensitive
