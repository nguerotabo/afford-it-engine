import type { EvaluationContext, RuleResult, Rule} from "./rule";

export class bufferRule implements Rule {
    readonly name = "bufferRule";

    // Evaluate the buffer rule
    evaluate(context: EvaluationContext): RuleResult {
        const {remainingAfter} = context.metrics;

        if (remainingAfter >= 0) {
            return {
                severity: "ok",
                factor: "The buffer is sufficient.",
            };
        }
        
        return {
                severity: "block",
                factor: "The buffer is insufficient.",
            };
    }
}


