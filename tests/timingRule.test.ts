import { expect, test, describe } from "vitest";
import { timingRule } from "../src/core/rules/timingRule";
import { daysFromNow, ruleContext } from "./helpers";

const rule = new timingRule();

describe("timingRule: ok", () => {
  test("remainingAfter >= 0 — timing is not the constraint", () => {
    const result = rule.evaluate(ruleContext({ remainingAfter: 1000 }));

    expect(result.severity).toBe("ok");
    expect(result.factor).toBe(
      "Purchase is covered by the desired date; timing not required.",
    );
  });

  test("same local calendar day still within reach despite later clock time", () => {
    const result = rule.evaluate(
      ruleContext(
        {
          remainingAfter: -1000,
          paychequesNeeded: 5,
          earliestAffordableDate: new Date(2026, 9, 22, 22, 42),
        },
        { desiredPurchaseDate: new Date(2026, 9, 22) },
      ),
    );

    expect(result.severity).toBe("ok");
    expect(result.factor).toBe("The desired purchase date is within reach.");
  });

  test("shortfall but earliest date is on or before desired date", () => {
    const result = rule.evaluate(
      ruleContext(
        {
          remainingAfter: -1000,
          paychequesNeeded: 10,
          earliestAffordableDate: daysFromNow(70),
        },
        { desiredPurchaseDate: daysFromNow(365) },
      ),
    );

    expect(result.severity).toBe("ok");
    expect(result.factor).toBe("The desired purchase date is within reach.");
  });
});

describe("timingRule: block", () => {
  test("paychequesNeeded is Infinity (FCF ≤ 0)", () => {
    const result = rule.evaluate(
      ruleContext({
        remainingAfter: -1000,
        paychequesNeeded: Infinity,
      }),
    );

    expect(result.severity).toBe("block");
    expect(result.factor).toBe(
      "No free cash flow to save toward this purchase.",
    );
  });

  test("earliest date is after desired date", () => {
    const result = rule.evaluate(
      ruleContext(
        {
          remainingAfter: -1000,
          paychequesNeeded: 10,
          earliestAffordableDate: daysFromNow(70),
        },
        { desiredPurchaseDate: daysFromNow(7) },
      ),
    );

    expect(result.severity).toBe("block");
    expect(result.factor).toBe(
      "The desired purchase date is not within reach.",
    );
  });
});
