# FINN — Founding AI Engineer build challenge

A responsive, mobile-first prototype for an investor's daily workflow: a prioritized Push brief, Pull company research, and a private Network layer woven into both.

**Live demo:** https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/  
**Public repository:** https://github.com/sitendernarwal/enam-finn-founding-ai-engineer

## Run locally

Open `index.html` in a browser, or serve this folder with `python3 -m http.server 8000` and visit `http://localhost:8000`.

The phone layout includes persistent bottom navigation. Dark mode is the default, with a remembered light-mode option. Charts display illustrative data only; no live market feed is connected.

## Demo flows

- Filter a four-item portfolio brief by filings or market moves; open an item to continue into company research.
- Search the sample companies, review the quarterly revenue chart and illustrative calculations, compare risks, and save research.
- Browse all 16 tracked companies in Portfolio, search by name or sector, and add selected companies to a device-local Watchlist.
- Explore synthetic network profiles, filter by expertise, and draft a private question without sending it.
- Open alert preferences and the network privacy explanation.
- Use `⌘K` / `Ctrl+K` to jump to company research.
- Review the simulated NIFTY 50 pulse and synchronized dashboard quotes.

## Data and limitations

Everything is a front-end demo. Market values and financial tables are explicitly illustrative; sample alerts and profile matches are not live, verified exchange data. Source links lead to public exchange or company-document discovery pages, not to a specific filing. Six of the 16 tracked companies have illustrative research figures; data for the other ten stays blank until sources are connected. Share quantities, purchase prices, portfolio value, and returns are not provided. Watchlist choices are saved in this browser on this device, not synced to an account. Network profiles are synthetic. Do not treat the prototype as investment advice.

## Architecture and production path

See [ARCHITECTURE.md](ARCHITECTURE.md) for the data flow, model boundaries, privacy controls, and a practical production path.

See [DEPLOYMENT.md](DEPLOYMENT.md) for static-host steps. See [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for an honest status of each assignment checkpoint. The [COVERING_NOTE.md](COVERING_NOTE.md) and [AI_BUILD_HISTORY.md](AI_BUILD_HISTORY.md) are ready to include with the submission.
