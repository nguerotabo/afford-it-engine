import { convertToCents } from "./money";
import type { AffordabilityInput } from "./types";
import { normalizeToPaycheque, calculatePaychequesNeeded, calculateSuggestedPurchaseDate, paychequesUntil } from "./utils";


export type Metrics = {
    safeToSpend: number;
    remainingAfter: number;
    freeCashFlowPerPaycheque: number;
    paychequeImpact: number;
    totalImpact: number;
    paychequesNeeded: number;
    paychequesUntilDesired: number;
    earliestAffordableDate: Date;
}

export function calculateMetrics(input: AffordabilityInput): Metrics {
    let {
      purchasePrice,
      expenses,
      currentSavings,
      minimumBuffer,
      paycheque,
      paychequeFrequency,
      expensesFrequency,
    } = input;

    purchasePrice = convertToCents(purchasePrice);
    expenses = convertToCents(expenses);
    currentSavings = convertToCents(currentSavings);
    minimumBuffer = convertToCents(minimumBuffer);
    paycheque = convertToCents(paycheque);

    // Savings commitment is plan-into-cash, not a second sink (would double-count).
    const normalizedExpenses = Math.round(
      normalizeToPaycheque(expenses, expensesFrequency, paychequeFrequency),
    );

    // Core calculations
    let freeCashFlowPerPaycheque = paycheque - normalizedExpenses;
    let safeToSpend = currentSavings - minimumBuffer;

    // Periods that land before/on the desired date. 0 = buy today (this paycheque not yet in cash).
    const paychequesUntilDesired = paychequesUntil(
      new Date(),
      input.desiredPurchaseDate,
      paychequeFrequency,
    );

    // N = 0: this paycheque's FCF can fund the buy. N >= 1: those cheques are already in the pile.
    const accumulatedFcf =
      paychequesUntilDesired <= 0
        ? freeCashFlowPerPaycheque
        : paychequesUntilDesired * freeCashFlowPerPaycheque;
    let remainingAfter = safeToSpend + accumulatedFcf - purchasePrice;

    // Derived metrics
    const paychequeImpact = paycheque > 0 ? purchasePrice / paycheque : Infinity;
    const totalAvailable = safeToSpend + accumulatedFcf;
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
      paychequesUntilDesired,
      earliestAffordableDate,
    };
}
