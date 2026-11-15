# Submission readiness — Founding AI Engineer

| Requirement | Status | Evidence / remaining work |
|---|---|---|
| Mobile-first working prototype | Ready for review | [Live prototype](https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/). Checked at a 390 px viewport: full-width content, fixed five-item bottom navigation, and both theme states. |
| Push, Pull, and Network workflows | Partial | Market brief and company research are live. Network is intentionally empty until a real, authorized contact source is connected; no synthetic profiles or alerts are shown. |
| Mock portfolio of 15–20 listed companies | Adapted to live-data requirement | The portfolio starts empty and lets the user add NSE companies from Research. It does not seed a fictional 15–20-company portfolio or invent positions and returns. |
| Portfolio and watchlist navigation | Complete | Add/remove actions, company lookup, search/filter, device-local persistence, and five-item mobile navigation are available. |
| 3–5 ad-hoc research companies outside portfolio | Available on demand | Search NSE company names or symbols in Research; company availability depends on NSE search/quote coverage. |
| Generalize to any NSE ticker | Implemented with source limits | Direct NSE symbols load the company research view. A quote may be unavailable outside market hours or for symbols not covered by the feed. |
| Market data, filings, fundamentals, network profiles | Partial, sourced | Index history, live movers plus the latest-session EOD movers fallback, end-of-day share history, and NSE announcement metadata/linkouts use the NSE feed. Verified financial statements and network contacts are not part of these sources and remain unavailable. |
| Calculation and analysis | Partial, sourced | Price changes are calculated from exchange closes and the chart uses returned NSE history. Revenue, profit, EBITDA, margins, and valuation ratios are not estimated without verified inputs. |
| AI/model and cloud implementation | Implemented and checked | Server-side Gemini summarizes recent NSE announcement metadata and returns filing links. One deployed HDFC Bank query returned an answer and official NSE sources. It does not read filing PDFs; free-tier quotas apply. See `ai-backend/README.md`. |
| Dark/light theme and responsive navigation | Complete | Dark is the default; the toggle changes and remembers the theme. The five-item bottom bar is fixed and safe-area aware on phones. |
| Deployment | Complete | GitHub Pages serves the frontend; the shared Vercel backend serves market data and Ask FINN. See [DEPLOYMENT.md](DEPLOYMENT.md). |
| Public repository | Complete | [GitHub repository](https://github.com/sitendernarwal/enam-finn-founding-ai-engineer). |
| AI build history | Prepared | See [history.md](https://github.com/sitendernarwal/enam-finn-founding-ai-engineer/blob/main/history.md). A full conversation link is only needed if the reviewer specifically asks for it. |
| Short covering note | Ready to send | See [COVERING_NOTE.md](COVERING_NOTE.md) for the submission email text and project links. |

**Review note:** The prototype is live-data backed, but its scope is not a full financial terminal. NSE intraday data may be delayed 1–3 minutes; outside market hours the app may show the latest dated close and no movers. Fundamentals require checking linked company filings. NSE data is for educational/informational use and is not investment advice.
