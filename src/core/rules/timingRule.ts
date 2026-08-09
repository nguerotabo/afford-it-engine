import type { EvaluationContext, RuleResult, Rule } from "./rule";

export class timingRule implements Rule {
    readonly name = "timingRule";

    evaluate(context: EvaluationContext): RuleResult {
        const { earliestAffordableDate, paychequesNeeded, remainingAfter } =
            context.metrics;

        // Already covered now — timing is not the constraint.
        if (remainingAfter >= 0) {
            return {
                severity: "ok",
                factor: "Purchase is covered now; timing not required.",
            };
        }

        // Cannot save toward it (FCF ≤ 0) — earliest date is a meaningless "now".
        if (!Number.isFinite(paychequesNeeded)) {
            return {
                severity: "block",
                factor: "No free cash flow to save toward this purchase.",
            };
        }

        if (
            earliestAffordableDate.getTime() <=
            context.input.desiredPurchaseDate.getTime()
        ) {
            return {
                severity: "ok",
                factor: "The desired purchase date is within reach.",
            };
        }

        return {
            severity: "block",
            factor: "The desired purchase date is not within reach.",
        };
    }
}
