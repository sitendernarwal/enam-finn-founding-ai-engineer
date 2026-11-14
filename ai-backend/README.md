# FINN AI API

This directory is deployed as a separate Vercel project with Root Directory set to `ai-backend`. It serves both static assignment sites; GitHub Pages never receives provider credentials.

## Provider and cost controls

- Requests use Vercel AI Gateway's free-eligible `nvidia/nemotron-3.5-lightning-free` model and the Parallel web-search tool restricted to NSE/BSE domains.
- The model's listed input and output token prices are $0. Search is billed at $5 per 1,000 search calls, covered by Vercel's included $5 monthly AI Gateway allowance while it is available. The endpoint never selects a paid model or buys credits. Keep auto-reload disabled; requests stop with a clear error when the free balance is unavailable or exhausted.
- Vercel requires a valid payment method on the account to activate free AI Gateway credits. The app does not add one or purchase credits.
- The free NVIDIA endpoint may log prompts and responses to improve its services. Only the selected company, ticker, and typed question are sent; users are told not to include personal or confidential details.

## Setup

1. Import the Founding assignment repository into Vercel and set Root Directory to `ai-backend`.
2. Vercel sends an OIDC token in the `x-vercel-oidc-token` header for each function invocation; the handler uses it to authenticate with AI Gateway. For local development, use a linked Vercel project with `vercel env pull`, or set an `AI_GATEWAY_API_KEY` in an uncommitted local environment file.
3. Deploy, then set the `/api/ask-company` endpoint in each frontend's `ai-config.js`.

## Endpoint

`POST /api/ask-company`

```json
{
  "ticker": "HDFCBANK",
  "companyName": "HDFC Bank",
  "question": "Summarise the most recent results and cite the filing date."
}
```

`GET /api/ask-company` reports whether Gateway authentication is available without exposing a token. `POST` uses a free-eligible text model plus server-side Parallel Search, constrained to `nseindia.com` and `bseindia.com`, and returns an answer with validated HTTPS citations. The endpoint does not receive saved portfolio, watchlist, network-profile, or market-price data.

An in-memory per-IP throttle is best-effort because serverless instances do not share memory. Before broader public use, replace it with a shared rate-limit store or platform firewall. Gateway's free-tier model rate limits also apply.
