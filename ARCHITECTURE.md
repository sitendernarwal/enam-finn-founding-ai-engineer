# FINN architecture and privacy notes

## Prototype

The prototype is static HTML, CSS, and JavaScript. UI state and seed data live in `app.js`; it has no server, credentials, database, analytics, or third-party model calls. This keeps the demo cheap and makes every interaction inspectable. The displayed financial values, alerts, and network profiles are sample content, not a live data product.

## Production shape

```text
NSE/BSE filings ─┐
Market data ─────┼─> scheduled ingestion ─> normalized company/event store ─> Push ranking
Company reports ┘                                         │
                                                          ├─> Pull research with cited evidence
Investor-approved contacts ─> encrypted private graph ────┴─> permission-checked Network matches
```

- **Market prices and volume:** fetch end-of-day data from a licensed or permitted provider; normalize symbols and trading dates. Cache snapshots and show freshness and source.
- **Announcements / filings:** ingest exchange disclosures, retain the original document URL and filing timestamp, and classify events. Keep the original text available beside any summary.
- **Fundamentals:** use company annual reports and earnings-call transcripts, with document metadata, page/section references, and reporting periods. Prefer primary documents; do not use broker notes or news for Pull analysis.
- **Investor network:** store only people the investor has consented to add. Use explicit relationship and expertise fields; avoid scraping professional profiles.

## AI boundaries

Use deterministic code for price/volume thresholds, financial calculations, and alert ranking. A language model may summarize retrieved filing passages and draft a research narrative, but every factual claim should link to evidence and identify its period. Do not let a model invent financial figures or make contact decisions. Keep the retrieval set and prompt short; use a lower-cost model for extraction and reserve a stronger model for synthesis when needed. The current prototype makes no model calls, so it has no inference cost. In production, cache results, batch extraction, and use the smallest model that meets the evidence and quality bar; this should keep a focused demo within free or low-cost tiers.

## Privacy and security

Network data is the most sensitive part of FINN. In production, encrypt data in transit and at rest, isolate each investor's graph with tenant-level authorization, log access, and offer export and permanent deletion. Ask the investor before sharing a contact or drafting an introduction. Never send personal network data to a model by default; if an investor opts in, disclose the use and minimize the fields sent. Apply a retention schedule and provide a clear consent revocation path.

## Hosting and next steps

The static demo can be deployed on a static host. A production version can use a managed web host, a scheduled ingestion worker, object storage for source documents, a relational store for normalized facts, and a private graph or relational tables for contacts. Keep secrets server-side. First replace seed data with a small, refreshable set of primary-source filings; then add evidence-grounded summaries, a secure account boundary, and consented network import.
