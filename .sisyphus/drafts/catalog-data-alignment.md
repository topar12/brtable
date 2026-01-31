# Draft: Catalog Data Tasks (Price/Tags/Schema)

## Requirements (confirmed)
- User wants plan for tasks 1-3 only:
  - price snapshot/price position aggregation
  - recommendation + allergy tag mapping
  - Supabase schema/column alignment
- App context: React Router app
- Data access: `app/hooks/useCatalogData.ts`
- Mock data: `app/data/mock.ts`
- Price utilities: `app/utils/calc.ts` (`pricePosition`)
- Admin UI: `app/routes/admin.tsx` and `app/utils/adminData.ts`
- Prisma schema: `prisma/schema.prisma`
- Supabase table/column expectations: `README.md`

## Technical Decisions
- Price position currently computed from `currentPrice` + `priceHistory` (calc: `app/utils/calc.ts`).
- Supabase normalization currently builds `priceHistory` as `[price]` (single snapshot) in `app/hooks/useCatalogData.ts`.
- Allergy filtering currently uses `product.allergens` vs `profile.allergies` (see `app/routes/products.tsx`, `app/routes/products.$id.tsx`).
- Allergy options are fixed in onboarding UI: `app/routes/onboarding.tsx`.

## Research Findings
- `guide.md` defines price snapshots, allergy tag mapping, and price position formula; indicates SKU price snapshot management for admins.
- Prisma schema uses lower-case/underscored field names (`prisma/schema.prisma`).
- Supabase README lists camelCase column names and table names: `Product`, `ProductSKU`, `dog_breeds`.

## Open Questions
- Test strategy: add test infrastructure or use manual verification only?

## Scope Boundaries
- INCLUDE: price snapshot aggregation feeding pricePosition; tag mapping for recommendations/allergies; Supabase column alignment with Prisma/README.
- EXCLUDE: new UI beyond current flows; production auth/roles; price crawling automation.
