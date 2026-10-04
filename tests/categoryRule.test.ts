import { expect, test, describe } from "vitest";
import { categoryRule } from "../src/core/rules/categoryRule";
import { ruleContext } from "./helpers";

const rule = new categoryRule();

describe("categoryRule: ok", () => {
  test("needs", () => {
    const result = rule.evaluate(ruleContext({}, { purchaseCategory: "needs" }));

    expect(result.severity).toBe("ok");
    expect(result.factor).toBe("Need purchase — lower risk bar.");
  });

  test("wants", () => {
    const result = rule.evaluate(ruleContext({}, { purchaseCategory: "wants" }));

    expect(result.severity).toBe("ok");
    expect(result.factor).toBe("Want purchase — standard risk bar.");
  });

  test("luxury with comfortable cushion (≥ 2 months expenses)", () => {
    // base expenses $300/week → ~$1300/mo → 2 months ≈ $2600
    const result = rule.evaluate(
      ruleContext(
        { remainingAfter: 300_000 },
        { purchaseCategory: "luxury", expenses: 300, expensesFrequency: "weekly" },
      ),
    );

    expect(result.severity).toBe("ok");
    expect(result.factor).toBe(
      "Luxury purchase — cushion after the buy looks comfortable.",
    );
  });
});

describe("categoryRule: warn", () => {
  test("luxury with thin cushion", () => {
    const result = rule.evaluate(
      ruleContext(
        { remainingAfter: 10_000 },
        { purchaseCategory: "luxury", expenses: 300, expensesFrequency: "weekly" },
      ),
    );

    expect(result.severity).toBe("warn");
    expect(result.factor).toBe("Luxury purchase — thin cushion after the buy.");
  });
});
