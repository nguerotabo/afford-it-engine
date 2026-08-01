"use client";

import { useState, type FormEvent } from "react";
import type { Decision, frequency } from "@/lib/engine";

type EvaluateResult = {
  decision: Decision;
  reason: string;
  suggestedPurchaseDate: string;
  safeToSpend: number;
  paychequesNeeded: number | null;
  totalImpact: number | null;
  paychequeImpact: number | null;
  affordabilityScore: number | null;
  remainingAfter: number;
  freeCashFlow: number;
};

const FREQUENCIES: frequency[] = ["weekly", "biweekly", "monthly", "yearly"];

const money = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 3,
  });

const pct = (ratio: number | null) =>
  ratio == null ? "—" : `${(ratio * 100).toFixed(0)}%`;

const decisionLabel: Record<Decision, string> = {
  yes: "Yes — you can buy this",
  wait: "Wait — save a bit first",
  no: "No — not by that date",
};

export function AffordabilityForm() {
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);

    const payload = {
      paycheque: Number(form.get("paycheque")),
      paychequeFrequency: String(form.get("paychequeFrequency")) as frequency,
      expenses: Number(form.get("expenses")),
      expensesFrequency: String(form.get("expensesFrequency")) as frequency,
      currentSavings: Number(form.get("currentSavings")),
      minimumBuffer: Number(form.get("minimumBuffer")),
      purchasePrice: Number(form.get("purchasePrice")),
      desiredPurchaseDate: String(form.get("desiredPurchaseDate")),
      purchaseCategory: String(form.get("purchaseCategory")) as
        | "wants"
        | "needs"
        | "luxury",
      savingsCommitment: Number(form.get("savingsCommitment")),
      savingsCommitmentFrequency: String(
        form.get("savingsCommitmentFrequency"),
      ) as frequency,
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
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <form
        onSubmit={onSubmit}
        className="animate-rise-delay grid gap-6 border-t border-line pt-8"
      >
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Purchase price" name="purchasePrice" type="number" defaultValue="800" />
          <Field
            label="Desired purchase date"
            name="desiredPurchaseDate"
            type="date"
            defaultValue="2026-10-15"
          />
          <Select
            label="Category"
            name="purchaseCategory"
            options={[
              { value: "needs", label: "Needs" },
              { value: "wants", label: "Wants" },
              { value: "luxury", label: "Luxury" },
            ]}
            defaultValue="wants"
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Paycheque amount" name="paycheque" type="number" defaultValue="1200" />
          <Select
            label="Pay frequency"
            name="paychequeFrequency"
            options={FREQUENCIES.map((f) => ({ value: f, label: f }))}
            defaultValue="biweekly"
          />
          <Field label="Expenses" name="expenses" type="number" defaultValue="700" />
          <Select
            label="Expense frequency"
            name="expensesFrequency"
            options={FREQUENCIES.map((f) => ({ value: f, label: f }))}
            defaultValue="biweekly"
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Current savings / cash"
            name="currentSavings"
            type="number"
            defaultValue="1500"
          />
          <Field
            label="Minimum buffer"
            name="minimumBuffer"
            type="number"
            defaultValue="500"
          />
          <Field
            label="Savings commitment"
            name="savingsCommitment"
            type="number"
            defaultValue="100"
          />
          <Select
            label="Savings frequency"
            name="savingsCommitmentFrequency"
            options={FREQUENCIES.map((f) => ({ value: f, label: f }))}
            defaultValue="biweekly"
          />
        </section>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="bg-accent px-6 py-3 font-[family-name:var(--font-display)] text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Checking…" : "Can I afford it?"}
          </button>
          {error ? <p className="text-sm text-no">{error}</p> : null}
        </div>
      </form>

      {result ? (
        <section
          key={`${result.decision}-${result.suggestedPurchaseDate}`}
          className="animate-rise border-t border-line pt-8"
          aria-live="polite"
        >
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Verdict</p>
          <h2
            className={`mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight decision-${result.decision}`}
          >
            {decisionLabel[result.decision]}
          </h2>
          <p className="mt-3 max-w-xl text-muted">{result.reason}</p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <Metric label="Safe to spend" value={money(result.safeToSpend)} />
            <Metric
              label="Free cash remaining after purchase"
              value={money(result.remainingAfter)}
            />
            <Metric
              label="Free cash flow / paycheque"
              value={money(result.freeCashFlow)}
            />
            <Metric
              label="Paycheques needed"
              value={
                result.paychequesNeeded == null
                  ? "Unreachable"
                  : String(result.paychequesNeeded)
              }
            />
            <Metric
              label="Suggested purchase date"
              value={new Date(result.suggestedPurchaseDate).toLocaleDateString()}
            />
            <Metric label="Paycheque impact" value={pct(result.paychequeImpact)} />
            <Metric label="Total impact" value={pct(result.totalImpact)} />
          </dl>
        </section>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        defaultValue={defaultValue}
        className="border border-line bg-surface px-3 py-2.5 outline-none transition focus:border-accent"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <select
        name={name}
        required
        defaultValue={defaultValue}
        className="border border-line bg-surface px-3 py-2.5 outline-none transition focus:border-accent"
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-line pl-3">
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 font-[family-name:var(--font-display)] text-xl font-medium">
        {value}
      </dd>
    </div>
  );
}
