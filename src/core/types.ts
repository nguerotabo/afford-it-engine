export type AffordabilityInput = {
    paycheque: number; // create subtype for weekly, monthly, yearly. Allow user to input any frequency.
    paychequeFrequency: frequency
    expenses: number; // create subtype for weekly, monthly, yearly. Allow user to input any frequency.
    expensesFrequency: frequency
    currentSavings: number;
    minimumBuffer: number; // lowest allowed cash available. 
    purchasePrice: number;
    desiredPurchaseDate: Date; // have suggestedPurchaseDate in output. 
    purchaseCategory: "wants" | "needs" | "luxury";
    savingsCommitment: number; // create subtype for weekly, monthly, yearly. Allow user to input any frequency.
    savingsCommitmentFrequency: frequency
}

export type frequency = "weekly" | "monthly" | "yearly";

export type Decision = "yes" | "no" | "wait";

export type AffordabilityOutput = {
    decision: Decision;
    reason: string;
    suggestedPurchaseDate: Date;
    safeToSpend: number;
    paychequesNeeded: number;
    cashImpact: number;
    paychequeImpact: number;
    affordabilityScore: number; // figure out a way to make this happen.
    remainingAfter: number; 
    freeCashFlow: number;
}