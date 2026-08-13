import { expect, test, describe } from "vitest";
import { bufferRule } from "../src/core/rules/bufferRule";
import { ruleContext } from "./helpers";

const rule = new bufferRule();

describe("bufferRule: ok", () => {
  test("remainingAfter > 0", () => {
    const result = rule.evaluate(ruleContext({ remainingAfter: 1000 }));

    expect(result.severity).toBe("ok");
    expect(result.factor).toBe("The buffer is sufficient.");
  });

  test("remainingAfter === 0 (boundary)", () => {
    const result = rule.evaluate(ruleContext({ remainingAfter: 0 }));

    expect(result.severity).toBe("ok");
    expect(result.factor).toBe("The buffer is sufficient.");
  });
});

describe("bufferRule: block", () => {
  test("remainingAfter < 0", () => {
    const result = rule.evaluate(ruleContext({ remainingAfter: -1000 }));

    expect(result.severity).toBe("block");
    expect(result.factor).toBe("The buffer is insufficient.");
  });
});
