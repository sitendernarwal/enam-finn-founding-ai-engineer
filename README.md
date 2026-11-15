# FINN — Founding AI Engineer build challenge

A mobile-first Indian equities workspace for a live market brief, source-linked company research, a personal portfolio tracker, and a device-local watchlist.

**Live demo:** https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/  
**Public repository:** https://github.com/sitendernarwal/enam-finn-founding-ai-engineer

## Run locally

Serve this folder over HTTP so the browser can call the shared API:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. NSE market data and Ask FINN are remote services; they will not run by opening `index.html` as a local file.

## Live data and AI

The Market and Research views request live and end-of-day market data from the official NSE MCP service through the shared Vercel API. NSE reports a 1–3 minute delay during trading hours. Stock research displays the exchange quote, returned historical closes, and NSE corporate-announcement metadata with official filing links. Quarterly revenue, EBITDA, profit, and market capitalization are not supplied by this feed and are left unavailable rather than estimated.

Ask FINN uses Gemini 3.5 Flash-Lite on the server. It summarizes recent NSE announcement metadata and returns official filing links separately; it does not claim to read an attachment unless its contents are provided. The API key remains in Vercel and is never sent to the browser. See [ai-backend/README.md](ai-backend/README.md) for service details.

NSE provides its MCP data for educational and informational use, not for real-time trading, investment advice, or commercial products. See [NSE's terms](https://www.nseindia.in/nse-mcp) before reusing the feed. FINN is not investment advice.

## App flows

- Review NSE index values and official gainers/losers in Market; refresh manually or let the view refresh periodically.
- Search NSE listings by company name or symbol, then inspect a live quote, actual end-of-day price history, and official announcements.
- Ask FINN about the selected company's recent NSE announcement metadata.
- Add a company to Portfolio or Watchlist from its research view. Lists are empty until you choose companies and remain on this device.
- Use the dark-default theme toggle and the phone-sized bottom navigation.
- Use `⌘K` / `Ctrl+K` to open company search.

The Network view is intentionally empty until an authorized real contact source is connected; it contains no synthetic people or private data.

## Architecture

GitHub Pages serves the static frontend. The shared Vercel project in `ai-backend/` proxies public NSE market requests and provides the Gemini filing-metadata endpoint. Browser storage holds only your selected portfolio and watchlist symbols; neither list is sent to Ask FINN. See [DEPLOYMENT.md](DEPLOYMENT.md), [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md), [COVERING_NOTE.md](COVERING_NOTE.md), and [history.md](history.md) for submission materials.
