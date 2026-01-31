# Draft: Admin DB Management

## Requirements (confirmed)
- Focus on feature implementation; admin must manage DB.
- Default DB stack decided by us.
- Use Supabase REST as default (align with useCatalogData + env).
- Prisma is a secondary reference for schema alignment.
- Primary admin entities: Product, ProductSKU, dog_breeds.
- DB fill can be slow/batch.
- Handle schema mismatch (camelCase vs lower/snake).
- Need updated parallel graph, TODO list with category+skills, verification plan.

## Technical Decisions
- Default data layer: Supabase REST (runtime reads/writes).
- Schema reference: Prisma schema (field definitions/types).
- Admin features: CRUD + bulk ops + import/export + slow fill.
- Safety: role gating + confirmation for destructive actions.

## Research Findings
- Repo context: React Router + Vite + Tailwind; Supabase hook and Prisma schema exist; mock data exists.

## Open Questions
- Actual DB column naming convention for admin CRUD (snake_case vs camelCase vs mixed).

## Scope Boundaries
- INCLUDE: Admin UI + DB management for Product, ProductSKU, dog_breeds.
- EXCLUDE: Non-admin user features; DB stack migration.
