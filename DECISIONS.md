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
- Meaning:
  - **yes** — Enough safe cash now; financially healthy; no meaningful risk flags. "Buy it, you're fine."
  - **wait** — Not enough safe cash now; healthy once you save; reachable by target date. "Timing problem — patience fixes it."
  - **risky** — Technically payable, but buffer/impact/goals/category warn. Double layer of protection.
  - **no** — Can't / shouldn't without missing bills, breaking buffer, or unreachable timing.
- Alternatives considered: Three-way yes/wait/no only (old code)
- Why: Matches product intent and forces explicit risk modeling
- What I'd change at scale: Tunable thresholds per user risk profile


- Date: 2026-08-01
- Decision: Convert all input number values to cents before any calculations are done
- Meaning: When a user input all their data for the AffordabilityForm, we convert all of them to cents to make sure calculations are done properly and we have no float errors. After calculations are done, the values are converted back to dollars. 
- Alternatives considered: Create a Cent type as input instead of using a number variable. Could be done later but for now all inputs are stored as numbers and the conversion to cents is done.
- Why: Limits calculation errors and increases engine accuracy.
- What I'd change at scale: Adopt option B with a Cent type to precisely know. 


---

## Tests location

- Date: earlier
- Decision: `/tests` outside `src`
- Why: Separate production code from test suite; easier to run
