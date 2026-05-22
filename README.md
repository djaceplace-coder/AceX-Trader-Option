# Acextraderoption — Rapid Build

A premium DeFi, Forex & Crypto trading platform built for GitHub Pages + Supabase.

## Business Rules
- **$500 Deposit Gate** (10% of $5K threshold) required for bot activation
- **$5,000 Portfolio Value** required to unlock withdrawals
- **0% Bot Trading Fees** — platform revenue from gates & loan remittances
- **15% Loan Remittance** required upfront for any loan package

## Placeholder Deposit Addresses
- USDT TRC20: `TChv3f5g8a9kL2mNpQrStUvWxYzAbCdEfG`
- USDT ERC20: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- BTC SegWit: `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`

## Deploy
1. Push this repo to GitHub.
2. Enable GitHub Pages (Settings > Pages > Source: GitHub Actions).
3. Add Secrets (Settings > Secrets and variables > Actions):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Push to `main`. GitHub Actions auto-deploys.

## Mock Mode
If Supabase credentials are not injected, the app runs in **Mock Mode** using localStorage. All UI, gates, and flows work identically.

## Structure
