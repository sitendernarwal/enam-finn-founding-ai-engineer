# FINN architecture and data boundaries

## Current prototype

FINN is a static HTML, CSS, and JavaScript frontend hosted with GitHub Pages. Both assignment builds use the shared serverless API at `finn-ai-api` on Vercel.

```text
Mobile / desktop browser
  ├─ Market and company research ──> Vercel /api/market-data ──> NSE MCP
  └─ Ask FINN ─────────────────────> Vercel /api/ask-company ──> NSE disclosures + Gemini
```

- **Market data:** The API retrieves official NSE index, quote, end-of-day history, and market-mover data. It returns a dated end-of-day snapshot when live movers are unavailable. The UI does not substitute sample prices.
- **Company research:** Displays returned NSE quotes, historical closes, announcement metadata, and links to NSE filings. Revenue, profit, EBITDA, margins, and valuation metrics stay unavailable when the market feed does not supply them.
- **Calculations and charts:** Price changes use exchange-reported values or are calculated from actual current/previous closes. Chart ranges and points come from the returned price series; the app does not create synthetic observations.
- **AI:** Ask FINN uses Gemini through the server-side API. The server retrieves recent NSE announcement metadata, selects relevant records, and includes official source links. The model does not read the linked PDF contents, so responses must not be treated as verified financial-statement analysis. The API key stays in Vercel environment settings.
- **Workspace state:** Theme, portfolio symbols, and watchlist symbols are stored in browser local storage. A portfolio entry is a tracked company, not a position or return calculation.
- **Network:** This view remains empty until a real, authorized contact source is connected. The app does not provide synthetic profiles or import contacts.

## Service behavior and limits

The market endpoint caches successful responses briefly and applies upstream timeouts. The frontend prevents overlapping refreshes and keeps the last successful snapshot visible if a later refresh fails. NSE may delay intraday values by 1–3 minutes; historical prices are end-of-day.

Gemini uses the free-tier service where available. Quotas and availability depend on Google's current limits. Questions should contain no personal or confidential information. All claims should be checked against the linked NSE filing.

## Production considerations

A production service would need confirmed data-provider terms, durable storage, accounts and access controls, monitoring, and explicit consent before connecting personal network data. Keep provider credentials server-side, minimize retained data, and make the freshness and evidence period visible for every financial claim.
