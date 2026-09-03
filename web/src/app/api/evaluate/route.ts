import { NextResponse } from "next/server";
import { evaluateAffordability, parseAffordabilityInput } from "@/lib/engine";

function finiteOrNull(n: number): number | null {
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseAffordabilityInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = evaluateAffordability(parsed.input);

  return NextResponse.json({
    decision: result.decision,
    reason: result.reason,
    suggestedPurchaseDate: result.suggestedPurchaseDate.toISOString(),
    earliestAffordableDate: result.earliestAffordableDate.toISOString(),
    desiredPurchaseDate: parsed.input.desiredPurchaseDate.toISOString(),
    safeToSpend: result.safeToSpend,
    paychequesNeeded: finiteOrNull(result.paychequesNeeded),
    totalImpact: finiteOrNull(result.totalImpact),
    paychequeImpact: finiteOrNull(result.paychequeImpact),
    remainingAfter: result.remainingAfter,
    freeCashFlow: result.freeCashFlow,
    riskFactors: result.riskFactors,
    before: result.before,
    after: result.after,
  });
}
