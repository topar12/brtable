export type PriceRollup = {
  currentPrice: number;
  yearMin: number;
  yearMax: number;
};

export function buildPriceRollup(
  currentPrice: number,
  yearMin: number | null,
  yearMax: number | null
): PriceRollup {
  const min = yearMin ?? currentPrice;
  const max = yearMax ?? currentPrice;
  return {
    currentPrice,
    yearMin: Math.min(min, currentPrice),
    yearMax: Math.max(max, currentPrice),
  };
}

export function calculatePricePosition(current: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100));
}

export function pricePositionLabel(position: number): string {
  if (position <= 20) return "저가";
  if (position <= 40) return "중저가";
  if (position <= 60) return "중가";
  if (position <= 80) return "중고가";
  return "고가";
}
