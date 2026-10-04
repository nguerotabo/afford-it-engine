import { expect, test, describe } from "vitest";
import {
  normalizeToPaycheque,
  calculatePaychequesNeeded,
  calculateSuggestedPurchaseDate,
  startOfLocalDay,
  isOnOrBeforeCalendarDay,
  paychequesUntil,
} from "../src/core/utils";

function localYmd(date: Date): [number, number, number] {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

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

describe("calendar day helpers", () => {
  test("startOfLocalDay strips clock time", () => {
    const noon = new Date(2026, 9, 22, 22, 42, 15);
    const start = startOfLocalDay(noon);

    expect(localYmd(start)).toEqual([2026, 10, 22]);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });

  test("same calendar day with later clock time is on or before", () => {
    const desired = new Date(2026, 9, 22, 0, 0, 0);
    const earliest = new Date(2026, 9, 22, 22, 42, 0);

    expect(isOnOrBeforeCalendarDay(earliest, desired)).toBe(true);
    expect(earliest.getTime() <= desired.getTime()).toBe(false);
  });
});

describe("calculateSuggestedPurchaseDate", () => {
  const from = new Date(2026, 7, 1, 12, 0, 0);

  test("0 paycheques → start of fromDate's local day", () => {
    const result = calculateSuggestedPurchaseDate(0, "weekly", from);
    expect(localYmd(result)).toEqual(localYmd(from));
    expect(result.getHours()).toBe(0);
  });

  test("Infinity paycheques → start of fromDate's local day", () => {
    const result = calculateSuggestedPurchaseDate(Infinity, "weekly", from);
    expect(localYmd(result)).toEqual(localYmd(from));
    expect(result.getHours()).toBe(0);
  });

  test("weekly adds 7 days per paycheque", () => {
    const result = calculateSuggestedPurchaseDate(2, "weekly", from);
    expect(localYmd(result)).toEqual([2026, 8, 15]);
    expect(result.getHours()).toBe(0);
  });

  test("biweekly adds 14 days per paycheque", () => {
    const result = calculateSuggestedPurchaseDate(2, "biweekly", from);
    expect(localYmd(result)).toEqual([2026, 8, 29]);
  });

  test("monthly adds months", () => {
    const result = calculateSuggestedPurchaseDate(2, "monthly", from);
    expect(localYmd(result)).toEqual([2026, 10, 1]);
  });

  test("yearly adds years", () => {
    const result = calculateSuggestedPurchaseDate(1, "yearly", from);
    expect(localYmd(result)).toEqual([2027, 8, 1]);
  });

  test("5 biweekly from Aug 13 lands on Oct 22 with no clock time", () => {
    const result = calculateSuggestedPurchaseDate(
      5,
      "biweekly",
      new Date(2026, 7, 13, 22, 42),
    );
    expect(localYmd(result)).toEqual([2026, 10, 22]);
    expect(result.getHours()).toBe(0);
  });
});

describe("paychequesUntil", () => {
  const from = new Date(2026, 7, 13, 22, 42);

  test("same day is 0", () => {
    expect(paychequesUntil(from, from, "biweekly")).toBe(0);
  });

  test("inverts calculateSuggestedPurchaseDate for weekly and biweekly", () => {
    for (const n of [1, 2, 5, 10]) {
      for (const freq of ["weekly", "biweekly"] as const) {
        const to = calculateSuggestedPurchaseDate(n, freq, from);
        expect(paychequesUntil(from, to, freq)).toBe(n);
      }
    }
  });

  test("Aug 13 to Oct 22 is 5 biweekly paycheques", () => {
    expect(paychequesUntil(from, new Date(2026, 9, 22), "biweekly")).toBe(5);
  });
});
