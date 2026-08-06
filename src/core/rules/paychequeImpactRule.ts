import type { EvaluationContext, RuleResult, Rule} from "./rule";

export class paychequeImpactRule implements Rule {
    readonly name = "paychequeImpactRule";

    // Evaluate the paycheque impact rule
    evaluate(context: EvaluationContext): RuleResult {
        const {paychequeImpact} = context.metrics;

        if (paychequeImpact <= 1) {
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

