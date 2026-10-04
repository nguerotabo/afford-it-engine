"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Decision, frequency } from "@/lib/engine";
import { SketchMark } from "@/components/SketchMarks";
import {
  HIDDEN_DEFAULTS,
  SETUP_DEFAULTS,
  clearMoneyProfile,
  loadMoneyProfile,
  saveMoneyProfile,
  todayLocalISO,
  type MoneyProfile,
} from "@/lib/profile";

type LedgerSnapshot = {
  currentSavings: number;
  safeToSpend: number;
};

type EvaluateResult = {
  decision: Decision;
  suggestedPurchaseDate: string;
  earliestAffordableDate: string;
  desiredPurchaseDate: string;
  paychequesNeeded: number | null;
  freeCashFlow: number;
  riskFactors: string[];
  before: LedgerSnapshot;
  after: LedgerSnapshot;
};

const FREQUENCIES: { value: frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const frequencyLabel: Record<frequency, string> = {
  weekly: "weekly",
  biweekly: "biweekly",
  monthly: "monthly",
  yearly: "yearly",
};

const money = (n: number) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const decisionLabel: Record<Decision, string> = {
  yes: "Yes — you can buy this",
  wait: "Wait — save a bit first",
  risky: "Risky — covered, but watch the warnings",
  no: "No — not by that date",
};

type Screen = "boot" | "setup" | "check";

type SetupDraft = {
  currentSavings: string;
  paycheque: string;
  paychequeFrequency: frequency;
  expenses: string;
  expensesFrequency: frequency;
};

const emptyDraft = (): SetupDraft => ({
  currentSavings: "",
  paycheque: "",
  paychequeFrequency: SETUP_DEFAULTS.paychequeFrequency,
  expenses: "",
  expensesFrequency: SETUP_DEFAULTS.expensesFrequency,
});

function draftFromProfile(profile: MoneyProfile): SetupDraft {
  return {
    currentSavings: String(profile.currentSavings),
    paycheque: String(profile.paycheque),
    paychequeFrequency: profile.paychequeFrequency,
    expenses: String(profile.expenses),
    expensesFrequency: profile.expensesFrequency,
  };
}

function parseNonNegative(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}

export function AffordabilityForm() {
  const [screen, setScreen] = useState<Screen>("boot");
  const [profile, setProfile] = useState<MoneyProfile | null>(null);
  const [draft, setDraft] = useState<SetupDraft>(emptyDraft);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [desiredPurchaseDate, setDesiredPurchaseDate] = useState("");
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [settling, setSettling] = useState(false);
  const analysisRef = useRef<HTMLElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = loadMoneyProfile();
    setProfile(saved);
    setScreen(saved ? "check" : "setup");
    setDesiredPurchaseDate(todayLocalISO());
    if (saved) {
      setDraft(draftFromProfile(saved));
    }
  }, []);

  useEffect(() => {
    if (!result) return;
    analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  useEffect(() => {
    if (screen !== "check") return;
    priceRef.current?.focus();
  }, [screen]);

  useEffect(() => {
    if (!settling) return;
    const id = window.setTimeout(() => setSettling(false), 400);
    return () => window.clearTimeout(id);
  }, [settling]);

  function openSetup() {
    setError(null);
    setResult(null);
    setDraft(profile ? draftFromProfile(profile) : emptyDraft());
    setScreen("setup");
  }

  function startOver() {
    clearMoneyProfile();
    setProfile(null);
    setDraft(emptyDraft());
    setPurchasePrice("");
    setDesiredPurchaseDate(todayLocalISO());
    setResult(null);
    setError(null);
    setScreen("setup");
  }

  function onSaveSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cash = parseNonNegative(draft.currentSavings);
    const pay = parseNonNegative(draft.paycheque);
    const bills = parseNonNegative(draft.expenses);

    if (cash === null || pay === null || bills === null) {
      setError("Enter cash, paycheck, and bills as numbers 0 or more.");
      return;
    }

    const next: MoneyProfile = {
      currentSavings: cash,
      paycheque: pay,
      paychequeFrequency: draft.paychequeFrequency,
      expenses: bills,
      expensesFrequency: draft.expensesFrequency,
    };

    saveMoneyProfile(next);
    setProfile(next);
    setError(null);
    setScreen("check");
  }

  async function onCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      setError("Save your money first.");
      setScreen("setup");
      return;
    }

    const price = parseNonNegative(purchasePrice);
    if (price === null || price <= 0) {
      setError("Enter a purchase price.");
      return;
    }

    const date = desiredPurchaseDate.trim() || todayLocalISO();

    setError(null);
    setSettling(false);
    setPending(true);

    const payload = {
      paycheque: profile.paycheque,
      paychequeFrequency: profile.paychequeFrequency,
      expenses: profile.expenses,
      expensesFrequency: profile.expensesFrequency,
      currentSavings: profile.currentSavings,
      minimumBuffer: HIDDEN_DEFAULTS.minimumBuffer,
      purchasePrice: price,
      desiredPurchaseDate: date,
      purchaseCategory: HIDDEN_DEFAULTS.purchaseCategory,
      savingsCommitment: HIDDEN_DEFAULTS.savingsCommitment,
      savingsCommitmentFrequency: HIDDEN_DEFAULTS.savingsCommitmentFrequency,
    };

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as EvaluateResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Evaluation failed");
      }

      setResult(data);
      setSettling(true);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (screen === "boot") {
    return <div className="mt-8 min-h-48" />;
  }

  if (screen === "setup") {
    return (
      <div className="mt-8 flex w-full flex-col">
        <section className="border-t border-foreground/15 py-10">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your money
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
            Once, on this phone. Paycheck can be biweekly while bills are
            monthly. Change this later if rent or pay changes.
          </p>

          <form
            onSubmit={onSaveSetup}
            className="mt-8 grid gap-4 sm:grid-cols-2"
            noValidate
          >
            <Field
              label="Cash in the bank"
              name="currentSavings"
              type="number"
              className="sm:col-span-2"
              value={draft.currentSavings}
              onChange={(value) =>
                setDraft((prev) => ({ ...prev, currentSavings: value }))
              }
            />
            <Field
              label="Paycheck"
              name="paycheque"
              type="number"
              value={draft.paycheque}
              onChange={(value) =>
                setDraft((prev) => ({ ...prev, paycheque: value }))
              }
            />
            <Select
              label="How often you get paid"
              name="paychequeFrequency"
              options={FREQUENCIES}
              value={draft.paychequeFrequency}
              onChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  paychequeFrequency: value as frequency,
                }))
              }
            />
            <Field
              label="Bills"
              name="expenses"
              type="number"
              value={draft.expenses}
              onChange={(value) =>
                setDraft((prev) => ({ ...prev, expenses: value }))
              }
            />
            <Select
              label="How often those bills hit"
              name="expensesFrequency"
              options={FREQUENCIES}
              value={draft.expensesFrequency}
              onChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  expensesFrequency: value as frequency,
                }))
              }
            />

            <div className="col-span-full flex flex-wrap items-center gap-4 pt-2">
              <button
                type="submit"
                className="btn-check relative z-10 min-h-12 cursor-pointer touch-manipulation border border-foreground bg-foreground px-5 py-3 text-sm font-medium text-white"
              >
                {profile ? "Save money" : "Save and continue"}
              </button>
              {profile ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setScreen("check");
                  }}
                  className="text-sm text-muted underline-offset-4 hover:underline"
                >
                  Cancel
                </button>
              ) : null}
              {error ? <p className="text-sm text-no">{error}</p> : null}
            </div>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="mt-8 flex w-full flex-col">
      {profile ? (
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-foreground/15 pt-8">
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            {money(profile.paycheque)} {frequencyLabel[profile.paychequeFrequency]}{" "}
            paycheck · {money(profile.expenses)}{" "}
            {frequencyLabel[profile.expensesFrequency]} bills ·{" "}
            {money(profile.currentSavings)} cash
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={openSetup}
              className="text-sm text-muted underline-offset-4 hover:underline"
            >
              Edit money
            </button>
            <button
              type="button"
              onClick={startOver}
              className="text-sm text-muted underline-offset-4 hover:underline"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}

      <form onSubmit={onCheck} className="flex flex-col pt-8" noValidate>
        <label className="grid gap-3">
          <span className="text-muted">Price</span>
          <input
            ref={priceRef}
            name="purchasePrice"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={purchasePrice}
            onChange={(event) => setPurchasePrice(event.target.value)}
            placeholder="0"
            className="border border-foreground bg-white px-4 py-4 font-[family-name:var(--font-mono)] text-4xl outline-none focus:bg-[#f7f7f7] sm:text-5xl"
          />
        </label>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="Buy by"
            name="desiredPurchaseDate"
            type="date"
            value={desiredPurchaseDate}
            onChange={setDesiredPurchaseDate}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className={`btn-check relative z-10 min-h-12 cursor-pointer touch-manipulation border border-foreground bg-foreground px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed ${
              pending ? "is-pending" : ""
            } ${settling ? "is-settling" : ""}`}
          >
            {pending ? "Checking…" : "Can I afford it?"}
          </button>
          {error ? <p className="text-sm text-no">{error}</p> : null}
        </div>
      </form>

      {result ? (
        <section
          ref={analysisRef}
          key={`${result.decision}-${result.suggestedPurchaseDate}`}
          className="scroll-mt-20 pt-10 pb-10"
          aria-live="polite"
        >
          <div className="analysis-in relative border border-foreground bg-white p-8 sm:p-10">
            <SketchMark
              label="the answer"
              side="right"
              delayMs={200}
              doodle="check"
              className="sketch-on-mount"
            />
            <header className="flex items-baseline gap-4">
              <span className="font-[family-name:var(--font-mono)] text-xs tracking-[0.18em] text-muted">
                02
              </span>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Analysis
              </h2>
            </header>

            <h2
              className={`analysis-in analysis-delay-1 mt-8 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight decision-${result.decision} sm:text-5xl`}
            >
              {decisionLabel[result.decision]}
            </h2>

            {result.riskFactors.length > 0 ? (
              <ul className="analysis-in analysis-delay-2 mt-8 grid max-w-xl gap-3">
                {result.riskFactors.map((factor) => (
                  <li
                    key={factor}
                    className="border-l-2 border-foreground pl-4 text-base leading-relaxed text-muted"
                  >
                    {factor}
                  </li>
                ))}
              </ul>
            ) : null}

            {result.paychequesNeeded == null || result.paychequesNeeded > 0 ? (
              <p className="analysis-in analysis-delay-2 mt-6 max-w-xl font-[family-name:var(--font-mono)] text-sm text-muted">
                {timelineCopy(result)}
              </p>
            ) : null}
          </div>

          <div className="analysis-in analysis-delay-3 mt-4">
            <WhatIfSnapshot
              before={result.before}
              after={result.after}
              freeCashFlow={result.freeCashFlow}
              desiredPurchaseDate={result.desiredPurchaseDate}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function localDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function timelineCopy(result: EvaluateResult): string {
  if (result.paychequesNeeded == null) {
    return "Unreachable on current free cash flow.";
  }

  const n = result.paychequesNeeded;
  const cheques = `${n} paycheque${n === 1 ? "" : "s"}`;
  const earliest = localDateLabel(result.earliestAffordableDate);
  const desired = localDateLabel(result.desiredPurchaseDate);

  if (result.decision === "no") {
    return `Earliest: ${earliest} · ${cheques}`;
  }

  if (earliest !== desired) {
    return `Ready as early as ${earliest} · ${cheques} (you asked for ${desired})`;
  }

  return `Ready by ${earliest} · ${cheques}`;
}

function WhatIfSnapshot({
  before,
  after,
  freeCashFlow,
  desiredPurchaseDate,
}: {
  before: LedgerSnapshot;
  after: LedgerSnapshot;
  freeCashFlow: number;
  desiredPurchaseDate: string;
}) {
  const cashDelta = after.currentSavings - before.currentSavings;
  const maxCash = Math.max(
    Math.abs(before.currentSavings),
    Math.abs(after.currentSavings),
    1,
  );
  const maxSafe = Math.max(
    Math.abs(before.safeToSpend),
    Math.abs(after.safeToSpend),
    1,
  );

  const headline =
    cashDelta === 0
      ? "Your cash doesn’t move"
      : cashDelta < 0
        ? `Cash drops ${money(-cashDelta)}`
        : `After the buy, cash is still up ${money(cashDelta)}`;

  const badge =
    cashDelta === 0
      ? "No change"
      : `${cashDelta < 0 ? "−" : "+"}${money(Math.abs(cashDelta))}`;

  const buyDate = localDateLabel(desiredPurchaseDate);

  return (
    <aside className="bg-foreground text-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/20 px-6 py-5 sm:px-8">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.16em] text-white/55">
            {`If you buy on ${buyDate}`}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {headline}
          </p>
        </div>
        <span className="border border-white/35 px-2.5 py-1 font-[family-name:var(--font-mono)] text-xs tracking-[0.12em]">
          {badge}
        </span>
      </div>

      <div className="grid sm:grid-cols-2">
        <SnapshotColumn
          label="Now"
          cash={before.currentSavings}
          safe={before.safeToSpend}
          cashMax={maxCash}
          safeMax={maxSafe}
        />
        <SnapshotColumn
          label={`After ${buyDate}`}
          cash={after.currentSavings}
          safe={after.safeToSpend}
          cashMax={maxCash}
          safeMax={maxSafe}
          dimmed={cashDelta !== 0}
          last
        />
      </div>

      <p className="border-t border-white/20 px-6 py-5 text-sm leading-relaxed text-white/70 sm:px-8">
        {cashDelta === 0
          ? `Fits in this paycheque’s free cash (${money(freeCashFlow)}). Savings stay put.`
          : `Left column is what you entered. Right column is cash on ${buyDate} after income, expenses, and this purchase. Free cash per paycheque is ${money(freeCashFlow)}.`}
      </p>
    </aside>
  );
}

function SnapshotColumn({
  label,
  cash,
  safe,
  cashMax,
  safeMax,
  dimmed = false,
  last = false,
}: {
  label: string;
  cash: number;
  safe: number;
  cashMax: number;
  safeMax: number;
  dimmed?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`px-6 py-6 sm:px-8 ${last ? "border-t border-white/20 sm:border-t-0 sm:border-l" : ""}`}
    >
      <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.16em] text-white/55">
        {label}
      </p>
      <SnapshotMeter
        caption="Cash"
        amount={cash}
        max={cashMax}
        dimmed={dimmed}
      />
      <SnapshotMeter
        caption="Safe to spend"
        amount={safe}
        max={safeMax}
        dimmed={dimmed}
      />
    </div>
  );
}

function SnapshotMeter({
  caption,
  amount,
  max,
  dimmed,
}: {
  caption: string;
  amount: number;
  max: number;
  dimmed: boolean;
}) {
  const target = `${(Math.abs(amount) / max) * 100}%`;
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setGrown(true);
      return;
    }
    const id = window.setTimeout(() => setGrown(true), 280);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-white/55">{caption}</span>
        <span className="font-[family-name:var(--font-mono)] text-xl">
          {money(amount)}
        </span>
      </div>
      <div className="mt-2 h-2 bg-white/15">
        <div
          className={`meter-fill h-full ${dimmed ? "bg-white/45" : "bg-white"} ${
            grown ? "is-grown" : ""
          }`}
          style={{ width: grown ? target : "0%" }}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  value,
  onChange,
  className,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm ${className ?? ""}`}>
      <span className="text-muted">{label}</span>
      <input
        name={name}
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-foreground bg-white px-3 py-2.5 font-[family-name:var(--font-mono)] text-base outline-none focus:bg-[#f7f7f7]"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-foreground bg-white px-3 py-2.5 text-base outline-none focus:bg-[#f7f7f7]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
