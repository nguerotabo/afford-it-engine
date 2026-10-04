import { expect, test, describe } from "vitest";
import { evaluateAffordability } from "../src/core/engine";
import { parseAffordabilityInput } from "../src/core/parseInput";
import { baseInput, daysFromNow, today } from "./helpers";

describe("decision: yes", () => {
  test("affordable now with low paycheque impact", () => {
    // impact = 400/500 = 0.8 ≤ 1 → no impact warn; wants → yes
    const desiredPurchaseDate = today();
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

  test("covered but luxury with thin cushion", () => {
    // High expenses → 2-month cushion bar is high; price still leaves remainingAfter ≥ 0
    // and impact ≤ 1 so only luxury warns.
    const output = evaluateAffordability(
      baseInput({
        paycheque: 2500,
        expenses: 2000,
        purchasePrice: 400,
        purchaseCategory: "luxury",
      }),
    );

    expect(output.decision).toBe("risky");
    expect(output.riskFactors).toEqual([
      "Luxury purchase — thin cushion after the buy.",
    ]);
  });

  test("luxury with comfortable cushion → yes", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 400,
        purchaseCategory: "luxury",
      }),
    );

    // remainingAfter 2800 ≥ ~2 months of $300/week expenses
    expect(output.decision).toBe("yes");
    expect(output.riskFactors).toEqual([]);
  });

  test("exact boundary remainingAfter === 0 with high impact → risky", () => {
    const output = evaluateAffordability(baseInput({ purchasePrice: 3200 }));

    expect(output.decision).toBe("risky");
    expect(output.remainingAfter).toBe(0);
    expect(output.paychequesNeeded).toBe(1);
  });
});

describe("decision: reachable by desired date", () => {
  test("shortfall today but covered by desired date → yes", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 5000,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.decision).toBe("yes");
    expect(output.paychequesNeeded).toBe(10);
    expect(output.remainingAfter).toBeGreaterThanOrEqual(0);
    expect(output.freeCashFlow).toBe(200);
    expect(output.riskFactors).toEqual([]);
  });

  test("resubmitting earliest as YYYY-MM-DD is covered, not no", () => {
    const first = evaluateAffordability(
      baseInput({
        purchasePrice: 5000,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );
    expect(first.decision).toBe("yes");
    expect(first.remainingAfter).toBeGreaterThanOrEqual(0);

    const earliest = first.earliestAffordableDate;
    const dateOnly = [
      earliest.getFullYear(),
      String(earliest.getMonth() + 1).padStart(2, "0"),
      String(earliest.getDate()).padStart(2, "0"),
    ].join("-");

    const parsed = parseAffordabilityInput({
      paycheque: 500,
      paychequeFrequency: "weekly",
      expenses: 300,
      expensesFrequency: "weekly",
      currentSavings: 5000,
      minimumBuffer: 2000,
      purchasePrice: 5000,
      desiredPurchaseDate: dateOnly,
      purchaseCategory: "wants",
      savingsCommitment: 250,
      savingsCommitmentFrequency: "weekly",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const second = evaluateAffordability(parsed.input);
    expect(second.decision).not.toBe("no");
    expect(second.remainingAfter).toBeGreaterThanOrEqual(0);
  });

  test("one cent under today still covered when the date allows", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 3200.01,
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.decision).toBe("yes");
    expect(output.paychequesNeeded).toBe(2);
    expect(output.remainingAfter).toBeGreaterThan(0);
  });

  test("luxury with comfortable cushion far out → yes", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 400,
        purchaseCategory: "luxury",
        desiredPurchaseDate: daysFromNow(365),
      }),
    );

    expect(output.decision).toBe("yes");
    expect(output.riskFactors).toEqual([]);
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
        expenses: 600,
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
        expenses: 500,
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
  test("yearly expenses normalize into weekly paycheque cycle; savings ignored", () => {
    const output = evaluateAffordability(
      baseInput({
        expenses: 5200,
        expensesFrequency: "yearly",
        savingsCommitment: 13000,
        savingsCommitmentFrequency: "yearly",
        purchasePrice: 400,
      }),
    );

    // weekly expenses = 100; FCF = 500 - 100 = 400
    expect(output.freeCashFlow).toBe(400);
    expect(output.decision).toBe("yes");
  });

  test("biweekly paycheque with weekly expenses; savings ignored", () => {
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

    // biweekly expenses = 100; FCF = 1000 - 100 = 900
    expect(output.freeCashFlow).toBe(900);
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
        desiredPurchaseDate: today(),
      }),
    );

    expect(output.safeToSpend).toBe(-500);
    expect(output.remainingAfter).toBe(-400);
    expect(output.decision).toBe("no");
    expect(output.paychequesNeeded).toBe(3);
  });

  test("buffer larger than savings → negative safeToSpend", () => {
    const output = evaluateAffordability(
      baseInput({
        currentSavings: 1000,
        minimumBuffer: 2000,
        purchasePrice: 100,
        desiredPurchaseDate: today(),
      }),
    );

    expect(output.safeToSpend).toBe(-1000);
    expect(output.decision).toBe("no");
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

  test("shortfall today with desired = today → no (not wait)", () => {
    const output = evaluateAffordability(
      baseInput({
        currentSavings: -500,
        minimumBuffer: 0,
        purchasePrice: 100,
        desiredPurchaseDate: today(),
      }),
    );

    expect(output.decision).toBe("no");
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
});

describe("what-if ledger", () => {
  // baseInput: cash 5000, buffer 2000 → safe 3000; FCF 200

  test("yes within FCF: cash unchanged before → after", () => {
    const output = evaluateAffordability(baseInput({ purchasePrice: 150 }));

    expect(output.decision).toBe("yes");
    expect(output.before).toEqual({
      currentSavings: 5000,
      safeToSpend: 3000,
    });
    // price 150 ≤ FCF 200 → fromSavings 0
    expect(output.after).toEqual({
      currentSavings: 5000,
      safeToSpend: 3000,
    });
  });

  test("risky above FCF: after dips cash and differs from yes after-state", () => {
    const yes = evaluateAffordability(baseInput({ purchasePrice: 150 }));
    const risky = evaluateAffordability(baseInput({ purchasePrice: 3000 }));

    expect(risky.decision).toBe("risky");
    expect(risky.before).toEqual({
      currentSavings: 5000,
      safeToSpend: 3000,
    });
    // fromFcf 200, fromSavings 2800 → cash 2200, safe 200
    expect(risky.after).toEqual({
      currentSavings: 2200,
      safeToSpend: 200,
    });
    expect(risky.after.currentSavings).not.toBe(yes.after.currentSavings);
  });

  test("no: still shows after-state if purchase applied on the desired date", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 10_000,
        desiredPurchaseDate: daysFromNow(1),
      }),
    );

    expect(output.decision).toBe("no");
    expect(output.before.currentSavings).toBe(5000);
    // fromFcf 200, fromSavings 9800 → cash -4800
    expect(output.after).toEqual({
      currentSavings: -4800,
      safeToSpend: -6800,
    });
    expect(output.after.currentSavings).toBeLessThan(
      output.before.currentSavings,
    );
  });

  test("projects cash to the desired date on after; before stays what the user entered", () => {
    const output = evaluateAffordability(
      baseInput({
        purchasePrice: 150,
        desiredPurchaseDate: daysFromNow(14),
      }),
    );

    expect(output.decision).toBe("yes");
    expect(output.before).toEqual({
      currentSavings: 5000,
      safeToSpend: 3000,
    });
    // 2 weekly cheques of FCF 200, then −150
    expect(output.after).toEqual({
      currentSavings: 5250,
      safeToSpend: 3250,
    });
  });

  test("negative FCF shrinks after-cash by the desired date; before stays now", () => {
    const output = evaluateAffordability(
      baseInput({
        expenses: 600,
        purchasePrice: 0,
        desiredPurchaseDate: daysFromNow(14),
      }),
    );

    expect(output.freeCashFlow).toBe(-100);
    expect(output.before.currentSavings).toBe(5000);
    expect(output.after.currentSavings).toBe(4800);
  });
});
