import type { Product } from "../data/mock";

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateNfe(
  protein: number,
  fat: number,
  fiber: number,
  ash: number,
  moisture: number,
) {
  const nfe = 100 - (protein + fat + fiber + ash + moisture);
  return Math.max(0, nfe);
}

export function estimateKcalPerKg(
  protein: number,
  fat: number,
  fiber: number,
  ash: number,
  moisture: number,
) {
  const nfe = calculateNfe(protein, fat, fiber, ash, moisture);
  const kcalPer100g = protein * 3.5 + fat * 8.5 + nfe * 3.5;
  return Math.round(kcalPer100g * 10);
}

export function calculateRer(weightKg: number) {
  return 70 * Math.pow(weightKg, 0.75);
}

export function activityFactor(level: number, isNeutered: boolean) {
  const base = isNeutered ? 1.2 : 1.4;
  const map = [0.9, 1.0, 1.15, 1.3, 1.5];
  const idx = clamp(level, 1, 5) - 1;
  return base * map[idx];
}

export function calculateDer(weightKg: number, level: number, isNeutered: boolean) {
  const rer = calculateRer(weightKg);
  return rer * activityFactor(level, isNeutered);
}

export function calculateDailyGrams(derKcal: number, kcalPerKg: number) {
  if (!kcalPerKg) return 0;
  return (derKcal / kcalPerKg) * 1000;
}

export function pricePosition(current: number, history: number[]) {
  if (!history.length) return 50;
  const min = Math.min(...history, current);
  const max = Math.max(...history, current);
  if (max === min) return 50;
  return clamp(((current - min) / (max - min)) * 100, 0, 100);
}

export function mixPlan(
  derKcal: number,
  productA: Product,
  productB: Product,
  ratioA: number,
) {
  const ratio = clamp(ratioA, 0, 1);
  const kcalA = derKcal * ratio;
  const kcalB = derKcal * (1 - ratio);
  return {
    kcalA,
    kcalB,
    gramsA: calculateDailyGrams(kcalA, productA.kcalPerKg),
    gramsB: calculateDailyGrams(kcalB, productB.kcalPerKg),
  };
}
