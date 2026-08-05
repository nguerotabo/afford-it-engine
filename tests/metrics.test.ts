import { expect, test, describe } from "vitest";
import { calculateMetrics } from "../src/core/metrics";
import { baseInput, daysFromNow } from "./helpers";

describe("calculateMetrics (values in cents)", () => {
  test("baseline weekly inputs", () => {
    // Dollars: FCF=200, safeToSpend=3000, price=3000 → remainingAfter=200
    const metrics = calculateMetrics(baseInput({ purchasePrice: 3000 }));

    expect(metrics.freeCashFlowPerPaycheque).toBe(20_000);
    expect(metrics.safeToSpend).toBe(300_000);
    expect(metrics.remainingAfter).toBe(20_000);
    expect(metrics.paychequesNeeded).toBe(0);
    expect(metrics.paychequeImpact).toBe(6);
    expect(metrics.totalImpact).toBe(300_000 / 320_000);
  });

  test("exact boundary remainingAfter === 0", () => {
    // 3000 + 200 - 3200 = 0 dollars → 0 cents
    const metrics = calculateMetrics(baseInput({ purchasePrice: 3200 }));

    expect(metrics.remainingAfter).toBe(0);
    expect(metrics.paychequesNeeded).toBe(1);
  });

  test("shortfall sets paychequesNeeded and earliest date", () => {
    // shortfall dollars: 5000 - 3000 = 2000 → 10 weekly cheques
    const metrics = calculateMetrics(baseInput({ purchasePrice: 5000 }));

    expect(metrics.remainingAfter).toBe(-180_000);
    expect(metrics.paychequesNeeded).toBe(10);
    expect(metrics.earliestAffordableDate.getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  test("normalizes monthly expenses into weekly paycheque cycle", () => {
    // $200/month → annual $2400 → weekly ≈ $46.15 → 4615 cents after round
    // FCF = 50000 - 4615 - 25000 = 20385
    const metrics = calculateMetrics(
      baseInput({
        expenses: 200,
        expensesFrequency: "monthly",
        purchasePrice: 1000,
      }),
    );

    expect(metrics.freeCashFlowPerPaycheque).toBe(20_385);
  });

  test("zero FCF with shortfall → infinite paychequesNeeded", () => {
    const metrics = calculateMetrics(
      baseInput({
        paycheque: 300,
        expenses: 50,
        savingsCommitment: 250,
        purchasePrice: 5000,
      }),
    );

    expect(metrics.freeCashFlowPerPaycheque).toBe(0);
    expect(metrics.paychequesNeeded).toBe(Infinity);
  });

  test("zero paycheque → infinite paychequeImpact", () => {
    const metrics = calculateMetrics(
      baseInput({
        paycheque: 0,
        expenses: 0,
        savingsCommitment: 0,
        purchasePrice: 100,
      }),
    );

    expect(metrics.paychequeImpact).toBe(Infinity);
  });

  test("does not include a decision", () => {
    const metrics = calculateMetrics(baseInput());

    expect(metrics).not.toHaveProperty("decision");
    expect(metrics).not.toHaveProperty("riskFactors");
  });

  test("earliestAffordableDate ignores desiredPurchaseDate", () => {
    const far = daysFromNow(365);
    const near = daysFromNow(7);

    const a = calculateMetrics(
      baseInput({ purchasePrice: 5000, desiredPurchaseDate: far }),
    );
    const b = calculateMetrics(
      baseInput({ purchasePrice: 5000, desiredPurchaseDate: near }),
    );

    expect(a.earliestAffordableDate.getTime()).toBe(
      b.earliestAffordableDate.getTime(),
    );
    expect(a.paychequesNeeded).toBe(b.paychequesNeeded);
  });
});
