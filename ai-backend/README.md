# FINN AI API

This directory is deployed as a separate Vercel project with Root Directory set to `ai-backend`. It serves both static assignment sites; GitHub Pages never receives provider credentials.

## Provider and source controls

- Ask FINN uses Gemini 3.5 Flash-Lite for synthesis. Simple lookups for the latest results filing use sorted NSE metadata directly.
- Company Research and Ask FINN share a three-minute cache of normalized NSE announcement metadata. Quote data is cached for 45 seconds during the NSE pre-open/market/close-transition window and 15 minutes outside it; weekend hours use the longer window. Exchange holidays are not loaded as a calendar, so a weekday holiday conservatively keeps the short cache. End-of-day history uses a 30-minute cache. Requests for the same data within one function instance share an in-flight fetch, and the Vercel Runtime Cache shares cacheable data across functions in the same region.
- Responses keep the quote's source timestamp when NSE supplies one and retain its original fetch timestamp separately. If NSE provides no source timestamp, the UI says when FINN fetched the response and explicitly notes that the source time is unavailable.
- For a question about figures or outlook, FINN may send one relevant official NSE PDF to Gemini. The server allows official NSE archive hosts, rejects redirects, and limits the PDF fetch to six seconds and 2 MiB. Answers distinguish PDF evidence from announcement metadata and cite records supplied by FINN. For PDF citations, the model supplies the page number and FINN links that page in the source document.
- When NSE metadata is unavailable, FINN reports the error. When a PDF or a usable model answer is unavailable, it keeps the official links and labels the response as metadata.
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

`GET /api/ask-company` reports whether the Gemini API key is configured. `POST` returns an answer, official sources, evidence type, and the filing snapshot time. The response headers expose stage durations through `Server-Timing` and the cache outcome through `X-Finn-Cache`. The endpoint does not receive saved portfolio, watchlist, network-profile, or market-price data and does not use AI for calculations.

The per-IP throttle is in-memory and best-effort because serverless instances do not share memory. Before broader public use, replace it with a shared rate-limit store or platform firewall. Google free-tier quotas and the NSE website's availability also apply.

## Live market data proxy

`GET /api/market-data?view=overview` requests NSE index values, gainers, losers and historical NIFTY 50 closes. `GET /api/market-data?view=company&symbol=HDFCBANK` returns an official quote, up to the NSE history tool's supported range of daily prices, and recent corporate-announcement metadata. `GET /api/market-data?view=search&q=HDFC` searches NSE-listed equities. Responses are briefly cached to limit repeated MCP calls; the endpoint does not invent fallback values.

NSE describes intraday market data as delayed by 1–3 minutes and the bhavcopy history as end-of-day data. Its page states the MCP data is for information and learning and is not for trading, investment advice or commercial products. This academic prototype retains those limits in its UI. See [NSE MCP](https://www.nseindia.in/nse-mcp).
