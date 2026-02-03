import { useEffect, useState } from "react";

import {
  breeds as mockBreeds,
  type Breed,
  type Product,
  type ProductSku,
  products as mockProducts,
} from "../data/mock";
import { getSupabaseClient, hasSupabaseConfig } from "../utils/supabase";
import { buildPriceRollup, calculatePricePosition } from "../utils/priceSnapshots";

type DataSource = "supabase" | "mock";

type CatalogState = {
  breeds: Breed[];
  products: Product[];
  source: DataSource;
  loading: boolean;
  error: string | null;
};

const fallbackState: CatalogState = {
  breeds: mockBreeds,
  products: mockProducts,
  source: "mock",
  loading: false,
  error: null,
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function toNumber(value: unknown) {
  if (isNumber(value)) return value;
  if (isString(value) && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function toStringArray(value: unknown) {
  if (Array.isArray(value) && value.every(isString)) return value;
  if (isString(value)) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return null;
}

type NormalizedSku = {
  id: string;
  productId: string;
  sizeKg: number;
  basePrice: number;
};

type PriceRollupRow = {
  skuId: string;
  currentPrice: number;
  yearMin: number | null;
  yearMax: number | null;
};

function normalizeSkuRow(value: unknown): NormalizedSku | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = row.id;
  const productId = row.productid ?? row.productId ?? row.product_id;
  const weight = toNumber(row.weight);
  const price = toNumber(row.price);
  if (!isString(id) || !isString(productId) || weight === null || price === null) {
    return null;
  }
  return {
    id,
    productId,
    sizeKg: weight,
    basePrice: price,
  };
}

function normalizePriceRollupRow(value: unknown): PriceRollupRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const skuId = row.sku_id ?? row.skuId ?? row.skuid;
  const currentPrice = toNumber(row.current_price ?? row.currentPrice);
  const yearMin = toNumber(row.year_min ?? row.yearMin);
  const yearMax = toNumber(row.year_max ?? row.yearMax);
  if (!isString(skuId) || currentPrice === null) return null;
  return {
    skuId,
    currentPrice,
    yearMin,
    yearMax,
  };
}

function normalizeProductRow(
  value: unknown,
  skuMap: Map<string, ProductSku[]>,
): Product | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = row.id;
  const brand = row.brand;
  const name = row.name;
  const species = row.species === "CAT" ? "CAT" : "DOG";
  const protein = toNumber(row.crudeprotein ?? row.crudeProtein);
  const fat = toNumber(row.crudefat ?? row.crudeFat);
  const fiber = toNumber(row.crudefiber ?? row.crudeFiber);
  const ash = toNumber(row.crudeash ?? row.crudeAsh);
  const moisture = toNumber(row.crudemoisture ?? row.crudeMoisture);
  const kcalPer100g =
    toNumber(row.caloriesper100g ?? row.caloriesPer100g) ?? toNumber(row.caloriesestimatedper100g ?? row.caloriesEstimatedPer100g);
  const kcalPerKg = kcalPer100g === null ? null : Math.round(kcalPer100g * 10);
  const caloriesSourceVal = row.caloriessource ?? row.caloriesSource;
  const kcalSource = isString(caloriesSourceVal)
    ? caloriesSourceVal.toUpperCase() === "OFFICIAL"
      ? "OFFICIAL"
      : "ESTIMATED"
    : "ESTIMATED";
  const mainProteinVal = row.mainprotein ?? row.mainProtein;
  const mainProtein = isString(mainProteinVal) ? mainProteinVal : null;
  const targetConditions = toStringArray(row.targetconditions ?? row.targetConditions) ?? [];
  const imageVal = row.image;
  const image = isString(imageVal) ? imageVal : undefined;
  const skus = skuMap.get(String(id)) ?? [];
  if (!isString(id) || !isString(brand) || !isString(name)) return null;
  if (
    protein === null ||
    fat === null ||
    fiber === null ||
    ash === null ||
    moisture === null ||
    kcalPerKg === null
  ) {
    return null;
  }
  if (!skus.length) {
    skus.push({
      id: `${id}-base`,
      sizeKg: 1,
      currentPrice: 0,
      priceHistory: [0],
    });
  }
  return {
    id,
    species,
    brand,
    name,
    protein,
    fat,
    fiber,
    ash,
    moisture,
    kcalPerKg,
    kcalSource,
    ingredients: targetConditions,
    allergens: mainProtein ? [mainProtein] : [],
    skus,
    image,
  };
}

function normalizeBreedRow(value: unknown): Breed | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = row.slug ?? row.id;
  const name = row.name_ko ?? row.name_en;
  if (!isString(id) || !isString(name)) return null;
  return {
    id,
    species: "DOG",
    name,
    size: "Medium",
    weightRangeKg: [3, 5],
    activityTendency: "일반 활동",
  };
}

export function useCatalogData() {
  const [state, setState] = useState<CatalogState>({
    ...fallbackState,
    loading: true,
  });

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setState({
        ...fallbackState,
        loading: false,
        error: hasSupabaseConfig()
          ? "Supabase 설정은 있지만 클라이언트를 만들 수 없어요."
          : "Supabase 설정이 없어 Mock 데이터로 표시 중입니다.",
      });
      return;
    }
    const supabase = client;

    let alive = true;

    async function load() {
      try {
        const [breedResult, productResult, skuResult] = await Promise.all([
          supabase.from("dog_breeds").select("*").limit(1000),
          supabase.from("Product").select("*").limit(1000),
          supabase.from("ProductSKU").select("*").limit(2000),
        ]);

        if (breedResult.error || productResult.error || skuResult.error) {
          throw new Error(
            breedResult.error?.message ||
            productResult.error?.message ||
            skuResult.error?.message,
          );
        }

        const breedRows = Array.isArray(breedResult.data)
          ? (breedResult.data as unknown[])
          : [];
        const productRows = Array.isArray(productResult.data)
          ? (productResult.data as unknown[])
          : [];
        const skuRows = Array.isArray(skuResult.data)
          ? (skuResult.data as unknown[])
          : [];

        const normalizedSkus = skuRows
          .map((row) => normalizeSkuRow(row))
          .filter((row): row is NormalizedSku => row !== null);

        const skuMap: Map<string, ProductSku[]> = new Map();
        const rollupMap: Map<string, { currentPrice: number; yearMin: number; yearMax: number }> = new Map();

        if (normalizedSkus.length) {
          const skuIds = normalizedSkus.map((sku) => sku.id);
          const rollupResult = await supabase
            .from("sku_price_rollups")
            .select("sku_id,current_price,year_min,year_max")
            .in("sku_id", skuIds);

          if (!rollupResult.error && Array.isArray(rollupResult.data)) {
            rollupResult.data
              .map((row) => normalizePriceRollupRow(row))
              .filter((row): row is PriceRollupRow => row !== null)
              .forEach((row) => {
                const rollup = buildPriceRollup(row.currentPrice, row.yearMin, row.yearMax);
                rollupMap.set(row.skuId, rollup);
              });
          }
        }

        normalizedSkus.forEach((sku) => {
          const rollup = rollupMap.get(sku.id);
          const currentPrice = rollup?.currentPrice ?? sku.basePrice;
          const yearMin = rollup?.yearMin ?? currentPrice;
          const yearMax = rollup?.yearMax ?? currentPrice;

          const existing = skuMap.get(sku.productId) ?? [];
          existing.push({
            id: sku.id,
            sizeKg: sku.sizeKg,
            currentPrice,
            priceHistory: [yearMin, currentPrice, yearMax],
          });
          skuMap.set(sku.productId, existing);
        });

        const nextBreeds = [
          ...breedRows
            .map((item) => normalizeBreedRow(item))
            .filter((item): item is Breed => item !== null),
          // Fallback for CAT breeds since table is missing
          ...mockBreeds.filter(b => b.species === "CAT")
        ];
        const nextProducts = productRows
          .map((item) => normalizeProductRow(item, skuMap))
          .filter((item): item is Product => item !== null);

        console.log("Supabase 데이터 로드:", {
          breeds: nextBreeds.length,
          products: nextProducts.length,
          skus: skuRows.length
        });

        if (!alive) return;

        setState({
          breeds: nextBreeds,
          products: nextProducts,
          source: "supabase",
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!alive) return;
        setState({
          ...fallbackState,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Supabase 연결에 실패했어요.",
        });
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
