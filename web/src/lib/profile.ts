import type { frequency } from "@/lib/engine";

export const PROFILE_STORAGE_KEY = "afford-it:money-profile:v1";

export const HIDDEN_DEFAULTS = {
  minimumBuffer: 500,
  savingsCommitment: 0,
  savingsCommitmentFrequency: "biweekly" as frequency,
  purchaseCategory: "wants" as const,
};

export const SETUP_DEFAULTS = {
  paychequeFrequency: "biweekly" as frequency,
  expensesFrequency: "monthly" as frequency,
};

const FREQUENCIES: readonly frequency[] = [
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
];

export type MoneyProfile = {
  currentSavings: number;
  paycheque: number;
  paychequeFrequency: frequency;
  expenses: number;
  expensesFrequency: frequency;
};

function isFrequency(value: unknown): value is frequency {
  return typeof value === "string" && (FREQUENCIES as readonly string[]).includes(value);
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function parseMoneyProfile(value: unknown): MoneyProfile | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    !isNonNegativeFinite(record.currentSavings) ||
    !isNonNegativeFinite(record.paycheque) ||
    !isNonNegativeFinite(record.expenses) ||
    !isFrequency(record.paychequeFrequency) ||
    !isFrequency(record.expensesFrequency)
  ) {
    return null;
  }

  return {
    currentSavings: record.currentSavings,
    paycheque: record.paycheque,
    paychequeFrequency: record.paychequeFrequency,
    expenses: record.expenses,
    expensesFrequency: record.expensesFrequency,
  };
}

export function loadMoneyProfile(): MoneyProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parseMoneyProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveMoneyProfile(profile: MoneyProfile): void {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearMoneyProfile(): void {
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

/** Local calendar YYYY-MM-DD, not UTC. */
export function todayLocalISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
