import type { PetProfile, Product } from "../data/mock";
import { calculatePricePosition } from "./priceSnapshots";

type NutritionTarget = {
  protein: number;
  fat: number;
  fiber: number;
  ash: number;
  moisture: number;
};

const weightTargets: Array<{ min: number; max: number; target: NutritionTarget }> = [
  {
    min: 0,
    max: 7,
    target: { protein: 28, fat: 15, fiber: 3, ash: 7, moisture: 10 },
  },
  {
    min: 7,
    max: 18,
    target: { protein: 26, fat: 14, fiber: 3, ash: 7, moisture: 10 },
  },
  {
    min: 18,
    max: Number.POSITIVE_INFINITY,
    target: { protein: 24, fat: 13, fiber: 3, ash: 7, moisture: 10 },
  },
];

export function getNutritionTarget(weightKg: number) {
  const target = weightTargets.find((item) => weightKg >= item.min && weightKg < item.max);
  return target?.target ?? weightTargets[1].target;
}

export function nutritionDistance(product: Product, target: NutritionTarget) {
  return (
    Math.abs(product.protein - target.protein) +
    Math.abs(product.fat - target.fat) +
    Math.abs(product.fiber - target.fiber) +
    Math.abs(product.ash - target.ash) +
    Math.abs(product.moisture - target.moisture)
  );
}

export function calculateValueScore(product: Product): number {
  const sku = product.skus[0];
  if (!sku) return 0;
  const pricePer100g = (sku.currentPrice / sku.sizeKg) / 10;
  return Math.round(pricePer100g);
}

export type NutritionMatch = {
  protein: { actual: number; target: number; diff: number };
  fat: { actual: number; target: number; diff: number };
  fiber: { actual: number; target: number; diff: number };
};

export function getNutritionMatch(product: Product, target: NutritionTarget): NutritionMatch {
  return {
    protein: {
      actual: product.protein,
      target: target.protein,
      diff: product.protein - target.protein,
    },
    fat: {
      actual: product.fat,
      target: target.fat,
      diff: product.fat - target.fat,
    },
    fiber: {
      actual: product.fiber,
      target: target.fiber,
      diff: product.fiber - target.fiber,
    },
  };
}

export function generateRecommendationReasons(
  product: Product,
  profile: PetProfile
): string[] {
  const target = getNutritionTarget(profile.weightKg);
  const match = getNutritionMatch(product, target);
  const reasons: string[] = [];

  const proteinDiff = Math.abs(match.protein.diff);
  const fatDiff = Math.abs(match.fat.diff);

  if (proteinDiff <= 2) {
    reasons.push(`조단백질이 ${profile.weightKg < 7 ? "소형견" : profile.weightKg < 18 ? "중형견" : "대형견"} 기준(${target.protein}%)에 가까워요`);
  } else if (match.protein.diff > 0) {
    reasons.push(`조단백질이 기준보다 ${match.protein.diff.toFixed(1)}% 높아 활발한 아이에게 적합해요`);
  }

  if (fatDiff <= 2) {
    reasons.push(`조지방이 적정 범위(${target.fat}%) 내에 있어요`);
  } else if (match.fat.diff < 0) {
    reasons.push(`저지방(${product.fat}%)으로 체중 관리에 도움돼요`);
  }

  if (product.fiber >= 3 && product.fiber <= 5) {
    reasons.push("조섬유가 적절해 소화 건강을 지원해요");
  }

  if (profile.allergies.length > 0) {
    const safeAllergens = profile.allergies.filter(
      (allergy) => !product.allergens.includes(allergy)
    );
    if (safeAllergens.length === profile.allergies.length) {
      reasons.push(`알러지 유발 성분(${profile.allergies.join(", ")})이 없어요`);
    }
  }

  if (reasons.length === 0) {
    reasons.push("영양 균형이 잘 잡힌 사료예요");
  }

  return reasons.slice(0, 3);
}

export interface ScoredProduct {
  product: Product;
  nutritionDistance: number;
  valueScore: number;
  pricePosition: number;
  pricePositionLabel: string;
  reasons: string[];
  isSafe: boolean;
}

export function scoreProducts(
  products: Product[],
  profile: PetProfile
): ScoredProduct[] {
  const target = getNutritionTarget(profile.weightKg);
  const excluded = profile.allergies;

  return products.map((product) => {
    const isSafe =
      excluded.length === 0 ||
      !product.allergens.some((allergen) => excluded.includes(allergen));

    const distance = nutritionDistance(product, target);
    const valueScore = calculateValueScore(product);

    const sku = product.skus[0];
    let pricePosition = 50;
    let pricePositionLabel = "중가";

    if (sku && sku.priceHistory.length >= 3) {
      const min = sku.priceHistory[0];
      const max = sku.priceHistory[sku.priceHistory.length - 1];
      pricePosition = calculatePricePosition(sku.currentPrice, min, max);
      pricePositionLabel =
        pricePosition <= 20
          ? "저가"
          : pricePosition <= 40
          ? "중저가"
          : pricePosition <= 60
          ? "중가"
          : pricePosition <= 80
          ? "중고가"
          : "고가";
    }

    const reasons = isSafe ? generateRecommendationReasons(product, profile) : [];

    return {
      product,
      nutritionDistance: distance,
      valueScore,
      pricePosition,
      pricePositionLabel,
      reasons,
      isSafe,
    };
  });
}

export function recommendProductsWithScore(
  products: Product[],
  profile: PetProfile
): ScoredProduct[] {
  const scored = scoreProducts(products, profile);
  const safeProducts = scored.filter((item) => item.isSafe);

  if (!safeProducts.length) {
    return scored.sort((a, b) => a.nutritionDistance - b.nutritionDistance).slice(0, 5);
  }

  return safeProducts.sort((a, b) => {
    if (a.nutritionDistance !== b.nutritionDistance) {
      return a.nutritionDistance - b.nutritionDistance;
    }
    return a.pricePosition - b.pricePosition;
  });
}

export function recommendProducts(products: Product[], profile: PetProfile): Product[] {
  return recommendProductsWithScore(products, profile).map((item) => item.product);
}
