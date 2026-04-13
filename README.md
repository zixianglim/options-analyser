# OptionsIQ — Black-Scholes Options Analyser

Professional options pricing and greeks calculator with real-time payoff diagrams, multi-leg builder, and breakeven analysis.

## Features

- **Black-Scholes engine** — theoretical price, Delta, Gamma, Theta, Vega, Rho
- **Payoff diagram** — Expiry, T+0, and T½ curves with breakeven markers
- **Multi-leg builder** — combine legs into spreads, straddles, condors etc.
- **Breakeven table** — max profit, max loss, breakeven levels

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Clerk (auth — coming soon)
- Stripe (payments — coming soon)
- Supabase (database — coming soon)

## Getting started

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Fill in your keys in .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/              # Next.js App Router pages
  components/       # React components
    OptionsAnalyser.tsx   # Main UI wrapper
    PayoffChart.tsx       # Recharts payoff diagram
    GreeksTable.tsx       # Greeks metric cards
    MultiLegBuilder.tsx   # Multi-leg strategy builder
  lib/
    blackScholes.ts       # BS engine + greeks (pure TS, no deps)
```

## Deployment

Push to `main` → Vercel auto-deploys. GitHub Actions runs lint + type check + build on every push.

## Roadmap

- [ ] Stripe payments + freemium gating
- [ ] Clerk auth + saved strategies
- [ ] Live underlying price fetch (Yahoo Finance)
- [ ] IV surface visualisation
- [ ] GEX strip (moomoo API)
- [ ] Moomoo live option chain integration
