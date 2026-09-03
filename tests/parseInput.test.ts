import { expect, test, describe } from "vitest";
import { parseAffordabilityInput } from "../src/core/parseInput";

const validBody = {
  paycheque: 1200,
  paychequeFrequency: "biweekly",
  expenses: 700,
  expensesFrequency: "biweekly",
  currentSavings: 1500,
  minimumBuffer: 500,
  purchasePrice: 800,
  desiredPurchaseDate: "2026-10-15",
  purchaseCategory: "wants",
  savingsCommitment: 100,
  savingsCommitmentFrequency: "biweekly",
};

describe("parseAffordabilityInput", () => {
  test("accepts a well-formed body", () => {
    const parsed = parseAffordabilityInput(validBody);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.input.paycheque).toBe(1200);
    expect(parsed.input.purchaseCategory).toBe("wants");
    expect(parsed.input.desiredPurchaseDate.getFullYear()).toBe(2026);
    expect(parsed.input.desiredPurchaseDate.getMonth()).toBe(9);
    expect(parsed.input.desiredPurchaseDate.getDate()).toBe(15);
    expect(parsed.input.desiredPurchaseDate.getHours()).toBe(0);
  });

  test("rejects non-object bodies", () => {
    expect(parseAffordabilityInput(null).ok).toBe(false);
    expect(parseAffordabilityInput([]).ok).toBe(false);
    expect(parseAffordabilityInput("nope").ok).toBe(false);
  });

  test("rejects missing money fields", () => {
    const { paycheque: _, ...rest } = validBody;
    const parsed = parseAffordabilityInput(rest);

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toBe("paycheque is required");
  });

  test("rejects NaN, Infinity, negatives, and numeric strings", () => {
    expect(parseAffordabilityInput({ ...validBody, purchasePrice: NaN }).ok).toBe(
      false,
    );
    expect(
      parseAffordabilityInput({ ...validBody, purchasePrice: Infinity }).ok,
    ).toBe(false);
    expect(parseAffordabilityInput({ ...validBody, purchasePrice: -1 }).ok).toBe(
      false,
    );
    expect(
      parseAffordabilityInput({ ...validBody, purchasePrice: "800" }).ok,
    ).toBe(false);
  });

  test("rejects invalid frequency and category", () => {
    expect(
      parseAffordabilityInput({ ...validBody, paychequeFrequency: "daily" }).ok,
    ).toBe(false);
    expect(
      parseAffordabilityInput({ ...validBody, purchaseCategory: "fun" }).ok,
    ).toBe(false);
  });

  test("rejects invalid dates", () => {
    expect(
      parseAffordabilityInput({ ...validBody, desiredPurchaseDate: "not-a-date" })
        .ok,
    ).toBe(false);
    expect(
      parseAffordabilityInput({ ...validBody, desiredPurchaseDate: 123 }).ok,
    ).toBe(false);
    expect(
      parseAffordabilityInput({ ...validBody, desiredPurchaseDate: "2026-02-31" })
        .ok,
    ).toBe(false);
  });

  test("YYYY-MM-DD is a local calendar day, not UTC midnight", () => {
    const parsed = parseAffordabilityInput({
      ...validBody,
      desiredPurchaseDate: "2026-10-22",
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const date = parsed.input.desiredPurchaseDate;
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(22);
    expect(date.getHours()).toBe(0);
  });
});
