import { expect, test } from "vitest";
import { evaluateAffordability } from "../src/core/engine";
import type { AffordabilityInput } from "../src/core/types";

test("affordable now → yes", () => {
  const desiredPurchaseDate = new Date("2026-10-30");

  // FCF = 500 - 50 - 250 = 200
  // safeToSpend = 5000 - 2000 = 3000
  // remainingAfter = 3000 + 200 - 3000 = 200 ≥ 0 → yes
  const input: AffordabilityInput = {
    paycheque: 500,
    paychequeFrequency: "weekly",
    expenses: 50,
    expensesFrequency: "weekly",
    currentSavings: 5000,
    minimumBuffer: 2000,
    purchasePrice: 3000,
    desiredPurchaseDate,
    purchaseCategory: "wants",
    savingsCommitment: 250,
    savingsCommitmentFrequency: "weekly",
  };

  const output = evaluateAffordability(input);

  expect(output.decision).toBe("yes");
  expect(output.suggestedPurchaseDate).toEqual(desiredPurchaseDate);
  expect(output.paychequesNeeded).toBe(0);
  expect(output.safeToSpend).toBe(3000);
  expect(output.freeCashFlow).toBe(200);
  expect(output.remainingAfter).toBe(200);
  expect(output.paychequeImpact).toBe(6); // 3000 / 500
  expect(output.totalImpact).toBe(3000 / 3200); // price / (safeToSpend + FCF)
  expect(output.affordabilityScore).toBe(output.paychequeImpact);
});
