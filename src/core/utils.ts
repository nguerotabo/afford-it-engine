import type { Decision } from "./types.js";

// Helper Function: Converts any number to match the user's paycheque cycle

export function normalizeToPaycheque(amount: number, currentFreq: string, targetFreq: string): number {
    // If they already match, do no math!
    if (currentFreq === targetFreq) {
        return amount;
    }

    // Step 1: Convert the amount to a safe, annual baseline
    let annualAmount = 0;
    if (currentFreq === "weekly") annualAmount = amount * 52;
    if (currentFreq === "monthly") annualAmount = amount * 12;
    if (currentFreq === "yearly") annualAmount = amount;

    // Step 2: Slice that annual amount down to match the target frequency
    if (targetFreq === "weekly") return annualAmount / 52;
    if (targetFreq === "monthly") return annualAmount / 12;
    if (targetFreq === "yearly") return annualAmount;

    return amount; // Fallback
}

