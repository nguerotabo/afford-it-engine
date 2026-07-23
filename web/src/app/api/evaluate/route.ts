import { NextResponse } from "next/server";
import {
  evaluateAffordability,
  type AffordabilityInput,
  type frequency,
} from "@/lib/engine";

type EvaluateBody = {
  paycheque: number;
  paychequeFrequency: frequency;
  expenses: number;
  expensesFrequency: frequency;
  currentSavings: number;
  minimumBuffer: number;
  purchasePrice: number;
  desiredPurchaseDate: string;
  purchaseCategory: "wants" | "needs" | "luxury";
  savingsCommitment: number;
  savingsCommitmentFrequency: frequency;
};

function finiteOrNull(n: number): number | null {
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: Request) {
  let body: EvaluateBody;

  try {
    body = (await request.json()) as EvaluateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input: AffordabilityInput = {
    paycheque: Number(body.paycheque),
    paychequeFrequency: body.paychequeFrequency,
    expenses: Number(body.expenses),
    expensesFrequency: body.expensesFrequency,
    currentSavings: Number(body.currentSavings),
    minimumBuffer: Number(body.minimumBuffer),
    purchasePrice: Number(body.purchasePrice),
    desiredPurchaseDate: new Date(body.desiredPurchaseDate),
    purchaseCategory: body.purchaseCategory,
    savingsCommitment: Number(body.savingsCommitment),
    savingsCommitmentFrequency: body.savingsCommitmentFrequency,
  };

  if (Number.isNaN(input.desiredPurchaseDate.getTime())) {
    return NextResponse.json(
      { error: "desiredPurchaseDate must be a valid date" },
      { status: 400 },
    );
  }

  const result = evaluateAffordability(input);

  return NextResponse.json({
    decision: result.decision,
    reason: result.reason,
    suggestedPurchaseDate: result.suggestedPurchaseDate.toISOString(),
    safeToSpend: result.safeToSpend,
    paychequesNeeded: finiteOrNull(result.paychequesNeeded),
    totalImpact: finiteOrNull(result.totalImpact),
    paychequeImpact: finiteOrNull(result.paychequeImpact),
    affordabilityScore: finiteOrNull(result.affordabilityScore),
    remainingAfter: result.remainingAfter,
    freeCashFlow: result.freeCashFlow,
  });
}
