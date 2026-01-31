# Draft: Admin CRUD (products/skus/breeds/imports)

## Requirements (confirmed)
- Restore admin CRUD UI that was removed when `admin.tsx` became a layout-only route.
- Implement pages:
  - `/admin/products`: list + add/edit/delete Products; fields: id, brand, name, nutrition (crudeProtein/crudeFat/crudeFiber/crudeAsh/crudeMoisture), calories, imageUrl (representative), mainProtein, targetTags.
  - `/admin/skus`: list + add/edit/delete SKUs; fields: id, productId, weight(kg), price, image, purchaseLink.
  - `/admin/breeds`: list + add/edit/delete breeds; fields: id, slug, name_ko, name_en, aliases, popularity_rank, is_mixed, is_unknown.
  - `/admin/imports`: JSON/CSV import/export + batch insert.
- Tech: React Router v7 (framework mode/SSR), Supabase via `app/utils/adminData.ts`, TypeScript, TailwindCSS.
- UI building blocks needed: data table (sortable + selectable), form fields, modal or inline edit, delete confirmation dialog.

## Known Existing Utilities
- `app/utils/adminData.ts`: generic CRUD helpers (`fetchAll`, `createRow`, `updateRow`, `deleteRow`, `batchInsert`, CSV/JSON parse/export helpers).
- `app/utils/supabase.ts`: `getSupabaseClient()` and role helpers (admin access).

## Research Findings
- Supabase tables are referenced in-app as: `Product`, `ProductSKU`, `dog_breeds`.
- `prisma/schema.prisma` suggests actual column names are mostly snake_case/lowercase:
  - `Product`: `id`, `brand`, `name`, `mainprotein`, `crudeprotein`, `crudefat`, `crudefiber`, `crudeash`, `crudemoisture`, `caloriesper100g`, `caloriesestimatedper100g`, `caloriessource`, `targetconditions` (String[]), `image`.
  - `ProductSKU`: `id`, `productid`, `weight`, `price`, `image`, `purchaselink`.
  - `dog_breeds`: `id` (BigInt), `slug`, `name_ko`, `name_en`, `aliases` (String[]), `popularity_rank`, `is_mixed`, `is_unknown`.
- Existing storefront uses `resolveProductImage(product.image, sku.image)`; so admin "대표 이미지 URL" likely maps to `Product.image`.

## Scope Boundaries
- INCLUDE: admin UI + wiring to existing Supabase CRUD helpers.
- EXCLUDE (for now): schema migrations, changing DB tables/columns, non-admin product browsing UX.

## Open Questions
- Confirm Supabase schema matches `prisma/schema.prisma` (table + column names + types), especially array fields (`targetconditions`, `aliases`).
- Editing UX preference: modal vs inline; bulk delete vs single-row only.
- Import behavior: upsert vs insert-only; conflict key (id/slug) and validation rules.
- Test strategy: add Vitest unit tests for parsers/mappers + (optional) Playwright-like UI checks, or manual-only?

## Decisions (pending)
- Data modeling: how to map requested Korean labels ("타깃태그") to existing `targetConditions`/`targetTags` columns.
- Calories field: which of `caloriesPer100g` vs `caloriesEstimatedPer100g` is canonical.
