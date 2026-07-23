import type { frequency } from "./types";

// Helper Function: Converts any number to match the user's paycheque cycle

export function normalizeToPaycheque(amount: number, currentFreq: string, targetFreq: string): number {
    // If they already match, we dont have to change anything. 
    if (currentFreq === targetFreq) {
        return amount;
    }

    // Step 1: Convert the amount to an annual baseline to make it easier to work with. 
    let annualAmount = 0;
    if (currentFreq === "weekly") annualAmount = amount * 52;
    if (currentFreq === "biweekly") annualAmount = amount * 26;
    if (currentFreq === "monthly") annualAmount = amount * 12;
    if (currentFreq === "yearly") annualAmount = amount;

    // Step 2: Slice that annual amount down to match the target frequency.
    if (targetFreq === "weekly") return annualAmount / 52;
    if (targetFreq === "biweekly") return annualAmount / 26;
    if (targetFreq === "monthly") return annualAmount / 12;
    if (targetFreq === "yearly") return annualAmount;

    return amount; // Fallback
}

// Money only: how many paycheques of free cash flow close the gap.
export function calculatePaychequesNeeded(
    purchasePrice: number,
    safeToSpend: number,
    freeCashFlowPerPaycheque: number,
): number {
    const shortfall = purchasePrice - safeToSpend;
    if (shortfall <= 0) return 0;
    if (freeCashFlowPerPaycheque <= 0) return Infinity;
    return Math.ceil(shortfall / freeCashFlowPerPaycheque);
}

// Calendar only: turn paychequesNeeded into an earliest affordable date.
export function calculateSuggestedPurchaseDate(
    paychequesNeeded: number,
    paychequeFrequency: frequency,
    fromDate: Date = new Date(),
): Date {
    const suggested = new Date(fromDate);

    if (!Number.isFinite(paychequesNeeded) || paychequesNeeded <= 0) {
        return suggested;
    }

    // Standardizes the paycheque frequency to the amount of paycheques needed to. 

    switch (paychequeFrequency) {
        case "weekly":
            suggested.setDate(suggested.getDate() + paychequesNeeded * 7);
            break;
        case "biweekly":
            suggested.setDate(suggested.getDate() + paychequesNeeded * 14);
            break;
        case "monthly":
            suggested.setMonth(suggested.getMonth() + paychequesNeeded);
            break;
        case "yearly":
            suggested.setFullYear(suggested.getFullYear() + paychequesNeeded);
            break;
    }

    return suggested;
}
