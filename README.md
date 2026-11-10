# FINN — Founding AI Engineer build challenge

A responsive, mobile-first prototype for an investor's daily workflow: a prioritized Push brief, Pull company research, and a private Network layer woven into both.

**Live demo:** https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/  
**Public repository:** https://github.com/sitendernarwal/enam-finn-founding-ai-engineer

## Run locally

Open `index.html` in a browser, or serve this folder with `python3 -m http.server 8000` and visit `http://localhost:8000`.

## Demo flows

- Filter a four-item portfolio brief by filings or market moves; open an item to continue into company research.
- Search the sample companies, compare illustrative quarterly metrics, review a bull and bear case, and follow a company.
- Explore synthetic network profiles, filter by expertise, and draft a private question without sending it.
- Open alert preferences and the network privacy explanation.
- Use `⌘K` / `Ctrl+K` to jump to company research.

## Data and limitations

Everything is a front-end demo. Market values and financial tables are explicitly illustrative; sample alerts and profile matches are not live, verified exchange data. Source links lead to public exchange or company-document discovery pages, not to a specific filing. The 16-company mock portfolio has populated illustrative figures for six companies; the other ten are listed as watchlist placeholders until source data is connected. Network profiles are synthetic. Do not treat the prototype as investment advice.

## Architecture and production path

See [ARCHITECTURE.md](ARCHITECTURE.md) for the data flow, model boundaries, privacy controls, and a practical production path.

See [DEPLOYMENT.md](DEPLOYMENT.md) for static-host steps. See [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for an honest status of each assignment checkpoint, plus [COVERING_NOTE.md](COVERING_NOTE.md) and [AI_BUILD_HISTORY.md](AI_BUILD_HISTORY.md) drafts.
