import type { AffordabilityInput, frequency, PurchaseCategory } from "./types";

const FREQUENCIES: readonly frequency[] = [
    "weekly",
    "biweekly",
    "monthly",
    "yearly",
];

const CATEGORIES: readonly PurchaseCategory[] = ["wants", "needs", "luxury"];

const MONEY_FIELDS = [
    "paycheque",
    "expenses",
    "currentSavings",
    "minimumBuffer",
    "purchasePrice",
    "savingsCommitment",
] as const;

const FREQUENCY_FIELDS = [
    "paychequeFrequency",
    "expensesFrequency",
    "savingsCommitmentFrequency",
] as const;

export type ParseResult =
    | { ok: true; input: AffordabilityInput }
    | { ok: false; error: string };

function isFrequency(value: unknown): value is frequency {
    return typeof value === "string" && (FREQUENCIES as readonly string[]).includes(value);
}

function isCategory(value: unknown): value is PurchaseCategory {
    return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function isNonNegativeFinite(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** YYYY-MM-DD is a calendar day, not UTC midnight (which is the previous evening in US timezones). */
function parseDesiredDate(value: unknown): Date | null {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value !== "string") {
        return null;
    }

    const dateOnly = DATE_ONLY.exec(value);
    if (dateOnly) {
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]);
        const day = Number(dateOnly[3]);
        const date = new Date(year, month - 1, day);
        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }
        return date;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
}

/**
 * Trust-boundary parse: unknown JSON → AffordabilityInput, or a 400-able error.
 * The engine assumes a valid input; this is what rejects garbage.
 */
export function parseAffordabilityInput(body: unknown): ParseResult {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        return { ok: false, error: "Body must be an object" };
    }

    const raw = body as Record<string, unknown>;

    for (const field of MONEY_FIELDS) {
        if (!(field in raw)) {
            return { ok: false, error: `${field} is required` };
        }
        if (!isNonNegativeFinite(raw[field])) {
            return { ok: false, error: `${field} must be a finite number >= 0` };
        }
    }

    for (const field of FREQUENCY_FIELDS) {
        if (!isFrequency(raw[field])) {
            return {
                ok: false,
                error: `${field} must be weekly, biweekly, monthly, or yearly`,
            };
        }
    }

    if (!isCategory(raw.purchaseCategory)) {
        return { ok: false, error: "purchaseCategory must be wants, needs, or luxury" };
    }

    const date = parseDesiredDate(raw.desiredPurchaseDate);
    if (date === null) {
        return { ok: false, error: "desiredPurchaseDate must be a valid date" };
    }

    return {
        ok: true,
        input: {
            paycheque: raw.paycheque as number,
            paychequeFrequency: raw.paychequeFrequency as frequency,
            expenses: raw.expenses as number,
            expensesFrequency: raw.expensesFrequency as frequency,
            currentSavings: raw.currentSavings as number,
            minimumBuffer: raw.minimumBuffer as number,
            purchasePrice: raw.purchasePrice as number,
            desiredPurchaseDate: date,
            purchaseCategory: raw.purchaseCategory as PurchaseCategory,
            savingsCommitment: raw.savingsCommitment as number,
            savingsCommitmentFrequency: raw.savingsCommitmentFrequency as frequency,
        },
    };
}
