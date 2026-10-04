# DECISIONS.md

Log of engineering/product choices.
**Source of truth:** [PROJECT_PLAN.md](./PROJECT_PLAN.md)

Format for each entry:

```
## [Decision title]
- Date:
- Decision:
- Alternatives considered:
- Why I chose this:
- What I gave up / would change at scale:
```

---

## Decision semantics (working — refine in Phase B)

- Date: 2026-07-21
- Decision: Four outcomes — `yes` | `wait` | `risky` | `no`
- Meaning (original):
  - **yes** — Enough safe cash now; financially healthy; no meaningful risk flags. "Buy it, you're fine."
  - **wait** — Not enough safe cash now; healthy once you save; reachable by target date. "Timing problem — patience fixes it."
  - **risky** — Technically payable, but buffer/impact/goals/category warn. Double layer of protection.
  - **no** — Can't / shouldn't without missing bills, breaking buffer, or unreachable timing.
- Alternatives considered: Three-way yes/wait/no only (old code)
- Why: Matches product intent and forces explicit risk modeling
- What I'd change at scale: Tunable thresholds per user risk profile

- Date: 2026-08-13
- **Supersedes meanings above for v1.** Evaluated **as of the desired purchase date**, not “buy today.”
  - **yes** — Covered by the desired date; buffer intact after the buy; no meaningful warns
  - **risky** — Covered by the desired date, but warns (thin luxury cushion and/or high impact on a current-period buy)
  - **no** — Not covered by the desired date, or FCF ≤ 0. Footer shows earliest when finite
  - **wait** — Still on the `Decision` type; **not emitted** in v1 (see policy + FCF/luxury/wait entries)

---

- Date: 2026-08-01
- Decision: Convert all input number values to cents before any calculations are done
- Meaning: When a user input all their data for the AffordabilityForm, we convert all of them to cents to make sure calculations are done properly and we have no float errors. After calculations are done, the values are converted back to dollars. 
- Alternatives considered: Create a Cent type as input instead of using a number variable. Could be done later but for now all inputs are stored as numbers and the conversion to cents is done.
- Why: Limits calculation errors and increases engine accuracy.
- What I'd change at scale: Adopt option B with a Cent type to precisely know. 


---

## Policy composition (rule results → decision)

- Date: 2026-08-06
- Decision: `applyPolicy` owns the final stamp from rule severities
- Composition:
  - **buffer ok + no warns** → `yes`
  - **buffer ok + any warn** (impact / category / …) → `risky` + those warn factors in `riskFactors`
  - **buffer block** → `no` (misses desired date, or FCF ≤ 0). Timing / other block factors stay in `riskFactors`
  - **`wait`** — reserved on the Decision type; not emitted in v1 (desired date is the timing answer)
- Timing rule also **blocks** when `paychequesNeeded` is non-finite (FCF ≤ 0), so "earliest = now" is not treated as reachable
- Alternatives considered: keep god if/else on metrics; fold policy into each rule; buffer-block + timing-ok → wait
- Why: Rules stay single-purpose; policy is one place to change product opinion; matches OOP interview story
- What I'd change at scale: per-user thresholds; weighted warns; separate "hard block" vs "soft block"

---

## What-if ledger (before / after snapshot)

- Date: 2026-08-10
- Decision: Engine shows a mini-ledger with only stock fields — `currentSavings` and `safeToSpend` — as `before` and `after` on the output
- Accounts / fields:
  - **currentSavings** — cash on hand
  - **safeToSpend** — cash above `minimumBuffer` (not a separate stored account)
- Funding rule for `after` (same-day buy): apply purchase **FCF-first**; only the overflow touches cash. If price ≤ this paycheque’s FCF, cash is unchanged
- Void / edit policy: snapshots are **derived each evaluate** from input + metrics. Not persisted balances; not hand-editable. “Undo” = re-run without the purchase (or with a different price)
- Alternatives considered: mirror full metrics bag before/after; always subtract purchase from cash; include FCF/goal pressure as ledger rows
- Why: Before/after should answer “does this buy dip cash?” without pretending we have double-entry accounting. Flows (FCF) and decision metrics (impact, paycheques needed) stay outside the ledger

- Date: 2026-08-13
- Decision: Snapshot `before` is **now** (what the user typed). `after` is cash **on the desired purchase date** after the buy. Paycheque-impact warn only applies when buying in the current period.
- Meaning:
  - Ready-by / earliest is “first day you could,” which can be **before** the date they typed
  - Extra time can clear buffer and impact
  - Future-date `after`: FCF for elapsed paycheques is already in the pile — subtract full price (no second FCF-first pass)
- Alternatives considered: both columns projected; impact always on; hide earliest on yes
- Why: “On that date” was colliding with Ready by 10/22 vs Timeframe 1/1/2027, and before didn’t match current cash
- What I'd change at scale: day-level cashflow calendar instead of average FCF × periods

---

## Calendar days and projected affordability

- Date: 2026-08-13
- Decision:
  1. Form `YYYY-MM-DD` parses as a **local calendar day**, not UTC midnight
  2. Earliest date and timing compares use **start-of-local-day** (`isOnOrBeforeCalendarDay`)
  3. `remainingAfter` / buffer use cash **projected to the desired date**: `safeToSpend + FCF × paychequesUntilDesired` (N=0 keeps one-cheque FCF-first for “buy today”)
- Alternatives considered: timestamp `getTime()` compares; today-only buffer with separate timing rule only
- Why: Fixed “No — not by that date” when Earliest showed the same day; form asks “by this date?”
- What I'd change at scale: timezone-explicit calendar; pay-date schedule instead of average periods

---

## FCF, luxury cushion, and wait (v1)

- Date: 2026-08-13
- Decision:
  1. **FCF = income − expenses.** Savings commitment is a plan into cash, not a second sink (subtracting it double-counted growth).
  2. **Luxury warns only when post-buy cushion is thin** — `remainingAfter` < 2 months of expenses. Comfortable cushion → ok (can still be `yes`).
  3. **`wait` unused in v1.** Buffer block → `no`. Desired date already answers timing; `wait` stays on the Decision type for API stability.
- Alternatives considered: keep subtracting savings; always-warn luxury; keep wait for buffer-block + timing-ok
- Why: Matches “can I afford by this date?” without punishing planned saving or shouting luxury when the pile is healthy
- What I'd change at scale: optional locked-goal field; tunable cushion months; revive `wait` if UX needs “you could buy earlier than you asked”
 

---

## Hidden defaults + two-visit UI

- Date: 2026-08-20
- Decision: Split the form into **setup** (paycheck, bills, cash, two frequencies) and **check** (price + date). Persist setup in `localStorage` on this device. Engine still receives a full `AffordabilityInput`.
- Hidden defaults (not asked on either screen): `minimumBuffer` `$500`, `savingsCommitment` `$0`, `purchaseCategory` `wants`. Date defaults to **today**. Setup frequency defaults: pay **biweekly**, bills **monthly**.
- Alternatives considered: same 11-field form with pre-filled values; hide frequencies on setup too
- Why: Return visit should be a pop-out check. Mixed pay/bill frequencies are common, so those dropdowns stay on setup only.
- What I'd change at scale: let users edit buffer; cloud profile after auth

---

## Tests location

- Date: earlier
- Decision: `/tests` outside `src`
- Why: Separate production code from test suite; easier to run
