import { expect, test, describe } from "vitest";
import { evaluateAffordability } from "../src/core/engine";
import { baseInput, daysFromNow } from "./helpers";

describe("decision: yes", () => {
  test("affordable now", () => {
    // FCF = 200, safeToSpend = 3000, price = 3000 → remainingAfter = 200
    const desiredPurchaseDate = new Date("2026-10-30");
    const output = evaluateAffordability(
      baseInput({ purchasePrice: 3000, desiredPurchaseDate }),
    );

    expect(output.decision).toBe("yes");
    expect(output.suggestedPurchaseDate).toEqual(desiredPurchaseDate);
    expect(output.paychequesNeeded).toBe(0);
    expect(output.safeToSpend).toBe(3000);
    expect(output.freeCashFlow).toBe(200);
    expect(output.remainingAfter).toBe(200);
    expect(output.paychequeImpact).toBe(6);
    expect(output.totalImpact).toBe(3000 / 3200);
    expect(output.affordabilityScore).toBe(output.paychequeImpact);
  });

  test("exact boundary remainingAfter === 0", () => {
    // remainingAfter includes FCF: 3000 + 200 - 3200 = 0 → yes
    // paychequesNeeded ignores current FCF: ceil((3200-3000)/200) = 1
    const output = evaluateAffordability(baseInput({ purchasePrice: 3200 }));

    expect(output.decision).toBe("yes");
    expect(output.remainingAfter).toBe(0);
    expect(output.paychequesNeeded).toBe(1);
  });

  test("covered by cash alone (FCF unused)", () => {
    // safeToSpend = 3000 covers price; remainingAfter = 3000 + 200 - 2500 = 700
    const output = evaluateAffordability(baseInput({ purchasePrice: 2500 }));

    expect(output.decision).toBe("yes");
    expect(output.paychequesNeeded).toBe(0);
    expect(output.remainingAfter).toBe(700);
  });

  test("zero buffer still yes when cash covers", () => {
    const output = evaluateAffordability(
      baseInput({
        minimumBuffer: 0,
        currentSavings: 5000,
        purchasePrice: 4000,
      }),
    );

    // safeToSpend = 5000, remainingAfter = 5000 + 200 - 4000 = 1200
    expect(output.decision).toBe("yes");
    expect(output.safeToSpend).toBe(5000);
  });
});

describe("decision: wait", () => {
  test("shortfall reachable before desired date", () => {
    // shortfall = 5000 - 3000 = 2000 → 10 weekly paycheques (~70 days)
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 5000,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.decision).toBe("wait");
    expect(output.paychequesNeeded).toBe(10);
    expect(output.remainingAfter).toBe(-1800);
    expect(output.freeCashFlow).toBe(200);
    expect(output.suggestedPurchaseDate.getTime()).toBeLessThan(
      daysFromNow(365).getTime(),
    );
  });

  test("one cent under affordable still waits when date allows", () => {
    // remainingAfter = 3000 + 200 - 3200.01 = -0.01
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 3200.01,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.decision).toBe("wait");
    expect(output.paychequesNeeded).toBe(2); // ceil(200.01 / 200)
    expect(output.remainingAfter).toBeCloseTo(-0.01, 2);
  });
});

describe("decision: no", () => {
  test("reachable eventually but misses desired date", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 5000,
        desiredPurchaseDate: daysFromNow(7), // needs ~70 days
      }),
    );

    expect(output.decision).toBe("no");
    expect(output.paychequesNeeded).toBe(10);
    expect(output.suggestedPurchaseDate.getTime()).toBeGreaterThan(
      daysFromNow(7).getTime(),
    );
  });

  test("FCF ≤ 0 → unreachable", () => {
    const desiredPurchaseDate = daysFromNow(365);
    const output = evaluateAffordability(
      baseInput({
        expenses: 400,
        savingsCommitment: 200, // FCF = 500 - 400 - 200 = -100
        purchasePrice: 5000,
        desiredPurchaseDate,
      }),
    );

    expect(output.decision).toBe("no");
    expect(output.freeCashFlow).toBe(-100);
    expect(output.paychequesNeeded).toBe(Infinity);
    expect(output.suggestedPurchaseDate).toEqual(desiredPurchaseDate);
  });

  test("zero FCF with shortfall → no", () => {
    const output = evaluateAffordability(
      baseInput({
        expenses: 250,
        savingsCommitment: 250, // FCF = 0
        purchasePrice: 5000,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.decision).toBe("no");
    expect(output.freeCashFlow).toBe(0);
    expect(output.paychequesNeeded).toBe(Infinity);
  });

  test("huge purchase with positive FCF still finite paycheques", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 1_000_000,
        desiredPurchaseDate: daysFromNow(7),
      }),
    );

    expect(output.decision).toBe("no");
    expect(Number.isFinite(output.paychequesNeeded)).toBe(true);
    expect(output.paychequesNeeded).toBe(Math.ceil((1_000_000 - 3000) / 200));
  });
});

describe("frequency normalization in engine", () => {
  test("monthly expenses normalize into weekly paycheque cycle", () => {
    // expenses $520/year equivalent: $10/week → use $520 yearly? better:
    // $433.333.../month ≈ $100/week; use exact annual path
    // expenses 5200 yearly → weekly = 100
    // savings 13000 yearly → weekly = 250
    // FCF = 500 - 100 - 250 = 150
    const output = evaluateAffordability(
      baseInput({
        expenses: 5200,
        expensesFrequency: "yearly",
        savingsCommitment: 13000,
        savingsCommitmentFrequency: "yearly",
        purchasePrice: 1000,
      }),
    );

    expect(output.freeCashFlow).toBe(150);
    expect(output.decision).toBe("yes");
  });

  test("biweekly paycheque with weekly expenses", () => {
    // paycheque 1000 biweekly
    // expenses 50 weekly → (50*52)/26 = 100 biweekly
    // savings 100 weekly → 200 biweekly
    // FCF = 1000 - 100 - 200 = 700
    const output = evaluateAffordability(
      baseInput({
        paycheque: 1000,
        paychequeFrequency: "biweekly",
        expenses: 50,
        expensesFrequency: "weekly",
        savingsCommitment: 100,
        savingsCommitmentFrequency: "weekly",
        purchasePrice: 500,
      }),
    );

    expect(output.freeCashFlow).toBe(700);
    expect(output.decision).toBe("yes");
  });
});

describe("money / float behavior", () => {
  test("cent prices do not collapse floats", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 19.99,
        currentSavings: 100,
        minimumBuffer: 0,
        expenses: 0,
        savingsCommitment: 0,
      }),
    );

    expect(output.decision).toBe("yes");
    expect(output.remainingAfter).toBeCloseTo(100 + 500 - 19.99, 2);
  });
});

describe("edge cases", () => {
  test("zero income → Infinity impacts, no if shortfall", () => {
    const output = evaluateAffordability(
      baseInput({
        paycheque: 0,
        expenses: 0,
        savingsCommitment: 0,
        purchasePrice: 5000,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.freeCashFlow).toBe(0);
    expect(output.paychequeImpact).toBe(Infinity);
    expect(output.paychequesNeeded).toBe(Infinity);
    expect(output.decision).toBe("no");
  });

  test("negative cash (buffer breach) still computes", () => {
    const output = evaluateAffordability(
      baseInput({
        currentSavings: -500,
        minimumBuffer: 0,
        purchasePrice: 100,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    // safeToSpend = -500, remainingAfter = -500 + 200 - 100 = -400
    expect(output.safeToSpend).toBe(-500);
    expect(output.remainingAfter).toBe(-400);
    expect(output.decision).toBe("wait");
    expect(output.paychequesNeeded).toBe(3); // ceil(600/200)
  });

  test("buffer larger than savings → negative safeToSpend", () => {
    const output = evaluateAffordability(
      baseInput({
        currentSavings: 1000,
        minimumBuffer: 2000,
        purchasePrice: 100,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.safeToSpend).toBe(-1000);
    expect(output.decision).toBe("wait");
  });

  test("zero purchase price → yes", () => {
    const output = evaluateAffordability(baseInput({ purchasePrice: 0 }));

    expect(output.decision).toBe("yes");
    expect(output.paychequesNeeded).toBe(0);
    expect(output.paychequeImpact).toBe(0);
  });
});

describe("invariants", () => {
  test("yes ⇒ remainingAfter >= 0", () => {
    const cases = [
      baseInput({ purchasePrice: 3000 }),
      baseInput({ purchasePrice: 3200 }),
      baseInput({ purchasePrice: 100 }),
    ];

    for (const input of cases) {
      const output = evaluateAffordability(input);
      expect(output.decision).toBe("yes");
      expect(output.remainingAfter).toBeGreaterThanOrEqual(0);
    }
  });

  test("wait ⇒ finite paychequesNeeded > 0 and remainingAfter < 0", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 5000,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.decision).toBe("wait");
    expect(output.remainingAfter).toBeLessThan(0);
    expect(output.paychequesNeeded).toBeGreaterThan(0);
    expect(Number.isFinite(output.paychequesNeeded)).toBe(true);
  });

  test("same input → same decision and metrics", () => {
    const input = baseInput({
      purchasePrice: 5000,
      desiredPurchaseDate: daysFromNow(365),
    });
    const a = evaluateAffordability(input);
    const b = evaluateAffordability(input);

    expect(a.decision).toBe(b.decision);
    expect(a.paychequesNeeded).toBe(b.paychequesNeeded);
    expect(a.remainingAfter).toBe(b.remainingAfter);
    expect(a.freeCashFlow).toBe(b.freeCashFlow);
    expect(a.safeToSpend).toBe(b.safeToSpend);
    expect(a.paychequeImpact).toBe(b.paychequeImpact);
    expect(a.totalImpact).toBe(b.totalImpact);
  });

  test("affordabilityScore mirrors paychequeImpact", () => {
    const output = evaluateAffordability(baseInput({ purchasePrice: 2500 }));
    expect(output.affordabilityScore).toBe(output.paychequeImpact);
  });
});
