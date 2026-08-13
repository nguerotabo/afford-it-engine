import { expect, test, describe } from "vitest";
import { paychequeImpactRule } from "../src/core/rules/paychequeImpactRule";
import { ruleContext } from "./helpers";

const rule = new paychequeImpactRule();

describe("paychequeImpactRule: ok", () => {
  test("paychequeImpact <= 1", () => {
    const result = rule.evaluate(ruleContext({ paychequeImpact: 1 }));

    expect(result.severity).toBe("ok");
    expect(result.factor).toBe("The paycheque impact is acceptable.");
  });
});

describe("paychequeImpactRule: warn", () => {
  test("paychequeImpact > 1", () => {
    const result = rule.evaluate(ruleContext({ paychequeImpact: 2 }));

    expect(result.severity).toBe("warn");
    expect(result.factor).toBe("The paycheque impact is quite high.");
  });

  test("paychequeImpact is Infinity (zero income)", () => {
    const result = rule.evaluate(ruleContext({ paychequeImpact: Infinity }));

    expect(result.severity).toBe("warn");
    expect(result.factor).toBe("The paycheque impact is quite high.");
  });
});
