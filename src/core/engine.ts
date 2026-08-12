import type { AffordabilityInput, AffordabilityOutput, LedgerSnapshot } from "./types";
import { calculateMetrics } from "./metrics";
import { convertToDollars } from "./money";
import { applyPolicy } from "./policy";
import { calculateAfterLedger, calculateBeforeLedger } from "./ledger";
import { bufferRule } from "./rules/bufferRule";
import { categoryRule } from "./rules/categoryRule";
import { timingRule } from "./rules/timingRule";
import { paychequeImpactRule } from "./rules/paychequeImpactRule";
import type { Rule } from "./rules/rule";

function toLedgerSnapshot(ledger: {
    currentSavings: number;
    safeToSpend: number;
}): LedgerSnapshot {
    return {
        currentSavings: convertToDollars(ledger.currentSavings),
        safeToSpend: convertToDollars(ledger.safeToSpend),
    };
}

const RULES: Rule[] = [
    new bufferRule(),
    new categoryRule(),
    new timingRule(),
    new paychequeImpactRule(),
];

export function evaluateAffordability(
    input: AffordabilityInput,
): AffordabilityOutput {
    const metrics = calculateMetrics(input);
    const context = { input, metrics };

    const results = RULES.map((rule) => ({
        name: rule.name,
        result: rule.evaluate(context),
    }));

    const { decision, suggestedPurchaseDate, riskFactors } = applyPolicy(
        input,
        metrics,
        results,
    );

    const before = toLedgerSnapshot(calculateBeforeLedger(input, metrics));
    const after = toLedgerSnapshot(calculateAfterLedger(input, metrics));

    return {
        decision,
        reason: "The AI will generate this later based on the metrics.",
        suggestedPurchaseDate,
        safeToSpend: convertToDollars(metrics.safeToSpend),
        paychequesNeeded: metrics.paychequesNeeded,
        totalImpact: metrics.totalImpact,
        paychequeImpact: metrics.paychequeImpact,
        affordabilityScore: metrics.paychequeImpact,
        remainingAfter: convertToDollars(metrics.remainingAfter),
        freeCashFlow: convertToDollars(metrics.freeCashFlowPerPaycheque),
        purchaseCategory: input.purchaseCategory,
        riskFactors,
        before,
        after,
    };
}
