import type { EvaluationContext, RuleResult, Rule } from "./rule";

export class categoryRule implements Rule {
    readonly name = "categoryRule";

    evaluate(context: EvaluationContext): RuleResult {
        const { purchaseCategory } = context.input;

        if (purchaseCategory === "needs") {
            return {
                severity: "ok",
                factor: "Need purchase — lower risk bar.",
            };
        }

        if (purchaseCategory === "wants") {
            return {
                severity: "ok",
                factor: "Want purchase — standard risk bar.",
            };
        }

        // luxury
        return {
            severity: "warn",
            factor: "Luxury purchase — higher risk bar.",
        };
    }
}
