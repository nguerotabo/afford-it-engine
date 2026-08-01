import type { AffordabilityInput } from "../src/core/types";

/** Baseline weekly inputs: FCF = 200, safeToSpend = 3000 */
export function baseInput(
  overrides: Partial<AffordabilityInput> = {},
): AffordabilityInput {
  return {
    paycheque: 500,
    paychequeFrequency: "weekly",
    expenses: 50,
    expensesFrequency: "weekly",
    currentSavings: 5000,
    minimumBuffer: 2000,
    purchasePrice: 3000,
    desiredPurchaseDate: new Date("2026-10-30"),
    purchaseCategory: "wants",
    savingsCommitment: 250,
    savingsCommitmentFrequency: "weekly",
    ...overrides,
  };
}

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
