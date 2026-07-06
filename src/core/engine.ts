import type { AffordabilityInput, AffordabilityOutput, Decision } from "./types.js";
import { normalizeToPaycheque } from "./utils.js";

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
    const safeToSpend = currentSavings - minimumBuffer;      // buffer already protected here
    const remainingAfter = safeToSpend - purchasePrice;      // >= 0  => affordable, buffer intact
  
    // Derived metrics 
    const paychequeImpact = paycheque > 0 ? purchasePrice / paycheque : Infinity;
    const cashImpact = freeCashFlowPerPaycheque > 0 ? purchasePrice / freeCashFlowPerPaycheque : Infinity;
  
    // Paycheques of saving needed to close the gap (only meaningful when short)
    const shortfall = purchasePrice - safeToSpend;           // > 0 when not affordable now
    const paychequesNeeded =
      shortfall <= 0
        ? 0
        : freeCashFlowPerPaycheque > 0
          ? Math.ceil(shortfall / freeCashFlowPerPaycheque)
          : Infinity;                                        // can't save => unreachable
  
    // Decision: two questions, three outcomes
    const WAIT_LIMIT = 6; // paycheques (~3 months if biweekly)
  
    let finalDecision: Decision;
    if (remainingAfter >= 0) {
      finalDecision = "yes";                                 // affordable now, buffer safe
    } else if (paychequesNeeded <= WAIT_LIMIT) {
      finalDecision = "wait";                                // not now, but reachable soon
    } else {
      finalDecision = "no";                                  // unreachable in limit / can't save
    }
  
    // Return
    return {
      decision: finalDecision,
      reason: "The AI will generate this later based on the metrics.",
      suggestedPurchaseDate: desiredPurchaseDate,
      safeToSpend,
      paychequesNeeded,
      cashImpact,
      paychequeImpact,
      affordabilityScore: paychequeImpact,
      remainingAfter,
      freeCashFlow: freeCashFlowPerPaycheque,
    };
  }
  
  