# FINN — Founding AI Engineer build challenge

A responsive, mobile-first prototype for an investor's daily workflow: a prioritized Push brief, Pull company research, and a private Network layer woven into both.

**Live demo:** https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/  
**Public repository:** https://github.com/sitendernarwal/enam-finn-founding-ai-engineer

## Run locally

Open `index.html` in a browser, or serve this folder with `python3 -m http.server 8000` and visit `http://localhost:8000`.

The phone layout includes persistent bottom navigation. Dark mode is the default, with a remembered light-mode option. Charts display illustrative data only; no live market feed is connected.

## AI research assistant

The Research view includes Ask FINN. Its shared server-side API lives in `ai-backend/` and runs on Vercel; GitHub Pages serves only the static interface. The API uses Gemini 2.5 Flash with Google Search grounding. Only validated NSE/BSE citations are shown; the API key stays in Vercel. See [AI_IMPLEMENTATION_ROADMAP.md](AI_IMPLEMENTATION_ROADMAP.md) and [ai-backend/README.md](ai-backend/README.md) for setup and free-tier limits.

## Demo flows

- Filter a four-item portfolio brief by filings or market moves; open an item to continue into company research.
- Search the sample companies, review the quarterly revenue chart and illustrative calculations, compare risks, and save research.
- Browse all 16 tracked companies in Portfolio, search by name or sector, and add selected companies to a device-local Watchlist.
- Explore synthetic network profiles, filter by expertise, and draft a private question without sending it.
- Open alert preferences and the network privacy explanation.
- Use `⌘K` / `Ctrl+K` to jump to company research.
- Review the simulated NIFTY 50 pulse and synchronized dashboard quotes.

## Data and limitations

Market values, financial tables, alerts, and profile matches remain illustrative and are not live market data. Ask FINN searches the web and displays only validated NSE/BSE citations; it may not find an official filing for every question. Six tracked companies have illustrative research figures; data for the other ten stays blank until sourced. Share quantities, purchase prices, portfolio value, and returns are not provided. Watchlist choices are saved in this browser on this device, not synced to an account. Network profiles are synthetic. Do not treat the prototype as investment advice.

## Architecture and production path

See [ARCHITECTURE.md](ARCHITECTURE.md) for the data flow, model boundaries, privacy controls, and a practical production path.

See [DEPLOYMENT.md](DEPLOYMENT.md) for static-host steps. See [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for an honest status of each assignment checkpoint. The [COVERING_NOTE.md](COVERING_NOTE.md) and [AI_BUILD_HISTORY.md](AI_BUILD_HISTORY.md) are ready to include with the submission.
