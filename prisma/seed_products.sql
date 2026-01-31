-- Mock 데이터를 DB에 삽입

-- Product 테이블에 데이터 삽입
INSERT INTO "Product" (id, brand, name, species, crudeprotein, crudefat, crudefiber, crudeash, crudemoisture, caloriesper100g, caloriesestimatedper100g, caloriessource, mainprotein, targetconditions, createdat, updatedat)
VALUES 
('harbor-lamb', '하버', '램앤라이스 밸런스', 'DOG', 26, 14, 3, 7, 10, 368, null, 'OFFICIAL', '양고기', ARRAY['양고기', '쌀', '보리', '연어오일', '해조류'], NOW(), NOW()),
('citrus-duck', '시트러스', '덕 하베스트', 'DOG', 28, 16, 4, 6.5, 9, null, 382, 'ESTIMATED', '오리', ARRAY['오리', '고구마', '완두', '호박', '아마씨'], NOW(), NOW()),
('noon-salmon', '눈', '연어 인도어 케어', 'CAT', 32, 14, 3, 7, 9, 392, null, 'OFFICIAL', '연어', ARRAY['연어', '치킨밀', '호박', '크랜베리'], NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  brand = EXCLUDED.brand,
  name = EXCLUDED.name,
  species = EXCLUDED.species,
  crudeprotein = EXCLUDED.crudeprotein,
  crudefat = EXCLUDED.crudefat,
  crudefiber = EXCLUDED.crudefiber,
  crudeash = EXCLUDED.crudeash,
  crudemoisture = EXCLUDED.crudemoisture,
  caloriesper100g = EXCLUDED.caloriesper100g,
  caloriesestimatedper100g = EXCLUDED.caloriesestimatedper100g,
  caloriessource = EXCLUDED.caloriessource,
  mainprotein = EXCLUDED.mainprotein,
  targetconditions = EXCLUDED.targetconditions,
  updatedat = NOW();

-- ProductSKU 테이블에 데이터 삽입
INSERT INTO "ProductSKU" (id, productid, weight, price, createdat, updatedat)
VALUES 
('harbor-lamb-2', 'harbor-lamb', 2, 28000, NOW(), NOW()),
('harbor-lamb-6', 'harbor-lamb', 6, 72000, NOW(), NOW()),
('citrus-duck-2', 'citrus-duck', 2, 32000, NOW(), NOW()),
('noon-salmon-1.5', 'noon-salmon', 1.5, 26000, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  productid = EXCLUDED.productid,
  weight = EXCLUDED.weight,
  price = EXCLUDED.price,
  updatedat = NOW();

-- sku_price_rollups 테이블에 데이터 삽입
INSERT INTO sku_price_rollups (sku_id, current_price, year_min, year_max, updated_at)
VALUES 
('harbor-lamb-2', 28000, 24000, 28000, NOW()),
('harbor-lamb-6', 72000, 68000, 73000, NOW()),
('citrus-duck-2', 32000, 30000, 33500, NOW()),
('noon-salmon-1.5', 26000, 23000, 27000, NOW())
ON CONFLICT (sku_id) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  year_min = EXCLUDED.year_min,
  year_max = EXCLUDED.year_max,
  updated_at = NOW();
