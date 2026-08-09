import { expect, test, describe } from "vitest";
import { applyPolicy } from "../src/core/policy";
import { calculateMetrics } from "../src/core/metrics";
import { baseInput, daysFromNow } from "./helpers";
import type { NamedRuleResult } from "../src/core/policy";

function results(partial: Record<string, NamedRuleResult["result"]>): NamedRuleResult[] {
  const defaults: Record<string, NamedRuleResult["result"]> = {
    bufferRule: { severity: "ok", factor: "buffer ok" },
    timingRule: { severity: "ok", factor: "timing ok" },
    paychequeImpactRule: { severity: "ok", factor: "impact ok" },
    categoryRule: { severity: "ok", factor: "category ok" },
  };

  return Object.entries({ ...defaults, ...partial }).map(([name, result]) => ({
    name,
    result,
  }));
}

describe("applyPolicy", () => {
  test("buffer ok + no warns → yes", () => {
    const input = baseInput({ purchasePrice: 400 });
    const metrics = calculateMetrics(input);
    const out = applyPolicy(input, metrics, results({}));

    expect(out.decision).toBe("yes");
    expect(out.riskFactors).toEqual([]);
    expect(out.suggestedPurchaseDate).toEqual(input.desiredPurchaseDate);
  });

  test("buffer ok + impact warn → risky", () => {
    const input = baseInput({ purchasePrice: 3000 });
    const metrics = calculateMetrics(input);
    const out = applyPolicy(
      input,
      metrics,
      results({
        paychequeImpactRule: {
          severity: "warn",
          factor: "The paycheque impact is quite high.",
        },
      }),
    );

    expect(out.decision).toBe("risky");
    expect(out.riskFactors).toEqual(["The paycheque impact is quite high."]);
  });

  test("buffer block + timing ok → wait", () => {
    const input = baseInput({
      purchasePrice: 5000,
      desiredPurchaseDate: daysFromNow(365),
    });
    const metrics = calculateMetrics(input);
    const out = applyPolicy(
      input,
      metrics,
      results({
        bufferRule: { severity: "block", factor: "The buffer is insufficient." },
        timingRule: { severity: "ok", factor: "reachable" },
      }),
    );

    expect(out.decision).toBe("wait");
    expect(out.suggestedPurchaseDate).toEqual(metrics.earliestAffordableDate);
  });

  test("buffer block + timing block → no", () => {
    const input = baseInput({
      purchasePrice: 5000,
      desiredPurchaseDate: daysFromNow(7),
    });
    const metrics = calculateMetrics(input);
    const out = applyPolicy(
      input,
      metrics,
      results({
        bufferRule: { severity: "block", factor: "The buffer is insufficient." },
        timingRule: {
          severity: "block",
          factor: "The desired purchase date is not within reach.",
        },
      }),
    );

    expect(out.decision).toBe("no");
    expect(out.suggestedPurchaseDate).toEqual(metrics.earliestAffordableDate);
  });
});
