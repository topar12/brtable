import { describe, expect, it } from "vitest";
import { buildPriceRollup, calculatePricePosition, pricePositionLabel } from "./priceSnapshots";

describe("buildPriceRollup", () => {
  it("uses current price when no min/max", () => {
    const result = buildPriceRollup(20000, null, null);
    expect(result.currentPrice).toBe(20000);
    expect(result.yearMin).toBe(20000);
    expect(result.yearMax).toBe(20000);
  });

  it("expands range when new price is outside", () => {
    const result = buildPriceRollup(25000, 18000, 22000);
    expect(result.currentPrice).toBe(25000);
    expect(result.yearMin).toBe(18000);
    expect(result.yearMax).toBe(25000);
  });

  it("keeps existing range when new price is inside", () => {
    const result = buildPriceRollup(20000, 15000, 25000);
    expect(result.currentPrice).toBe(20000);
    expect(result.yearMin).toBe(15000);
    expect(result.yearMax).toBe(25000);
  });
});

describe("calculatePricePosition", () => {
  it("returns 50 when min equals max", () => {
    expect(calculatePricePosition(20000, 20000, 20000)).toBe(50);
  });

  it("calculates position within range", () => {
    expect(calculatePricePosition(20000, 15000, 25000)).toBe(50);
    expect(calculatePricePosition(15000, 15000, 25000)).toBe(0);
    expect(calculatePricePosition(25000, 15000, 25000)).toBe(100);
  });

  it("clamps to 0-100 range", () => {
    expect(calculatePricePosition(10000, 15000, 25000)).toBe(0);
    expect(calculatePricePosition(30000, 15000, 25000)).toBe(100);
  });
});

describe("pricePositionLabel", () => {
  it("returns correct labels", () => {
    expect(pricePositionLabel(10)).toBe("저가");
    expect(pricePositionLabel(30)).toBe("중저가");
    expect(pricePositionLabel(50)).toBe("중가");
    expect(pricePositionLabel(70)).toBe("중고가");
    expect(pricePositionLabel(90)).toBe("고가");
  });
});
