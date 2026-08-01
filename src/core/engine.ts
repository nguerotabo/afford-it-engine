import type { AffordabilityInput, AffordabilityOutput, Decision } from "./types";
import {
  normalizeToPaycheque,
  calculatePaychequesNeeded,
  calculateSuggestedPurchaseDate,
} from "./utils";
import { convertToCents, convertToDollars } from "./money";

export function evaluateAffordability(input: AffordabilityInput): AffordabilityOutput {
    let {
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

    //Convert everything to cents
    purchasePrice = convertToCents(purchasePrice);
    expenses = convertToCents(expenses);
    savingsCommitment= convertToCents(savingsCommitment);
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

    //Convert everything back to dollars
    safeToSpend = convertToDollars(safeToSpend);
    remainingAfter = convertToDollars(remainingAfter);
    freeCashFlowPerPaycheque = convertToDollars(freeCashFlowPerPaycheque);

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
