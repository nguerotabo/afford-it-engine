import type { EvaluationContext, RuleResult, Rule} from "./rule";

export class timingRule implements Rule {
    readonly name = "timingRule";

    // Evaluate the timing rule
    evaluate(context: EvaluationContext): RuleResult {
        const {earliestAffordableDate} = context.metrics;

        if (earliestAffordableDate.getTime() <= context.input.desiredPurchaseDate.getTime()) {
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