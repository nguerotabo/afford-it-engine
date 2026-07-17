import type { AffordabilityInput, AffordabilityOutput, Decision } from "./types.js";
import {
  normalizeToPaycheque,
  calculatePaychequesNeeded,
  calculateSuggestedPurchaseDate,
} from "./utils.js";

export function evaluateAffordability(input: AffordabilityInput): AffordabilityOutput {
    const {
      paycheque,
      paychequeFrequency,
      expenses,
      expensesFrequency,
      purchasePrice,
      desiredPurchaseDate,
      savingsCommitment,
      savingsCommitmentFrequency,
      currentSavings,
      minimumBuffer,
    } = input;
  
    // Normalizing expenses + savings to user's chosen paycheque cycle
    const normalizedExpenses = normalizeToPaycheque(expenses, expensesFrequency, paychequeFrequency);
    const normalizedSavings = normalizeToPaycheque(savingsCommitment, savingsCommitmentFrequency, paychequeFrequency);
  
    // Core calculations
    const freeCashFlowPerPaycheque = paycheque - normalizedExpenses - normalizedSavings;
    const safeToSpend = currentSavings - minimumBuffer;
    const remainingAfter = safeToSpend + freeCashFlowPerPaycheque - purchasePrice; // >= 0 => affordable now, buffer intact

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

    // Decision uses desiredPurchaseDate as the wait/no boundary.
    let finalDecision: Decision;
    let suggestedPurchaseDate: Date;

    if (remainingAfter >= 0) {
      // Affordable now, buffer safe
      finalDecision = "yes";
      suggestedPurchaseDate = desiredPurchaseDate;
    } else if (!Number.isFinite(paychequesNeeded)) {
      // Can't save toward it (no free cash flow)
      finalDecision = "no";
      suggestedPurchaseDate = desiredPurchaseDate;
    } else if (earliestAffordableDate.getTime() <= desiredPurchaseDate.getTime()) {
      // Not now, but reachable by the date they want
      finalDecision = "wait";
      suggestedPurchaseDate = earliestAffordableDate;
    } else {
      // Misses their target date; still surface when it would become affordable
      finalDecision = "no";
      suggestedPurchaseDate = earliestAffordableDate;
    }

    return {
      decision: finalDecision,
      reason: "The AI will generate this later based on the metrics.",
      suggestedPurchaseDate,
      safeToSpend,
      paychequesNeeded,
      totalImpact,
      paychequeImpact,
      affordabilityScore: paychequeImpact,
      remainingAfter,
      freeCashFlow: freeCashFlowPerPaycheque,
    };
  }
