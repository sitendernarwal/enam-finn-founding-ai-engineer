# FINN AI API

This directory is deployed as a separate Vercel project with Root Directory set to `ai-backend`. It serves both static assignment sites; GitHub Pages never receives provider credentials.

## Provider and source controls

- Requests use Google's `gemini-3.5-flash-lite` model and URL Context. The standard free tier lists model tokens as free, and URL Context is listed as free. Google Search grounding is not used because it is not part of this model's free tier. Check Google's current [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) and [URL Context guide](https://ai.google.dev/gemini-api/docs/url-context) for current terms and limits.
- The backend queries NSE's public corporate-announcements endpoint for the selected NSE symbol over the last 12 months. This is the endpoint used by NSE's public filings site, not a licensed developer data feed; NSE may change or restrict it. If the endpoint is unavailable, FINN fails closed and asks the user to retry.
- Gemini receives only the selected company name, NSE ticker, question, recent NSE announcement metadata, and official NSE filing URLs. URL Context reads the specific official attachments supplied by the backend. The prompt instructs Gemini to use only that evidence and to state when the supplied sources do not support a claim.
- Returned source links are validated HTTPS URLs on `nseindia.com`, `nsearchives.nseindia.com`, or `bseindia.com`. When no recent NSE record is found, FINN provides the exchange query and filing page rather than generating an answer from model memory.
- Google may use free-tier prompts and responses to improve its products. Users are told not to include personal or confidential details.

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
  "question": "Summarise the most recent results and cite the reporting period."
}
```

`GET /api/ask-company` reports whether the Gemini API key is configured without exposing it. `POST` retrieves NSE corporate-announcement records for the supplied symbol, then uses Gemini 3.5 Flash-Lite and URL Context to summarize official attachment URLs. Only validated HTTPS exchange links are returned. The endpoint does not receive saved portfolio, watchlist, network-profile, or market-price data and does not use AI for calculations.

The per-IP throttle is in-memory and best-effort because serverless instances do not share memory. Before broader public use, replace it with a shared rate-limit store or platform firewall. Google free-tier quotas and the NSE website's availability also apply.
