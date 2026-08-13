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
});

describe("categoryRule: warn", () => {
  test("luxury", () => {
    const result = rule.evaluate(
      ruleContext({}, { purchaseCategory: "luxury" }),
    );

    expect(result.severity).toBe("warn");
    expect(result.factor).toBe("Luxury purchase — higher risk bar.");
  });
});
