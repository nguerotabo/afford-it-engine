# Can I Afford It?

A money decision app that answers one question before you spend: **can I afford this purchase by the date I care about?**

Not a budgeting tracker. It owns the moment before you buy — paycheque thinking, not annual spreadsheets.

**Math decides. AI (later) only explains.**

---

## Quick start

```bash
# From repo root
npm install
npm test          # engine suite (vitest)
npm run dev       # Next.js form + /api/evaluate
```

Open [http://localhost:3000](http://localhost:3000).

Optional: `npm run dev:engine` runs `src/core/playground.ts` against the engine without the UI.

---

## Architecture

```
Form (client)
    │
    ▼
POST /api/evaluate  →  parseAffordabilityInput (trust boundary)
    │
    ├── Metrics   (FCF, safe-to-spend, projected remainingAfter, dates…)
    ├── Rules     (buffer, timing, category, paycheque impact)
    ├── Policy    (yes | risky | no — wait reserved, unused in v1)
    └── Ledger    (before = now; after = cash on desired date post-buy)
```

| Path | Role |
|---|---|
| `src/core/` | Decision engine (pure TypeScript) |
| `tests/` | Vitest suite for engine / rules / money / parse |
| `web/` | Thin Next.js UI + API that imports `@engine/*` |
| `DECISIONS.md` | Product/engineering tradeoffs (source of truth for *why*) |
| `PROJECT_PLAN.md` | Scope, interview artifact plan, phase notes |

---

## How a verdict is made (v1)

1. **FCF** = income − expenses (savings commitment is plan-into-cash; not subtracted).
2. Cash is **projected to the desired purchase date** (`FCF ×` pay periods until then).
3. **Buffer rule** checks remaining safe cash after the buy on that date.
4. **Timing** compares earliest affordable day vs desired day (local calendar days).
5. **Warns** (not hard blocks): luxury only if post-buy cushion < 2 months of expenses; paycheque impact only for current-period buys.
6. **Policy:** buffer ok + no warns → `yes`; buffer ok + warns → `risky`; buffer block → `no`.

Snapshot UI: **Now** = what you typed; **After {date}** = projected cash after the purchase.

---

## Design principles

- Server-side evaluate; client is untrusted
- Integer **cents** inside the engine; dollars at the edges
- Deterministic: same input → same decision
- Rules are single-purpose OOP classes; policy composes them
- Product choices live in `DECISIONS.md`, not buried in PRs

---

## Scripts

| Command | What |
|---|---|
| `npm test` | Engine tests (`vitest`) |
| `npm run dev` | Web app (`web/`) |
| `npm run build` | Production build of `web/` |
| `npm run dev:engine` | Playground script |

---

## Out of scope (for now)

Bank sync, auth/DB profiles, investing, Redis, AI narrator (placeholder only). See `PROJECT_PLAN.md`.
