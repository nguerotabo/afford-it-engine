import type { AffordabilityInput } from "./types";
import { convertToCents } from "./money";
import type { Metrics } from "./metrics";

export type Ledger = {
    safeToSpend: number;
    currentSavings: number;
};

export function calculateBeforeLedger(
    input: AffordabilityInput,
    metrics: Metrics,
): Ledger {
    const minimumBuffer = convertToCents(input.minimumBuffer);

    return {
        currentSavings: metrics.safeToSpend + minimumBuffer,
        safeToSpend: metrics.safeToSpend,
    };
}

export function calculateAfterLedger(
    input: AffordabilityInput,
    metrics: Metrics,
): Ledger {
    const minimumBuffer = convertToCents(input.minimumBuffer);
    const purchasePrice = convertToCents(input.purchasePrice);
    const currentSavings = metrics.safeToSpend + minimumBuffer;
    const fcf = metrics.freeCashFlowPerPaycheque;

    const fromFcf = Math.min(purchasePrice, Math.max(0, fcf));
    const fromSavings = purchasePrice - fromFcf;

    const afterCash = currentSavings - fromSavings;
    const afterSafe = afterCash - minimumBuffer;

    return {
        safeToSpend: afterSafe,
        currentSavings: afterCash,
    };
}
