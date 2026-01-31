import { describe, expect, it } from "vitest";
import type { PetProfile, Product } from "../data/mock";
import {
  recommendProducts,
  calculateValueScore,
  generateRecommendationReasons,
  scoreProducts,
} from "./recommendation";

const baseSku = { id: "sku-1", sizeKg: 2, currentPrice: 20000, priceHistory: [18000, 19000, 20000, 22000] };

const productA: Product = {
  id: "a",
  species: "DOG",
  brand: "A",
  name: "A",
  protein: 28,
  fat: 15,
  fiber: 3,
  ash: 7,
  moisture: 10,
  kcalPerKg: 3600,
  kcalSource: "OFFICIAL",
  ingredients: [],
  allergens: [],
  skus: [baseSku],
};

const productB: Product = {
  ...productA,
  id: "b",
  brand: "B",
  protein: 24,
  fat: 13,
  skus: [{ ...baseSku, id: "sku-2", currentPrice: 18000, priceHistory: [18000, 18000, 18000] }],
};

const profile: PetProfile = {
  name: "Test",
  species: "DOG",
  breedId: "pomeranian",
  weightKg: 5,
  isNeutered: true,
  activityLevel: 3,
  allergies: [],
};

describe("recommendProducts", () => {
  it("prioritizes nutrition proximity over price", () => {
    const result = recommendProducts([productB, productA], profile);
    expect(result[0].id).toBe("a");
  });

  it("excludes products with allergens", () => {
    const result = recommendProducts(
      [
        { ...productA, allergens: ["닭"] },
        { ...productB, allergens: [] },
      ],
      { ...profile, allergies: ["닭"] },
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });
});

describe("calculateValueScore", () => {
  it("calculates price per 100g correctly", () => {
    const score = calculateValueScore(productA);
    expect(score).toBe(1000);
  });
});

describe("generateRecommendationReasons", () => {
  it("generates reasons for matching protein", () => {
    const reasons = generateRecommendationReasons(productA, profile);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons[0]).toContain("조단백질");
  });

  it("generates fallback reason when no specific matches", () => {
    const minimalProduct: Product = {
      ...productA,
      protein: 20,
      fat: 20,
      fiber: 10,
      allergens: ["닭"],
    };
    const minimalProfile: PetProfile = { ...profile, allergies: ["닭"] };
    const reasons = generateRecommendationReasons(minimalProduct, minimalProfile);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons[0]).toContain("영양");
  });
});

describe("scoreProducts", () => {
  it("scores all products with metadata", () => {
    const scored = scoreProducts([productA, productB], profile);
    expect(scored).toHaveLength(2);
    expect(scored[0].valueScore).toBeDefined();
    expect(scored[0].pricePosition).toBeDefined();
    expect(scored[0].reasons).toBeDefined();
  });

  it("marks unsafe products correctly", () => {
    const unsafeProduct: Product = { ...productA, allergens: ["닭"] };
    const allergicProfile: PetProfile = { ...profile, allergies: ["닭"] };
    const scored = scoreProducts([unsafeProduct], allergicProfile);
    expect(scored[0].isSafe).toBe(false);
  });

  it("calculates price position when history available", () => {
    const scored = scoreProducts([productA], profile);
    expect(scored[0].pricePosition).toBeGreaterThanOrEqual(0);
    expect(scored[0].pricePosition).toBeLessThanOrEqual(100);
    expect(scored[0].pricePositionLabel).toBeDefined();
  });
});
