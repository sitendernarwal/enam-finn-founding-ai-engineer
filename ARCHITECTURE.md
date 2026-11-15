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
- **Demo coverage:** On first visit, 16 real NSE symbols are added as a company coverage universe. The selection is demo setup; quotes, filings, and chart values are fetched from the live endpoints. It can be edited and never implies holdings or returns.
- **Network:** The founding build includes eight explicitly synthetic profiles. Their fictional career paths and relationships overlap the same real NSE symbols. The profile data stays in the static client, is not sent to the market or AI APIs, and appears in company research and the portfolio digest. It demonstrates the workflow without importing anyone's contacts.
- **Push:** The portfolio digest screens returned quote changes against a user-set absolute percentage threshold and classifies actual NSE filing metadata into material categories. The digest window is selectable. It refreshes in the open application; it is not a background notification service. Classification uses transparent keyword rules, not an AI-generated event claim.
- **Pull:** Ask FINN is grounded in recent filing metadata and source links. Annual reports and earnings-call transcripts are not yet ingested, so full fundamentals and management-guidance analysis remain out of scope.
- **Liquid Glass:** The top bar, sidebar/mobile dock, market strip, and controls use layered translucent CSS, edge reflections, blur, and a progressive SVG displacement/specular filter where supported. Safari/iOS keeps the CSS glass fallback; dense chart and analysis panels remain more opaque for contrast.

## Service behavior and limits

The market endpoint caches successful responses briefly and applies upstream timeouts. The frontend prevents overlapping refreshes and keeps the last successful snapshot visible if a later refresh fails. NSE may delay intraday values by 1–3 minutes; historical prices are end-of-day.

Gemini uses the free-tier service where available. Quotas and availability depend on Google's current limits. Questions should contain no personal or confidential information. All claims should be checked against the linked NSE filing.

## Production considerations

A production service would need confirmed data-provider terms, durable storage, accounts and access controls, monitoring, and explicit consent before connecting personal network data. Keep provider credentials server-side, minimize retained data, and make the freshness and evidence period visible for every financial claim.
