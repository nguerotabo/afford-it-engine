import { normalizeToPaycheque } from "../utils";
import { convertToCents } from "../money";
import type { EvaluationContext, RuleResult, Rule } from "./rule";

/** Luxury only warns when post-purchase cushion is thinner than this many months of expenses. */
const LUXURY_CUSHION_MONTHS = 2;

export class categoryRule implements Rule {
    readonly name = "categoryRule";

    evaluate(context: EvaluationContext): RuleResult {
        const { purchaseCategory, expenses, expensesFrequency } = context.input;
        const { remainingAfter } = context.metrics;

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

        const monthlyExpenses = Math.round(
            normalizeToPaycheque(
                convertToCents(expenses),
                expensesFrequency,
                "monthly",
            ),
        );
        const thinCushion =
            remainingAfter < monthlyExpenses * LUXURY_CUSHION_MONTHS;

        if (thinCushion) {
            return {
                severity: "warn",
                factor: "Luxury purchase — thin cushion after the buy.",
            };
        }

        return {
            severity: "ok",
            factor: "Luxury purchase — cushion after the buy looks comfortable.",
        };
    }
}
