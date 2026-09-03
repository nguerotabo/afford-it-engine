# Web UI

Thin Next.js front end for the affordability engine. The decision logic lives in `../src/core` and is imported as `@engine/*`.

See the [root README](../README.md) for product overview, architecture, and how to run from the repo root (`npm run dev`).

```bash
# From repo root (preferred)
npm run dev

# Or from this folder
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)  
API: `POST /api/evaluate` — validates with `parseAffordabilityInput`, then `evaluateAffordability`.
