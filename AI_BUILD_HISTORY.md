# FINN — Founding AI Engineer build history

This record explains how the Codex-assisted prototype moved from simulated scenarios to an NSE-backed workspace, how the Founding assignment’s Network workflow fits into company research, and what was verified for submission. The companion [history.md](history.md) presents selected decisions in a curated dialogue format.

## 1. Turn the assignment into an investor workflow

Sitender and Codex reviewed the Founding AI Engineer brief and financial glossary. They organized the prototype around a **Push** brief that surfaces changes in tracked companies and a **Pull** research view that lets an investor investigate a company on demand. The Founding build also connects both views to a **Network** workflow for finding someone with relevant company or sector context.

The first pass used static HTML, CSS, and JavaScript. A 16-company starting universe, five additional research examples, and clearly marked simulated prices and quarterly figures helped test the navigation and the presentation of financial calculations. The NSE-backed market and research views superseded those early figures. [Architecture](ARCHITECTURE.md)

## 2. Make the workspace work on a phone

- Added floating bottom navigation, touch-sized controls, a dark default, and a light theme that remembers the user’s choice. Tapping a company on a phone now opens Research and brings the company details into view.
- Added a searchable Portfolio and a Watchlist that starts empty. The Portfolio starts with 16 listed companies for coverage. Both lists store selected symbols in the browser. This prototype tracks company coverage and leaves investment positions and returns outside its scope.
- Refined the glass surfaces after mobile feedback about spacing and low contrast. The later treatment uses translucent navigation, edge highlights, and browser-dependent SVG refraction with a CSS blur fallback. Light mode uses a cool-gray tint and darker labels. Data cards use steadier backgrounds to keep charts and figures readable.
- Added the animated **“Sitender is gathering the data”** glass capsule for the initial NSE request, followed by the market view or an explicit error state.

## 3. Replace the simulated feed with NSE data

GitHub Pages serves the frontend, and both assignment sites use a shared Vercel backend. The backend calls NSE MCP for delayed quotes, index values, end-of-day history, and official announcement metadata. Research shows NSE filing links and supports exact-symbol lookup when name search misses. Financial fields such as revenue, EBITDA, and profit stay unavailable when the feed has no underlying figures.

The first live-data pass produced an empty movers section outside market hours. The market view now falls back to verified gainers and losers from the latest available NSE session and labels them as end of day. It shows the dated closes for NIFTY 50 and NIFTY Bank and distinguishes the exchange’s source timestamp from FINN’s fetch time. Public quotes, history, and filings have separate cache lifetimes, and overlapping requests for the same resource within a backend instance share an upstream fetch. This reduces duplicate NSE work. An end-to-end latency improvement has yet to be measured. [Backend details](ai-backend/README.md)

## 4. Build the Founding-specific Network and Push brief

The Network directory uses clearly labeled fictional profiles, employers, and relationship paths. A user can filter by company or sector, explore a potential introduction or reconnect, and move between company research and relevant profiles.

The Market Push brief screens tracked companies for price moves and material filings and can surface relevant fictional network context alongside those events. Exchange events use NSE data. The relationship examples use the seeded directory, so a user can try the workflow without importing contacts.

## 5. Ground Ask FINN in official filings

Ask FINN runs Gemini 3.5 Flash-Lite on Vercel. The browser sends the selected ticker, company name, and question, and the provider key stays on the server. A straightforward latest-filing lookup uses sorted NSE records directly. For questions about reported figures or outlook, the service ranks recent announcements and can retrieve one relevant official NSE PDF within a six-second, 2 MiB limit. Mixed earnings-and-outlook questions are handled together, and the prompt instructs the model to preserve reporting periods and units.

The service checks source links against the NSE records it fetched. A PDF citation can open at a page suggested by the model, so the reader can check the cited passage in context. When a PDF or usable model answer is unavailable, Ask FINN can fall back to labeled announcement metadata and official links. The server records timing for the NSE, PDF, and model stages. [Evidence and caching controls](ai-backend/README.md)

## 6. Verify and publish

- **Data and AI.** Development checks covered JavaScript syntax, NSE date parsing, filing order, mixed question types, duplicate fetches, and citation fallback. A production RELIANCE smoke test returned a quote, historical closes, and NSE filings. A separate question about results and outlook returned links to pages in an official filing PDF. This verified one live AI example. Gemini quota and NSE availability can still affect responses.
- **Interface.** Browser checks exercised phone, tablet, and desktop viewport sizes in both themes. They covered page overflow, opening a company from Market, adding and removing a Watchlist entry, and filtering Network profiles.
- **Release.** The static frontend was published to GitHub Pages with the shared API on Vercel. [Live app](https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/) · [Frontend release commit](https://github.com/sitendernarwal/enam-finn-founding-ai-engineer/commit/b7a04e405d0d60dda72ab56bc0bbb5d8415c2dae) · [Submission checklist](SUBMISSION_CHECKLIST.md)
