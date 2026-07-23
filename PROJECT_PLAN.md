# Can I Afford It? — Project Plan (Wealthsimple Artifact)

**Status:** Active reference. Supersedes the old blueprint where they conflict.  
**Target:** SWE internship interviews (Dec 2025 / Jan 2026) — Round 2 project presentation + Round 1 OOP prep.  
**Last updated:** 2026-07-21

---

## 1. Pitch

A money decision app for students, interns, and new grads that answers one question before you spend: **can I afford this purchase?** — based on paycheque income, bills, savings commitment, and a safety buffer.

**Not** another budgeting app (those track the past). This owns the moment before you buy.

**Tagline:** Before you buy it, ask: can I afford it?  
**Mental model:** Young people think in paycheques, not annual budgets.

---

## 2. Strategy (locked)

| Decision | Choice | Why |
|---|---|---|
| Keep vs pivot | **Keep this product** | Real users + personal use + fintech narrative. Do not pivot to a systems toy unless this stalls. |
| Where depth lives | **Decision engine** | Presentation artifact = engine craft, not Next.js chrome. |
| UI timing | **Engine first, UI thin** | Do not grow the form until the engine survives a whiteboard. |
| Gemini-style add-ons (Plaid, Redis) | **Out of scope** | Integrator theater. Fake complexity. |
| PoppyDB comparison | **Different class** | Systems/DB internals. We win on domain + trustworthy architecture, not LSM trees. |
| Audience | **Any SWE intern seat** | Product + craft travels; team fit still varies. |

**One-sentence depth goal:** Turn a calculator function into a financial decision system — metrics → composable rules → explicit policy → before/after state → proven by tests — with AI only as an untrusted narrator.

---

## 3. Wealthsimple themes to make visible

Company-wide interests (per WS intern, 2026): **reliability/security** and **AI trustworthiness**. Fold into craft — do not rebuild the product around them.

### Reliability & security
- Decisions computed server-side; client is untrusted
- Integer cents; deterministic engine; invalid input rejected
- Data minimization (store only what the product needs)
- When auth exists: least privilege, no secrets in client, sensible RLS
- Same inputs → same verdict always

### AI trustworthiness
- **Math decides. AI explains.**
- LLM receives engine JSON only; never invents numbers or verdicts
- UI shows engine metrics first; AI text labeled explanation / not advice
- Guardrails: no stock picks, no guaranteed returns
- Opt-in “Explain” (cost + trust control)
- Optional later: check that explanation doesn’t contradict engine fields

---

## 4. Scope discipline

**MVP answers exactly one question:** Can I afford this purchase?

**In for v1 (resume-ready):**
- Deep decision engine (see §5)
- Thin form → API → verdict + metrics + risk factors
- Deployed demo
- You use it for your own finances
- 5+ real people complete a check
- Exhaustive engine tests
- DECISIONS.md with honest tradeoffs

**Explicitly out until engine is done:**
- Plaid / bank sync
- Redis / caching theater
- Investing, social, milestone calculators
- Monetization polish
- Mobile PWA

**v2 (after real users):** saved profile + history, guilt-free weekly number, scenario compare, opportunity-cost simulator.  
**v3 (later):** milestones, CSV import, PWA.

---

## 5. The deep artifact — Decision Engine

This is the main presentation. Everything else supports it.

### 5.1 Current state (honest)
- ~one function: normalize → math → yes/wait/no
- Float money; unused `purchaseCategory`; fake score; placeholder AI reason
- Stub tests; no `risky` / risk factors despite earlier notes

### 5.2 Target architecture

```
Form (client)
    │
    ▼
API route (validate input, trust boundary)
    │
    ├──► Metrics (pure facts: FCF, safe-to-spend, impact, dates…)
    ├──► Rule engine (OOP: each concern = a Rule)
    ├──► Policy (combine rule results → yes | wait | risky | no)
    ├──► What-if snapshot (before / after purchase state)
    │
    ├──► [v2] DB: profile + check history
    └──► [after engine] AI narrator (engine JSON → prose only)
```

**Headline interview point:** Deterministic, tested TypeScript decides. The LLM only narrates.

### 5.3 Money
- Store and compute in **integer cents** end-to-end
- Format to dollars only for display
- No float arithmetic in the engine

### 5.4 Metrics (facts only — no verdict)
Compute at least:
- Free cash flow per paycheque (after expenses + savings commitment)
- Safe to spend today (cash − buffer [− upcoming bills when added])
- Remaining after purchase
- Paycheques needed / earliest affordable date
- Paycheque impact, total impact
- Before/after snapshot fields the rules need

### 5.5 OOP rule engine (Round 1 bridge)
Each rule owns one concern and returns severity + optional risk factor, e.g.:
- Buffer / cash coverage
- Timing (desired date vs earliest affordable)
- Paycheque impact too high
- Savings goal delay
- Category risk (wants / needs / luxury) — **use** `purchaseCategory`

Orchestrator combines results. Adding a rule does not rewrite the core.

### 5.6 Decision policy (write exact rules in DECISIONS.md)

| Decision | Meaning |
|---|---|
| **yes** | Affordable now; financially healthy; no meaningful risk flags |
| **wait** | Not now; timing problem; reachable by saving within target date |
| **risky** | Technically payable, but buffer/impact/goals/category warn |
| **no** | Can’t / shouldn’t without breaking bills, buffer, or unreachable timing |

Composition must be explicit (what blocks vs warns). Log every change in DECISIONS.md.

### 5.7 What-if state (mini ledger)
- Snapshot of relevant balances **before** purchase
- Snapshot **after** if they buy
- Clear movement of cash / buffer / goal pressure
- Correctness > full accounting textbook; balanced story required

### 5.8 Tests (strongest interview proof)
- Delete stub tests
- 40–60 unit cases on engine/rules/money
- Edge cases: zero income, negative cash, exact boundary purchase, FCF ≤ 0, huge purchase, zero buffer, category-driven risky, date miss
- Prefer a few property-based invariants (e.g. `yes` never implies buffer breach)
- Engine must be 100% deterministic

### 5.9 Presentation shape (mirror PoppyDB structure, different content)
1. Pitch / intro  
2. Architecture (trusted engine vs untrusted AI)  
3. Money (cents)  
4. Rule engine (OOP)  
5. What-if state  
6. Live demo + tests  

---

## 6. Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript | Type safety; industry default |
| Engine | Pure TS modules | Testable; no framework lock-in |
| App | Next.js App Router + React | Full-stack; demand |
| Style | Tailwind | Fast UI |
| DB + Auth | Supabase (Postgres) | Real SQL + auth — **after** engine |
| AI | Vercel AI SDK + LLM | Narrator only — **after** engine |
| Host | Vercel | Deploy demo |
| Analytics | PostHog | Cite funnels later — not day one |
| Tests | Vitest | TS-native unit tests |

---

## 7. Build roadmap

Interview window: **Dec 2025 / Jan 2026**. Work engine-first.

| Phase | What | Approx | Done when |
|---|---|---|---|
| **A** | Integer cents money type; migrate engine types | 3–5 days | No float math in core; playground works |
| **B** | Extract metrics; OOP `Rule`s + `DecisionEngine`; `risky` + `riskFactors`; use category | 1–2 weeks | Can whiteboard “add a rule without touching others” |
| **C** | What-if before/after snapshot | ~1 week | API/demo shows before vs after |
| **D** | Exhaustive Vitest + edge cases (start in A, finish here) | ongoing → ~week 4 | Open `npm test` live in an interview without shame |
| **E** | Thin UI wired to new engine; deploy Vercel | ~1–2 weeks | You complete real checks for your own purchases |
| **F** | Personal use 2+ weeks; 5–10 external users; fix pain | weeks | Metrics + qualitative feedback |
| **G** | Supabase auth + profile + check history | ~1–2 weeks | Saved history works |
| **H** | AI Explain button + guardrails | ~1 week | Numbers never come from the model |
| **I** | Polish, DECISIONS.md ≥10 entries, presentation + OOP practice | through Nov | Ready to present |

**Resume-ready bar:** Phases A–F solid; G–H strongly preferred before interviews.

### Parallel (not product work)
- Practice OOP class-design problems (LLM-generated, highly detailed prompts) for Round 1
- Use this repo’s rule engine as the mental model you can redraw from memory

---

## 8. This week (immediate)

1. Add cents money handling; convert core types  
2. Write real failing tests for current decision edge cases  
3. Split metrics out of the god function  
4. Introduce `Rule` interface; migrate yes/wait/no into rules; add `risky`  
5. First DECISIONS.md entries: cents; rule engine vs one function; yes/wait/risky/no policy  

---

## 9. Explicit non-goals (until justified)

- Plaid / live bank sync  
- Redis  
- Custom “senior” infra without load  
- Hollow fields (`affordabilityScore` alias, unused category, placeholder reasons) — implement or delete  
- Empty stub folders as fake architecture  

---

## 10. Definition of done (presentation-ready v1)

- [ ] Engine: cents, metrics, rules, policy, what-if snapshot  
- [ ] Decisions: `yes | wait | risky | no` + `riskFactors[]`  
- [ ] Vitest: broad edge coverage; deterministic  
- [ ] Form → API → verdict works end to end  
- [ ] Deployed on Vercel  
- [ ] Used for personal finances; 5+ external users completed a check  
- [ ] AI explanation (optional but recommended) with math/AI separation  
- [ ] Accounts + history (recommended)  
- [ ] DECISIONS.md: 10+ honest entries  
- [ ] Can whiteboard architecture and defend every rule cold  

---

## 11. Interview narratives (memorize)

1. **Architecture:** Separated deterministic financial logic from AI so math is testable and the model can’t hallucinate numbers.  
2. **Product:** Users think in paycheques, not annual budgets — core flow is “how many paycheques until this is affordable?”  
3. **Craft:** Integer cents; composable rules; before/after state.  
4. **Reliability:** Trust boundary at the API; validation; minimal data; same input → same output.  
5. **AI trust:** Untrusted narrator over a trusted calculator.

---

## 12. Living docs

| Doc | Role |
|---|---|
| **PROJECT_PLAN.md** (this file) | Strategy, scope, phases — source of truth |
| **DECISIONS.md** | Per-decision log (date, choice, alternatives, why, what you’d change at scale) |
| Old blueprint PDF/txt | Historical; use only where it doesn’t conflict with this plan |

When tempted to add a feature: re-read §4 and §9.
