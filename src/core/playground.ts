import type { AffordabilityInput } from "./types";
import { evaluateAffordability } from "./engine";

const input: AffordabilityInput = {
    paycheque: 50000,
    paychequeFrequency: "weekly",
    expenses: 5000,
    expensesFrequency: "weekly",
    currentSavings: 500000,
    minimumBuffer: 200000,
    purchasePrice: 500000,
    desiredPurchaseDate: new Date("2026-10-30"),
    purchaseCategory: "wants",
    savingsCommitment: 25000,
    savingsCommitmentFrequency: "weekly",
}

const output = evaluateAffordability(input);

console.log(output);
