# Can I Afford It? — Project Plan (Wealthsimple Artifact)

**Status:** Active reference. Supersedes the old blueprint where they conflict.  
**Target:** SWE internship interviews (Dec 2025 / Jan 2026) — Round 2 project presentation + Round 1 OOP prep.  
**Last updated:** 2026-08-18

---

## 1. Pitch

A money decision app for students, interns, and new grads that answers one question before you spend: **can I afford this purchase by the date I care about?** — based on paycheque income, obligations, a safety buffer, and (optionally) a savings plan that grows cash rather than draining free cash flow.

**Not** another budgeting app (those track the past). This owns the moment before you buy.

**Tagline:** Before you buy it, ask: can I afford it?  
**Mental model:** Young people think in paycheques, not annual budgets.

---

## 2. Strategy (locked)

| Decision | Choice | Why |
|---|---|---|
| Keep vs pivot | **Keep this product** | Real users + personal use + fintech narrative. Do not pivot to a systems toy unless this stalls. |
| Where depth lives | **Decision engine** | Presentation artifact = engine craft, not Next.js chrome. |
| UI timing | **Engine first (done enough); now shrink the shell** | The 11-field staged form is the bottleneck. Habit = 3-field setup, then price-only. Do not grow knobs. |
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
- **User-usable shell (Phase U):** two-visit UX, not an 11-field demo
- Deployed demo
- You use it for your own finances
- 5+ real people complete a check (named people, not Reel clicks)
- Exhaustive engine tests
- DECISIONS.md with honest tradeoffs

**Phase U product shape (GPA-calculator loop):**
- **First visit (setup, once):** paycheck, bills, cash in the bank. Frequency defaults to biweekly. Buffer defaults to `$500`. Savings commitment defaults to `0`. Category defaults to `wants`.
- **Return visit (the product):** price + optional date (default **today**). Profile from `localStorage`. Button. Verdict.
- Engine contract **does not change**. The UI fills hidden fields so `/api/evaluate` still gets a full `AffordabilityInput`.
- Phone-first hot path. Screenshot-stupid verdict (`No — 3 paycheques`). `?price=` deep link. Add-to-home-screen after first real check.

**Explicitly out (still):**
- Plaid / bank sync
- Redis / caching theater
- Investing, social, milestone calculators
- Monetization polish
- Auth / Supabase (Phase G — after people actually return)
- Paid ads; Reels as a user-acquisition funnel before the hot path exists

**v2 (after real users):** cloud profile + history (Supabase), guilt-free weekly number, scenario compare, opportunity-cost simulator.  
**v3 (later):** milestones, CSV import, PWA polish beyond add-to-home-screen.

---

## 5. The deep artifact — Decision Engine

This is the main presentation. Everything else supports it.

### 5.1 Current state (honest)
- Metrics → rules → policy → what-if ledger; trust-boundary `parseAffordabilityInput`
- **Cents (Contract B):** dollars in → integer cents inside engine → dollars out; round after frequency normalize
- Decisions: `yes | risky | no` in practice (`wait` reserved, unused in v1)
- Affordability judged **as of desired purchase date**; calendar-day date math; FCF = income − expenses
- Exhaustive vitest suite on engine / rules / money / parse
- Thin Next.js form + `/api/evaluate`; AI reason still placeholder

### 5.2 Target architecture

```
Form (client)
    │
    ▼
API route (validate input, trust boundary)
    │
    ├──► Metrics (pure facts: FCF, safe-to-spend, impact, dates…)
    ├──► Rule engine (OOP: each concern = a Rule)
    ├──► Policy (combine rule results → yes | risky | no; wait reserved)
    ├──► What-if snapshot (now vs after buy on desired date)
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
- Free cash flow per paycheque (**income − expenses**; savings commitment is plan-into-cash, not subtracted)
- Safe to spend today (cash − buffer)
- Remaining after purchase **on the desired date** (projected FCF × pay periods)
- Paycheques needed / earliest affordable date
- Paycheques until desired date
- Paycheque impact, total impact

### 5.5 OOP rule engine (Round 1 bridge)
Each rule owns one concern and returns severity + optional risk factor, e.g.:
- Buffer / cash coverage (projected)
- Timing (desired date vs earliest affordable; calendar days)
- Paycheque impact too high (current-period buys only)
- Category risk — luxury warns only when post-buy cushion < 2 months of expenses

Orchestrator combines results. Adding a rule does not rewrite the core.

### 5.6 Decision policy (write exact rules in DECISIONS.md)

| Decision | Meaning (v1) |
|---|---|
| **yes** | Covered by desired date; buffer intact; no meaningful risk flags |
| **risky** | Covered by desired date, but warns (thin luxury cushion / current-period impact) |
| **no** | Not covered by desired date, or FCF ≤ 0 |
| **wait** | Reserved on the type; **not emitted** in v1 |

Composition must be explicit (what blocks vs warns). Log every change in DECISIONS.md.

### 5.7 What-if state (mini ledger)
- **before** = now (what the user typed: cash + safe-to-spend)
- **after** = cash on the **desired purchase date** after the buy (income/expenses projected, then purchase)
- Same-day buy: FCF-first funding; later dates: full price from the projected pile
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
| **A** | Integer cents in engine math | 3–5 days | No float money math in core; playground works |
| **B** | Metrics + OOP rules + `risky` | 1–2 weeks | Can whiteboard “add a rule without touching others” |
| **C** | What-if before/after snapshot | ~1 week | API/demo shows before vs after |
| **D** | Exhaustive Vitest | ongoing → ~week 4 | Open `npm test` live without shame |
| **E** | Thin UI + deploy | 1–2 weeks | You run real personal checks on prod |
| **U** | User-usable shell | 3–7 days | Setup once, then price-only on a phone |
| **F** | Real users | weeks | 5–10 named people complete a check; iterate |
| **G** | Auth + history | 1–2 weeks | Cloud profile + checks |
| **H** | AI Explain | ~1 week | Numbers never come from the model |
| **I** | Polish + present | through Nov | Ready for Round 2 |

**Resume-ready bar:** Phases A–D + U + F solid; G–H strongly preferred before interviews. Engine-without-U is a demo, not a tool.

### Parallel (not product work)
- Practice OOP class-design problems (LLM-generated, highly detailed prompts) for Round 1
- Use this repo’s rule engine as the mental model you can redraw from memory

---

## 7.1 Phase checklists

### Phase A — Integer cents
**Work:** Dollars at the public edge; whole-cent math inside the engine; round after frequency normalize.

**Contract chosen:** B — dollars in → cents inside `evaluateAffordability` → dollars out. (Strict branded `Cents` end-to-end is optional polish.)

**Checklist**
- [x] `money.ts`: `convertToCents` (`Math.round`) + `convertToDollars`
- [x] Engine converts money fields to cents before math
- [x] `Math.round` after `normalizeToPaycheque`
- [x] Money outputs converted back to dollars before return
- [x] Playground uses dollars consistently
- [ ] Single `money.ts` only (delete duplicate `Money.ts` if present)
- [ ] `DECISIONS.md`: why cents + why Contract B
- [ ] Optional: branded `Cents` type + convert only at API edge (strict plan)

**Done when:** No float money math in core; playground works.  
**Out:** Rules, UI redesign, tests suite (start in D).

---

### Phase B — OOP rule engine
**Work:** Turn the god function into metrics → composable rules → policy → `yes | wait | risky | no` + `riskFactors[]`. Round 1 OOP bridge.

**Checklist**

**B1 — Metrics extraction**
- [ ] `metrics.ts`: input → metric object only (FCF, safe-to-spend, remaining, paycheques needed, dates, impacts)
- [ ] God function no longer mixes “compute” and “decide” in one blob
- [ ] Playground still runs

**B2 — Rule interface**
- [ ] `Rule` with `name` + `evaluate(ctx) → { severity: ok|warn|block, factor? }`
- [ ] Shared `EvaluationContext` (metrics + fields rules need)
- [ ] One rule implemented end-to-end as proof

**B3 — Core rules**
- [ ] Buffer / cash coverage rule
- [ ] Timing / wait-vs-no rule
- [ ] Paycheque impact rule → can emit `warn`
- [ ] Category rule (`wants` / `needs` / `luxury`) → actually affects outcome
- [ ] (Optional) goal-delay / savings rule

**B4 — Policy + `risky`**
- [ ] `Decision` includes `"risky"`
- [ ] Output includes `riskFactors: string[]`
- [ ] Explicit composition (example): any hard `block` → `no`; shortfall + timing OK → `wait`; covered + `warn` → `risky`; covered + clean → `yes`
- [ ] `DECISIONS.md` entry for that policy

**B5 — Integration**
- [ ] `evaluateAffordability` orchestrates only (no big business if/else tree)
- [ ] Adding a rule does not require rewriting the orchestrator
- [ ] Phase A cents boundary still intact

**B6 — Smoke proof**
- [ ] yes / wait / risky / no each happen at least once (playground or a few tests)
- [ ] Can whiteboard: “new rule = new file, register it, done”

**Done when:** Can whiteboard “add a rule without touching others.”  
**Out:** What-if snapshot (C), full test suite (D), AI/auth.

---

### Phase C — What-if snapshot
**Work:** Show financial state **before** vs **after** the purchase. Mini ledger of state — not a full accounting product.

**Checklist**
- [ ] Define snapshot fields (e.g. cash, buffer remaining, FCF, goal pressure)
- [ ] `before` snapshot from current metrics
- [ ] `after` snapshot if purchase applied
- [ ] Include snapshots in engine/API output
- [ ] Thin UI or playground prints before/after
- [ ] `DECISIONS.md`: what accounts exist; void/edit policy (derived state, not hand-edited balances)
- [ ] Smoke: one yes and one no/risky case show different after-states

**Done when:** API/demo shows before vs after.  
**Out:** Double-entry textbook completeness; bank sync.

---

### Phase D — Exhaustive tests
**Work:** Tests become the strongest interview artifact. Deterministic engine, edge cases, a few invariants.

**Checklist**
- [ ] Delete stub `1+1=2` test
- [ ] Money helpers tested (`convertToCents` rounding cases)
- [ ] Metrics tested in isolation
- [ ] Each rule tested (ok / warn / block paths)
- [ ] Policy composition tested (yes / wait / risky / no)
- [ ] Edge cases: zero income, negative cash, exact boundary purchase, FCF ≤ 0, huge purchase, zero buffer, category-driven risky, date miss
- [ ] Target ~40–60 engine tests
- [ ] Optional: property test (e.g. `yes` never implies buffer breach)
- [ ] `npm test` is something you’d open live in an interview

**Done when:** Open `npm test` live without shame.  
**Note:** Start a few tests during B; finish breadth here.

---

### Phase E — Thin UI + deploy
**Work:** Wire form to the new engine; ship a public URL. UI stays thin.

**Checklist**
- [ ] Form fields match current `AffordabilityInput`
- [ ] API validates input; rejects garbage; trust boundary clear
- [ ] Response shows decision, metrics, `riskFactors`, before/after (if C done)
- [ ] Decision colors / copy for `risky`
- [ ] Deploy to Vercel
- [ ] You complete ≥3 real personal purchase checks on prod
- [ ] Hollow UI fields removed or wired (no fake score)

**Done when:** You run real personal checks on the deployed app.  
**Out:** Design polish theater; AI; auth.

---

### Phase U — User-usable shell (do this before chasing users)

**Work:** Turn the staged 11-field form into a pop-out tool. Same engine. Different visits.

**Why now:** People will complete a check if it is as fast as a GPA calculator. They will not, if every impulse means re-entering income. Reels/content come *after* this. Auth/Plaid do not unblock this.

**Two visits**

| Visit | What they type | Where the rest comes from |
|---|---|---|
| **1 — Setup** | Paycheck, bills, cash | Frequency = biweekly; buffer = `$500`; savings = `0`; category = `wants` |
| **2+ — Check** | Price; date defaults to today | `localStorage` profile + same defaults |

**Field cut**

| Input | Today | After U |
|---|---|---|
| Current cash | Shown | Setup once |
| Income | Shown | Setup once |
| Income frequency | Shown | Default biweekly; edit in profile |
| Obligations | Shown | Setup once |
| Obligation frequency | Shown | Default biweekly; edit in profile |
| Minimum buffer | Shown | Default `$500`; edit in profile |
| Savings commitment + freq | Shown | Default `0`; hidden on hot path |
| Price | Shown | **Every check** |
| Category | Shown | Default `wants`; hidden on hot path |
| Desired date | Shown | Every check; **default today** |

**Checklist (order is the build order)**

**U1 — Defaults at the edge (engine untouched)**
- [ ] UI always POSTs a full `AffordabilityInput`
- [ ] Hidden / defaulted: frequencies `biweekly`, `minimumBuffer` `500`, `savingsCommitment` `0`, `purchaseCategory` `wants`
- [ ] `desiredPurchaseDate` defaults to **today** (local calendar date)
- [ ] `DECISIONS.md`: why these defaults; what you’d let users tune later

**U2 — `localStorage` profile (no auth)**
- [ ] Persist: cash, paycheck, paycheck frequency, expenses, expense frequency, buffer
- [ ] Load on boot; skip setup when profile exists
- [ ] “Edit money” path to change the profile without doing a check
- [ ] Do not persist purchase price/date (those are the check, not the person)
- [ ] Data minimization note in `DECISIONS.md` (device-only; no account)

**U3 — Split the UI into setup vs check**
- [ ] Setup screen: 3 numbers + save. Then first check (price).
- [ ] Check screen: giant price input, date, one button
- [ ] Kill staged 01/02/03 essay layout on the tool surface (landing copy can stay short above)
- [ ] Returning user: price focused on load (or honor `?price=`)

**U4 — Phone hot path + screenshot verdict**
- [ ] One screen on a phone; verdict above the fold; no scroll theater to see yes/no
- [ ] Headline is the whole answer: `Yes — you can buy this` / `No — 3 paycheques` / `Risky — …`
- [ ] Ledger / risk factors behind “why”, not competing with the stamp
- [ ] After first successful evaluate, prompt **Add to Home Screen** (PWA lite: manifest + apple touch icon). Full PWA polish is v3.

**U5 — Impulse deep link**
- [ ] `/?price=89.99` pre-fills price
- [ ] If profile exists → land on check. If not → setup, then check with price kept
- [ ] Optional: `?date=YYYY-MM-DD`

**U6 — Deploy, then you use it**
- [ ] Public Vercel URL (finish Phase E deploy if still local)
- [ ] You complete ≥3 real personal purchases on prod **using only the check screen**
- [ ] Count **evaluates**, not page views. PostHog or a single server log is enough.

**U7 — Then, and only then, other people**
- [ ] Hand the URL to 5–10 people who have a real purchase this week (Phase F)
- [ ] Watch one person do setup + check on a phone. Cut whatever they hesitate on.
- [ ] Content/Reels only after a stranger can finish a return check in ~15s

**Done when:** Returning user types a price and gets a verdict without re-entering income. You have a public URL.  
**Out:** Auth, Plaid, AI Explain, growth content as the first distribution plan, adding fields.

---

### Phase F — Real users
**Work:** Use it yourself; get 5–10 others; fix pain. Product proof for the presentation. **Blocked on U** — do not recruit until return-visit is price-only.

**Checklist**
- [ ] Personal use for 2+ weeks (log decisions it changed)
- [ ] 5–10 **named** external users complete a check (not anonymous Reel clicks)
- [ ] Collect qualitative feedback (confusing fields, wrong verdicts)
- [ ] Fix top 2–3 pain points in engine or UI
- [ ] Note 1–2 metrics you can cite (checks completed, decision mix)

**Done when:** Metrics + qualitative feedback you can speak to.  
**Out:** Paid ads; counting views as users; recruiting before Phase U is shipped.

---

### Phase G — Auth + history
**Work:** Supabase accounts; save profile + check history.

**Checklist**
- [ ] Auth (email magic link or equivalent)
- [ ] `profiles` table for recurring inputs
- [ ] `checks` table for history (decision + key metrics)
- [ ] RLS / least privilege; no secrets in client
- [ ] UI: save profile; view past checks
- [ ] `DECISIONS.md`: what you store vs refuse to store (data minimization)

**Done when:** Saved profile + history works end to end.  
**Out:** Social features; team orgs.

---

### Phase H — AI Explain
**Work:** Untrusted narrator over trusted engine JSON. WS AI-trust theme.

**Checklist**
- [ ] Opt-in “Explain” button (not auto)
- [ ] LLM receives engine output JSON only
- [ ] UI shows engine numbers first; AI labeled explanation / not advice
- [ ] Guardrails: no stock picks, no guaranteed returns
- [ ] Optional: reject/flag if explanation invents amounts
- [ ] `DECISIONS.md`: math decides / AI explains

**Done when:** Numbers never come from the model.  
**Out:** AI that posts decisions or changes verdicts.

---

### Phase I — Polish + present
**Work:** Interview-ready artifact and Round 1/2 prep.

**Checklist**
- [ ] DECISIONS.md ≥10 honest entries
- [ ] Slide outline: pitch → architecture → cents → rules → what-if → demo + tests
- [ ] Live demo path rehearsed (<5 min)
- [ ] Whiteboard architecture + every rule cold
- [ ] OOP class-design practice weekly (parallel)
- [ ] Resume bullet framed as decision engine (not “budgeting app”)
- [ ] Definition of done (§10) mostly checked

**Done when:** Ready for Round 2 presentation.  
**Out:** New major features after freeze date (~late Nov).

---

## 8. Next up

Engine (A–D) is deep enough to demo. The form is not a tool yet. **Next: Phase U, in order U1 → U7.**

1. U1 — defaults at the edge (engine untouched)  
2. U2 — `localStorage` profile  
3. U3 — setup vs check screens  
4. U4 — phone hot path + screenshot verdict + A2HS prompt  
5. U5 — `/?price=`  
6. U6 — deploy; you use the check screen for real buys  
7. U7 / Phase F — 5–10 named people with a real purchase this week  

Do not start auth (G), AI (H), or Reels-as-acquisition until a return visit is price + button.  

---

## 9. Explicit non-goals (until justified)

- Plaid / live bank sync  
- Redis  
- Custom “senior” infra without load  
- Hollow fields (`affordabilityScore` alias, unused category, placeholder reasons) — implement or delete  
- Empty stub folders as fake architecture  
- Reels / content as user acquisition before Phase U is shipped  
- Auth before anyone returns to a price-only check  

---

## 10. Definition of done (presentation-ready v1)

- [ ] Engine: cents, metrics, rules, policy, what-if snapshot  
- [ ] Decisions: `yes | wait | risky | no` + `riskFactors[]`  
- [ ] Vitest: broad edge coverage; deterministic  
- [ ] Form → API → verdict works end to end  
- [ ] Phase U: setup once, then price-only return; profile in `localStorage`  
- [ ] Deployed on Vercel  
- [ ] Used for personal finances; 5+ named external users completed a check  
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
