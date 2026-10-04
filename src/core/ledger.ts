import type { AffordabilityInput } from "./types";
import { convertToCents } from "./money";
import type { Metrics } from "./metrics";

export type Ledger = {
    safeToSpend: number;
    currentSavings: number;
};

function nowCash(input: AffordabilityInput, metrics: Metrics): number {
    const minimumBuffer = convertToCents(input.minimumBuffer);
    return metrics.safeToSpend + minimumBuffer;
}

function cashAtDesiredDate(input: AffordabilityInput, metrics: Metrics): number {
    return (
        nowCash(input, metrics) +
        metrics.freeCashFlowPerPaycheque * metrics.paychequesUntilDesired
    );
}

export function calculateBeforeLedger(
    input: AffordabilityInput,
    metrics: Metrics,
): Ledger {
    const minimumBuffer = convertToCents(input.minimumBuffer);
    const currentSavings = nowCash(input, metrics);

    return {
        currentSavings,
        safeToSpend: currentSavings - minimumBuffer,
    };
}

export function calculateAfterLedger(
    input: AffordabilityInput,
    metrics: Metrics,
): Ledger {
    const minimumBuffer = convertToCents(input.minimumBuffer);
    const purchasePrice = convertToCents(input.purchasePrice);
    const projectedCash = cashAtDesiredDate(input, metrics);
    const fcf = metrics.freeCashFlowPerPaycheque;
    const n = metrics.paychequesUntilDesired;

    // Today: this paycheque is not in cash yet — FCF-first. Later: FCF already in the pile.
    const fromSavings =
        n <= 0
            ? purchasePrice - Math.min(purchasePrice, Math.max(0, fcf))
            : purchasePrice;

    const afterCash = projectedCash - fromSavings;
    const afterSafe = afterCash - minimumBuffer;

    return {
        safeToSpend: afterSafe,
        currentSavings: afterCash,
    };
}
