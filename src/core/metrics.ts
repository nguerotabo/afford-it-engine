import { convertToCents } from "./money";
import type { AffordabilityInput } from "./types";
import { normalizeToPaycheque, calculatePaychequesNeeded, calculateSuggestedPurchaseDate } from "./utils";


export type Metrics = {
    safeToSpend: number;
    remainingAfter: number;
    freeCashFlowPerPaycheque: number;
    paychequeImpact: number;
    totalImpact: number;
    paychequesNeeded: number;
    earliestAffordableDate: Date;
}

export function calculateMetrics(input: AffordabilityInput): Metrics {
    let {
      purchasePrice,
      expenses,
      savingsCommitment,
      currentSavings,
      minimumBuffer,
      paycheque,
      paychequeFrequency,
      expensesFrequency,
      savingsCommitmentFrequency,
    } = input;

    purchasePrice = convertToCents(purchasePrice);
    expenses = convertToCents(expenses);
    savingsCommitment = convertToCents(savingsCommitment);
    currentSavings = convertToCents(currentSavings);
    minimumBuffer = convertToCents(minimumBuffer);
    paycheque = convertToCents(paycheque);

  
    // Normalizing expenses + savings to user's chosen paycheque cycle
    const normalizedExpenses = Math.round(normalizeToPaycheque(expenses, expensesFrequency, paychequeFrequency));
    const normalizedSavings = Math.round(normalizeToPaycheque(savingsCommitment, savingsCommitmentFrequency, paychequeFrequency));
  
    // Core calculations
    let freeCashFlowPerPaycheque = paycheque - normalizedExpenses - normalizedSavings;
    let safeToSpend = currentSavings - minimumBuffer;
    let remainingAfter = safeToSpend + freeCashFlowPerPaycheque - purchasePrice; // >= 0 => affordable now, buffer intact

    // Derived metrics
    const paychequeImpact = paycheque > 0 ? purchasePrice / paycheque : Infinity;
    const totalAvailable = safeToSpend + freeCashFlowPerPaycheque;
    const totalImpact = totalAvailable > 0 ? purchasePrice / totalAvailable : Infinity;

    const paychequesNeeded = calculatePaychequesNeeded(
      purchasePrice,
      safeToSpend,
      freeCashFlowPerPaycheque,
    );

    // Earliest date the gap closes (today if already covered / unreachable stays "now" placeholder)
    const earliestAffordableDate = calculateSuggestedPurchaseDate(
      paychequesNeeded,
      paychequeFrequency,
    );

    return {
      safeToSpend,
      remainingAfter,
      freeCashFlowPerPaycheque,
      paychequeImpact,
      totalImpact,
      paychequesNeeded,
      earliestAffordableDate,
    };
}
