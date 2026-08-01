import type { AffordabilityInput } from "./types";
import { evaluateAffordability } from "./engine";

const input: AffordabilityInput = {
    paycheque: 500.00,
    paychequeFrequency: "weekly",
    expenses: 50.00,
    expensesFrequency: "weekly",
    currentSavings: 5000.00,
    minimumBuffer: 2000.00,
    purchasePrice: 5000.00,
    desiredPurchaseDate: new Date("2026-10-30"),
    purchaseCategory: "wants",
    savingsCommitment: 250.00,
    savingsCommitmentFrequency: "weekly",
}

const output = evaluateAffordability(input);

console.log(output);
