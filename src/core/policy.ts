import type { Metrics } from "./metrics";
import type { RuleResult } from "./rules/rule";
import type { AffordabilityInput, Decision } from "./types";

export type NamedRuleResult = {
    name: string;
    result: RuleResult;
};

export type PolicyOutput = {
    decision: Decision;
    suggestedPurchaseDate: Date;
    riskFactors: string[];
};

function resultByName(
    results: NamedRuleResult[],
    name: string,
): RuleResult | undefined {
    return results.find((r) => r.name === name)?.result;
}

function factorsWithSeverity(
    results: NamedRuleResult[],
    severity: RuleResult["severity"],
): string[] {
    return results
        .filter((r) => r.result.severity === severity && r.result.factor)
        .map((r) => r.result.factor!);
}

/**
 * Combine rule results into a final decision.
 *
 * Composition (see DECISIONS.md):
 * - buffer ok + any warn → risky
 * - buffer ok + no warns → yes
 * - buffer block + timing ok → wait
 * - buffer block + timing block → no
 */
export function applyPolicy(
    input: AffordabilityInput,
    metrics: Metrics,
    results: NamedRuleResult[],
): PolicyOutput {
    const buffer = resultByName(results, "bufferRule");
    const timing = resultByName(results, "timingRule");

    const warnFactors = factorsWithSeverity(results, "warn");
    const blockFactors = factorsWithSeverity(results, "block");

    const bufferOk = buffer?.severity === "ok";
    const timingOk = timing?.severity === "ok";

    if (bufferOk) {
        if (warnFactors.length > 0) {
            return {
                decision: "risky",
                suggestedPurchaseDate: input.desiredPurchaseDate,
                riskFactors: warnFactors,
            };
        }

        return {
            decision: "yes",
            suggestedPurchaseDate: input.desiredPurchaseDate,
            riskFactors: [],
        };
    }

    // Buffer blocked — not affordable today.
    if (timingOk) {
        return {
            decision: "wait",
            suggestedPurchaseDate: metrics.earliestAffordableDate,
            riskFactors: [...blockFactors, ...warnFactors],
        };
    }

    // Unreachable in time, or cannot save at all.
    const suggestedPurchaseDate = Number.isFinite(metrics.paychequesNeeded)
        ? metrics.earliestAffordableDate
        : input.desiredPurchaseDate;

    return {
        decision: "no",
        suggestedPurchaseDate,
        riskFactors: [...blockFactors, ...warnFactors],
    };
}
