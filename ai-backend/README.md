# FINN AI API

This directory is deployed as a separate Vercel project with Root Directory set to `ai-backend`. It serves both static assignment sites; GitHub Pages never receives provider credentials.

## Provider and cost controls

- Requests use Google's `gemini-2.5-flash` model with Google Search grounding. Google currently lists model tokens as free and grounding as free up to 500 requests/day for the Gemini 2.5 Flash/Flash-Lite free tier; quotas and terms can change.
- Keep the Google AI Studio project on the Free tier with no billing account linked. When free-tier quota is exhausted, requests should be rejected by Google rather than billed.
- Google Search grounding is not restricted at the provider level to NSE/BSE. The system prompt requests exchange-only research, and the backend only returns citation URLs on `nseindia.com` or `bseindia.com`; if no official source is returned, it replaces the answer with a no-verification message.
- Google may use free-tier prompts and responses to improve its products. Only the selected company, ticker, and typed question are sent; users are told not to include personal or confidential details.

## Setup

1. Import the Founding assignment repository into Vercel and set Root Directory to `ai-backend`.
2. Add `GEMINI_API_KEY` as a Sensitive environment variable in Vercel for Production (and Preview if needed), then redeploy. Never put the key in a frontend file or commit it to Git.
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

`GET /api/ask-company` reports whether the Gemini API key is configured without exposing it. `POST` uses Gemini 2.5 Flash with Google Search grounding and returns validated HTTPS citations from `nseindia.com` or `bseindia.com`. Google Search can return other domains, but those citations are excluded; if no official exchange source is found, the endpoint returns a no-verification message. The endpoint does not receive saved portfolio, watchlist, network-profile, or market-price data.

An in-memory per-IP throttle is best-effort because serverless instances do not share memory. Before broader public use, replace it with a shared rate-limit store or platform firewall. Gateway's free-tier model rate limits also apply.
