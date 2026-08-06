import { type Metrics } from "../metrics";
import { type AffordabilityInput } from "../types";


// The types of severity levels for the rule results
export type Severity = "ok" | "warn" | "block";

// The result of a rule evaluation + factor which is human readable text
export type RuleResult = {
    severity: Severity;
    factor?: string;
}

//
export type EvaluationContext = {
    input: AffordabilityInput;
    metrics: Metrics;
}

// Every rule must implement this interface
export interface Rule {
    readonly name: string;
    evaluate(context: EvaluationContext): RuleResult;
}