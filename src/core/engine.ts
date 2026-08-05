import type { AffordabilityInput, AffordabilityOutput, Decision } from "./types";
import { calculateMetrics } from "./metrics";
import { convertToDollars } from "./money";

export function evaluateAffordability(input: AffordabilityInput): AffordabilityOutput {
    let {   
      desiredPurchaseDate,
    } = input;

    //Calculate all the facts and metrics
    const metrics = calculateMetrics(input);

    // Decision uses desiredPurchaseDate as the wait/no boundary.
    let finalDecision: Decision;
    let suggestedPurchaseDate: Date;

    if (metrics.remainingAfter >= 0) {
      // Affordable now, buffer safe
      finalDecision = "yes";
      suggestedPurchaseDate = desiredPurchaseDate;
    } else if (!Number.isFinite(metrics.paychequesNeeded)) {
      // Can't save toward it (no free cash flow)
      finalDecision = "no";
      suggestedPurchaseDate = desiredPurchaseDate;
    } else if (metrics.earliestAffordableDate.getTime() <= desiredPurchaseDate.getTime()) {
      // Not now, but reachable by the date they want
      finalDecision = "wait";
      suggestedPurchaseDate = metrics.earliestAffordableDate;
    } else {
      // Misses their target date; still surface when it would become affordable
      finalDecision = "no";
      suggestedPurchaseDate = metrics.earliestAffordableDate;
    }

    //Convert everything back to dollars
    const safeToSpend = convertToDollars(metrics.safeToSpend);
    const remainingAfter = convertToDollars(metrics.remainingAfter);
    const freeCashFlowPerPaycheque = convertToDollars(metrics.freeCashFlowPerPaycheque);

    return {
      decision: finalDecision,
      reason: "The AI will generate this later based on the metrics.",
      suggestedPurchaseDate,
      safeToSpend,
      paychequesNeeded: metrics.paychequesNeeded,
      totalImpact: metrics.totalImpact,
      paychequeImpact: metrics.paychequeImpact,
      affordabilityScore: metrics.paychequeImpact,
      remainingAfter,
      freeCashFlow: freeCashFlowPerPaycheque,
    };
  }
