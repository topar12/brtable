create table if not exists sku_price_rollups (
  sku_id text primary key references "ProductSKU"(id) on delete cascade,
  current_price integer not null,
  year_min integer not null,
  year_max integer not null,
  updated_at timestamptz not null default now()
);

create index if not exists sku_price_rollups_sku_idx
  on sku_price_rollups (sku_id);
