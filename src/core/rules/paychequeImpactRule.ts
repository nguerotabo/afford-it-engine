import type { EvaluationContext, RuleResult, Rule} from "./rule";

export class paychequeImpactRule implements Rule {
    readonly name = "paychequeImpactRule";

    // Evaluate the paycheque impact rule
    evaluate(context: EvaluationContext): RuleResult {
        const { paychequeImpact, paychequesUntilDesired } = context.metrics;

        // Large vs one cheque only matters if this buy hits the current period.
        if (paychequesUntilDesired > 0 || paychequeImpact <= 1) {
            return {
                severity: "ok",
                factor: "The paycheque impact is acceptable.",
            };
        }

        return {
            severity: "warn",
            factor: "The paycheque impact is quite high.",
        };
    }
}

 