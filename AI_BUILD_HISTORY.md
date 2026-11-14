# AI build history summary

This is a truthful summary of the Codex-assisted work in this workspace, not a verbatim conversation transcript. The companion history.md is a curated, dialogue-style project record.

## Work completed in this session

- Read the Founding AI Engineer brief and its financial glossary.
- Built a static, mobile-responsive FINN prototype with a daily Push brief, Pull research views, alert filters, watchlist search, and a synthetic Network workflow.
- Added architecture notes covering source ingestion, model boundaries, cloud shape, and network privacy controls.
- Audited the implementation against the assignment and added five research-only companies, arbitrary NSE ticker source lookup, clearer sample-data labels, and submission readiness notes.
- Ran JavaScript syntax checks with `node --check` on the prototype script.
- Published the static prototype to GitHub Pages and opened the live page in a desktop browser: https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/.
- Created the public source repository: https://github.com/sitendernarwal/enam-finn-founding-ai-engineer.

- Added a dark-default theme with a remembered light-mode toggle, phone-safe bottom navigation, and higher-contrast financial calculations.
- Added a quarterly revenue chart shown only when sample company inputs are available, plus a synchronized simulated market pulse.
- Added searchable Portfolio and Watchlist screens, with browser-local watchlist persistence and explicit disclosures that real positions and returns are not connected.
- Checked the responsive layout at a 390 px browser viewport; horizontal overflow was not present. This was not a physical-device retest.

## AI use and review approach

Codex assisted with UI structure, seed data, interactions, documentation, and requirements audits. All sample values and alert stories are illustrative. Ask FINN uses a shared server-side Gemini 3.5 Flash-Lite API. The backend retrieves recent official NSE disclosures and uses URL Context to summarize their linked filings; only validated official NSE/BSE URLs are displayed. The model does not calculate portfolio metrics, and no live market-price feed is connected.

For the build-history checkpoint, use the curated history.md included in the repository. A full Codex export or share link can be provided if a reviewer specifically asks for the complete raw conversation.
