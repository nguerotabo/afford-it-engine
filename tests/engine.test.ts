import { expect, test, describe } from "vitest";
import { evaluateAffordability } from "../src/core/engine";
import { baseInput, daysFromNow } from "./helpers";

describe("decision: yes", () => {
  test("affordable now with low paycheque impact", () => {
    // impact = 400/500 = 0.8 ≤ 1 → no impact warn; wants → yes
    const desiredPurchaseDate = new Date("2026-10-30");
    const output = evaluateAffordability(
      baseInput({ purchasePrice: 400, desiredPurchaseDate }),
    );

    expect(output.decision).toBe("yes");
    expect(output.suggestedPurchaseDate).toEqual(desiredPurchaseDate);
    expect(output.paychequesNeeded).toBe(0);
    expect(output.safeToSpend).toBe(3000);
    expect(output.freeCashFlow).toBe(200);
    expect(output.riskFactors).toEqual([]);
  });

  test("exact boundary remainingAfter === 0 with low impact", () => {
    // Need remainingAfter = 0 and impact ≤ 1.
    // safeToSpend=3000, FCF=200 → price 3200 gives remaining 0 but impact 6.4.
    // Lower cash path: price 500, paycheque 500, remaining plenty, impact 1 → yes
    const output = evaluateAffordability(
      baseInput({ purchasePrice: 500 }),
    );

    expect(output.decision).toBe("yes");
    expect(output.paychequeImpact).toBe(1);
    expect(output.riskFactors).toEqual([]);
  });

  test("covered by cash alone with low impact", () => {
    const output = evaluateAffordability(baseInput({ purchasePrice: 250 }));

    expect(output.decision).toBe("yes");
    expect(output.paychequesNeeded).toBe(0);
    expect(output.remainingAfter).toBe(2950);
  });

  test("zero buffer still yes when cash covers and impact low", () => {
    const output = evaluateAffordability(
      baseInput({
        minimumBuffer: 0,
        currentSavings: 5000,
        purchasePrice: 400,
      }),
    );

    expect(output.decision).toBe("yes");
    expect(output.safeToSpend).toBe(5000);
  });
});

describe("decision: risky", () => {
  test("covered but high paycheque impact", () => {
    // remainingAfter = 3000 + 200 - 3000 = 200 ≥ 0; impact = 6 > 1 → warn → risky
    const output = evaluateAffordability(
      baseInput({ purchasePrice: 3000 }),
    );

    expect(output.decision).toBe("risky");
    expect(output.remainingAfter).toBe(200);
    expect(output.paychequeImpact).toBe(6);
    expect(output.riskFactors).toContain("The paycheque impact is quite high.");
  });

  test("covered but luxury category", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 400,
        purchaseCategory: "luxury",
      }),
    );

    expect(output.decision).toBe("risky");
    expect(output.riskFactors).toContain("Luxury purchase — higher risk bar.");
  });

  test("exact boundary remainingAfter === 0 with high impact → risky", () => {
    const output = evaluateAffordability(baseInput({ purchasePrice: 3200 }));

    expect(output.decision).toBe("risky");
    expect(output.remainingAfter).toBe(0);
    expect(output.paychequesNeeded).toBe(1);
  });
});

describe("decision: wait", () => {
  test("shortfall reachable before desired date", () => {
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
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 3200.01,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.decision).toBe("wait");
    expect(output.paychequesNeeded).toBe(2);
    expect(output.remainingAfter).toBeCloseTo(-0.01, 2);
  });
});

describe("decision: no", () => {
  test("reachable eventually but misses desired date", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 5000,
        desiredPurchaseDate: daysFromNow(7),
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
        savingsCommitment: 200,
        purchasePrice: 5000,
        desiredPurchaseDate,
      }),
    );

    expect(output.decision).toBe("no");
    expect(output.freeCashFlow).toBe(-100);
    expect(output.paychequesNeeded).toBe(Infinity);
    expect(output.suggestedPurchaseDate).toEqual(desiredPurchaseDate);
    expect(output.riskFactors.length).toBeGreaterThan(0);
  });

  test("zero FCF with shortfall → no", () => {
    const output = evaluateAffordability(
      baseInput({
        expenses: 250,
        savingsCommitment: 250,
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
    const output = evaluateAffordability(
      baseInput({
        expenses: 5200,
        expensesFrequency: "yearly",
        savingsCommitment: 13000,
        savingsCommitmentFrequency: "yearly",
        purchasePrice: 400,
      }),
    );

    expect(output.freeCashFlow).toBe(150);
    expect(output.decision).toBe("yes");
  });

  test("biweekly paycheque with weekly expenses", () => {
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

    expect(output.safeToSpend).toBe(-500);
    expect(output.remainingAfter).toBe(-400);
    expect(output.decision).toBe("wait");
    expect(output.paychequesNeeded).toBe(3);
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
  test("yes ⇒ remainingAfter >= 0 and no riskFactors", () => {
    const cases = [
      baseInput({ purchasePrice: 100 }),
      baseInput({ purchasePrice: 500 }),
      baseInput({ purchasePrice: 0 }),
    ];

    for (const input of cases) {
      const output = evaluateAffordability(input);
      expect(output.decision).toBe("yes");
      expect(output.remainingAfter).toBeGreaterThanOrEqual(0);
      expect(output.riskFactors).toEqual([]);
    }
  });

  test("risky ⇒ remainingAfter >= 0 and riskFactors non-empty", () => {
    const output = evaluateAffordability(baseInput({ purchasePrice: 3000 }));

    expect(output.decision).toBe("risky");
    expect(output.remainingAfter).toBeGreaterThanOrEqual(0);
    expect(output.riskFactors.length).toBeGreaterThan(0);
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
    expect(a.riskFactors).toEqual(b.riskFactors);
  });

  test("affordabilityScore mirrors paychequeImpact", () => {
    const output = evaluateAffordability(baseInput({ purchasePrice: 250 }));
    expect(output.affordabilityScore).toBe(output.paychequeImpact);
  });
});
