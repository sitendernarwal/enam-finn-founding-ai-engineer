# FINN AI API

This directory is deployed as a separate Vercel project with Root Directory set to `ai-backend`. It is a server-side API and does not depend on GitHub Pages function support.

## Setup

1. Import the Founding assignment repository into Vercel and set Root Directory to `ai-backend`.
2. Add `OPENAI_API_KEY` as a Vercel environment variable. Never add it to this repository or frontend code.
3. Optionally set `OPENAI_MODEL` (default `gpt-6.1-sol`) and `FINN_ALLOWED_ORIGINS` (comma-separated exact origins). The default allowlist includes `https://sitendernarwal.github.io` and local development origins.
4. Deploy, then copy the project URL and set the full `/api/ask-company` endpoint in each frontend's `ai-config.js`.

## Endpoint

`POST /api/ask-company`

```json
{
  "ticker": "HDFCBANK",
  "companyName": "HDFC Bank",
  "question": "Summarise the most recent results and cite the filing date."
}
```

The endpoint uses the OpenAI Responses API with web search restricted to NSE/BSE domains. It returns plain answer text plus validated HTTPS citations. The endpoint does not receive saved portfolio, watchlist, or network data.

The in-memory per-IP throttle is best-effort because serverless instances do not share memory. Before broad public use, replace it with a shared rate-limit store or a platform firewall rule and set usage budgets/alerts in the model provider account.
