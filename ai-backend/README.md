# FINN AI API

This directory is deployed as a separate Vercel project with Root Directory set to `ai-backend`. It serves both static assignment sites; GitHub Pages never receives provider credentials.

## Provider and source controls

- Requests use Google's `gemini-3.5-flash-lite` model. The backend sends a small set of official NSE announcement metadata records to Gemini. It does not use URL Context or Google Search grounding; this avoids long filing-fetch requests and keeps the answer tied to the metadata we actually retrieved. Check Google's current [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) for current terms and limits.
- The backend queries NSE's public corporate-announcements endpoint for the selected NSE symbol over the last 12 months. This is the endpoint used by NSE's public filings site, not a licensed developer data feed; NSE may change or restrict it. If the endpoint is unavailable, FINN fails closed and asks the user to retry.
- Gemini receives only the selected company name, NSE ticker, question, and up to four recent NSE announcement metadata records. Official filing URLs are returned for the user to open and verify; Gemini is explicitly told not to claim it read the attachment contents. The prompt instructs Gemini to use only the supplied metadata and to state when it does not support a claim.
- Returned source links are validated HTTPS URLs on NSE's `nseindia.com` / `nseindia.in` domains and their archive subdomains, or on `bseindia.com`. When no recent NSE record is found, FINN provides the exchange query and filing page rather than generating an answer from model memory.
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

`GET /api/ask-company` reports whether the Gemini API key is configured without exposing it. `POST` retrieves recent NSE corporate-announcement metadata for the supplied symbol and asks Gemini 3.5 Flash-Lite to summarize only those records. Validated HTTPS exchange links are returned so users can inspect the original documents. The endpoint does not receive saved portfolio, watchlist, network-profile, or market-price data and does not use AI for calculations.

The per-IP throttle is in-memory and best-effort because serverless instances do not share memory. Before broader public use, replace it with a shared rate-limit store or platform firewall. Google free-tier quotas and the NSE website's availability also apply.
