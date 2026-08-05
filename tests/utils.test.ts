import { expect, test, describe } from "vitest";
import {
  normalizeToPaycheque,
  calculatePaychequesNeeded,
  calculateSuggestedPurchaseDate,
} from "../src/core/utils";

describe("normalizeToPaycheque", () => {
  test("same frequency is identity", () => {
    expect(normalizeToPaycheque(100, "weekly", "weekly")).toBe(100);
    expect(normalizeToPaycheque(100, "monthly", "monthly")).toBe(100);
  });

  test("weekly -> biweekly", () => {
    expect(normalizeToPaycheque(100, "weekly", "biweekly")).toBeCloseTo(200);
  });

  test("weekly -> monthly", () => {
    expect(normalizeToPaycheque(100, "weekly", "monthly")).toBeCloseTo(
      (100 * 52) / 12,
    );
  });

  test("weekly -> yearly", () => {
    expect(normalizeToPaycheque(100, "weekly", "yearly")).toBe(5200);
  });

  test("biweekly -> weekly", () => {
    expect(normalizeToPaycheque(200, "biweekly", "weekly")).toBeCloseTo(100);
  });

  test("monthly -> monthly", () => {
    expect(normalizeToPaycheque(1200, "yearly", "monthly")).toBe(100);
  });

  test("unknown source frequency yields 0 when target is known", () => {
    // annualAmount stays 0; only unknown *target* hits the amount fallback
    expect(normalizeToPaycheque(100, "daily", "weekly")).toBe(0);
  });

  test("unknown target frequency falls back to original amount", () => {
    expect(normalizeToPaycheque(100, "weekly", "daily")).toBe(100);
  });
});

describe("calculatePaychequesNeeded", () => {
  test("no shortfall -> 0", () => {
    expect(calculatePaychequesNeeded(1000, 1000, 50)).toBe(0);
    expect(calculatePaychequesNeeded(1000, 1500, 50)).toBe(0);
  });

  test("FCF ≤ 0 with shortfall -> Infinity", () => {
    expect(calculatePaychequesNeeded(5000, 1000, 0)).toBe(Infinity);
    expect(calculatePaychequesNeeded(5000, 1000, -10)).toBe(Infinity);
  });

  test("exact division", () => {
    expect(calculatePaychequesNeeded(5000, 3000, 200)).toBe(10);
  });

  test("ceil partial paycheque", () => {
    expect(calculatePaychequesNeeded(101, 0, 50)).toBe(3);
  });
});

describe("calculateSuggestedPurchaseDate", () => {
  const from = new Date("2026-08-01T12:00:00.000Z");

  test("0 paycheques → fromDate", () => {
    expect(calculateSuggestedPurchaseDate(0, "weekly", from)).toEqual(from);
  });

  test("Infinity paycheques -> fromDate", () => {
    expect(calculateSuggestedPurchaseDate(Infinity, "weekly", from)).toEqual(
      from,
    );
  });

  test("weekly adds 7 days per paycheque", () => {
    const result = calculateSuggestedPurchaseDate(2, "weekly", from);
    expect(result.toISOString()).toBe("2026-08-15T12:00:00.000Z");
  });

  test("biweekly adds 14 days per paycheque", () => {
    const result = calculateSuggestedPurchaseDate(2, "biweekly", from);
    expect(result.toISOString()).toBe("2026-08-29T12:00:00.000Z");
  });

  test("monthly adds months", () => {
    const result = calculateSuggestedPurchaseDate(2, "monthly", from);
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(9); // October (0-indexed)
  });

  test("yearly adds years", () => {
    const result = calculateSuggestedPurchaseDate(1, "yearly", from);
    expect(result.getUTCFullYear()).toBe(2027);
  });
});
