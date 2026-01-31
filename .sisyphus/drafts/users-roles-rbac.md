# Draft: users_roles RBAC implementation (반려식탁)

## Requirements (confirmed)
- Implement a complete roles system backed by a `users_roles` table.
- Roles: `master`, `operator`, `member`, `guest`.
- Access helpers:
  - `hasAdminAccess()` = `master || operator`
  - `hasMasterAccess()` = `master` only
- Current code already queries `users_roles` via Supabase client:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/app/utils/supabase.ts`
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/app/hooks/useAuth.tsx`
- Prisma schema currently lacks `users_roles`:
  - `/mnt/c/Users/JH/Desktop/All/Projects/01_animal/prisma/schema.prisma`
- Need:
  1) Add table model to Prisma schema
  2) Create/run migration
  3) Seed or manual insert for first master account
  4) Verify role checks work end-to-end

## Requirements (confirmed) - Follow-up decision
- Query path: keep client-side Supabase query (`.from("users_roles")`) and implement RLS/policies so authenticated users can only SELECT their own row.
- `guest` remains app-only (not stored in DB).

## Technical Decisions (tentative)
- Table likely lives in `public.users_roles` (queried by Supabase PostgREST as `users_roles`).
- Minimal row shape inferred from code:
  - `user_id` (Supabase auth user UUID string)
  - `role` (string union values above)
- Default behavior in app today:
  - If query returns no row, role defaults to `member`.
  - Auth context defaults to `guest` when signed out.

## Technical Decisions (tentative) - RLS
- Enable RLS on `public.users_roles`.
- Add SELECT policy: allow `authenticated` to select rows where `auth.uid() = user_id`.
- Keep INSERT/UPDATE/DELETE locked down by default (no client write), relying on existing trigger for initial row creation.

## Research Findings
- Pending: explore agent on codebase patterns.
- Pending: librarian agent on Supabase+Prisma best practices.

## Open Questions
- Should a user have exactly one role (1 row per user) or multiple roles (many-to-many)?
- Do we need Row Level Security (RLS) + policies so authenticated users can read their own role from the browser?
- Should `guest` be stored in DB at all, or remain an app-only default for signed-out users?
- How should the first `master` be provisioned:
  - by email lookup to `auth.users`,
  - by inserting by known UUID,
  - or via Supabase dashboard/SQL editor instructions?

## Scope Boundaries
- INCLUDE: `users_roles` table + migration + bootstrap master + verification plan.
- EXCLUDE (unless requested): full admin UI for role management, complex permission matrix beyond 4 roles.
