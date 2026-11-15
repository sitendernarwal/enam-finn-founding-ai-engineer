# Deployment

**Live demo:** https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/  
**Repository:** https://github.com/sitendernarwal/enam-finn-founding-ai-engineer

## Hosting

GitHub Pages serves the static frontend from the `main` branch and repository root; there is no frontend build step. The shared Vercel project, `finn-ai-api`, provides the API routes used by both prototypes:

- `/api/market-data` proxies public NSE market data and historical closes.
- `/api/ask-company` summarizes recent NSE announcement metadata with Gemini and returns official filing links.

The Vercel backend reads `GEMINI_API_KEY` from its server-side environment. Keep that key in Vercel; never add it to frontend code or commit it. The frontend works locally for its layout and interactions, but live data and Ask FINN require network access to the deployed API.

## Local preview

From this folder, run `python3 -m http.server 8000` and open `http://localhost:8000`.

## Data and review limits

NSE says intraday data may be delayed by 1–3 minutes and is for educational/informational use. Outside market hours, the interface can show the latest dated end-of-day close while live movers are unavailable. The integrated market feed does not provide verified quarterly financial statements, so fundamentals remain unavailable until checked against company filings. Ask FINN summarizes announcement metadata; it does not claim to read PDF attachments. Review NSE's [data terms](https://www.nseindia.in/nse-mcp) before reuse. This prototype is not investment advice.

The current frontend was checked at a 390 px phone viewport. GitHub Pages rebuilds after changes to `main`; check the repository's Actions tab if an update has not appeared.
