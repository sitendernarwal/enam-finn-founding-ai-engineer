# FINN AI implementation roadmap

## Product direction

Build FINN as a source-grounded research assistant. Keep the assignment frontends as static sites on GitHub Pages and run all model calls in a shared Vercel serverless API. Provider credentials stay on the server. The first AI feature belongs in **Research** and answers questions about the selected company using official NSE and BSE disclosures, with visible source links.

The current company figures, alerts, portfolio, and watchlist are prototype data. AI must not describe those sample values as current facts or use them to calculate real returns. Calculation logic stays deterministic and must use verified inputs before it can be presented as live analysis.

## Current status

- Ask FINN and the shared Vercel API are deployed; Gemini key setup is required to activate requests.
- Both static frontends point to `https://finn-ai-api.vercel.app/api/ask-company`.
- The backend uses Google's `gemini-3.5-flash-lite` model. It retrieves the selected ticker's recent official NSE disclosure records, then uses Gemini URL Context to read linked filing documents. Gemini's standard free tier covers model tokens; URL Context is listed as free. Google Search grounding is not used because it is not included in this model's free tier. Limits and terms can change.
- Keep the Google AI Studio project on its Free tier with no billing account linked. Add `GEMINI_API_KEY` only to Vercel's server-side environment; never add it to the static frontend or Git.
- The source lookup is limited to NSE's official corporate-announcements endpoint. Filing attachments and returned citation URLs are accepted only from official NSE domains; if no recent NSE records are returned, FINN says so instead of answering from model memory. The public website endpoint is not a licensed developer data feed and its behavior can change.
- Google may use free-tier content to improve its products. The app sends only the selected ticker/company and the user's question and warns users not to include personal or confidential details.
- The AI API is hosted on Vercel; GitHub Pages remains the frontend host.

## Delivery phases

### Phase 0 — Safe AI foundation

- Create one Vercel project from this repository, rooted at `ai-backend/`; this is a server deployment, not GitHub Pages hosting.
- Add a Node.js API endpoint that both assignment sites can call.
- Use a server-side Gemini API key from Google AI Studio; never expose it in a static frontend.
- Restrict browser origins, validate ticker/question inputs, bound response size, avoid storing prompts, and validate returned source links against NSE/BSE domains.
- Set a modest per-IP request throttle. Before broad public use, move throttling to a shared durable store or platform firewall because serverless memory is best-effort.

### Phase 1 — Ask FINN MVP (implemented in this change)

- Add an accessible, mobile-friendly Ask FINN panel to Research in both apps.
- Offer suggested filing questions and free-form questions for the currently selected company.
- Retrieve recent NSE corporate-announcement records for the selected ticker and use Gemini 3.5 Flash-Lite with URL Context to summarize official filing attachments. Do not use Search grounding or model memory as evidence.
- Show the answer, clickable source links, a clear no-source state, loading/error states, and a research-only disclaimer.
- Do not send portfolio holdings, watchlists, network profiles, or other personal state to the model.

### Phase 2 — Verify and evaluate

- Create a small reviewed set of questions covering results, filings, governance, business segments, and unsupported questions.
- Check that answers use the correct company, distinguish reporting periods, and cite every material claim.
- Check failure behavior for no filings, invalid tickers, provider errors, request limits, and mobile screen readers.
- Review model usage and per-query cost before enabling the feature for a larger audience.

### Phase 3 — Company-specific primary-source coverage

- Map covered companies to investor-relations domains and exchange identifiers.
- Prefer exact filing/document URLs and capture filing date, period, and document type.
- Add a source ingestion pipeline only if reliable retrieval from official disclosures needs it; then consider file search over a maintained, versioned document corpus.
- Add freshness labels and preserve the original document links next to extracted facts.

### Phase 4 — Evidence-based analysis and charts

- Import reported figures from cited filings, normalize units and periods, and retain a traceable source for each value.
- Keep all arithmetic in deterministic code; ask AI to explain the calculated result, not invent or recalculate inputs.
- Add charts only for sourced time series, with missing periods shown as missing rather than interpolated.
- Keep demo values visibly separate from reported data.

### Phase 5 — Personalized workflows

- Add a watchlist digest based only on explicitly selected tickers and opted-in disclosure events.
- Generate Daily Brief explanations from verified events; leave relevance ranking deterministic and inspectable.
- Add portfolio-aware commentary only after real holdings are intentionally connected, with explicit user consent and clear privacy controls.

### Phase 6 — Founding-assignment Network assistant

- Explain why a synthetic profile matches a user-selected research question using structured attributes already present in the prototype.
- Keep profile data out of external model calls by default. If a future version needs external AI, request explicit consent and minimize the data sent.
- Draft questions for the user to review; never contact a person automatically.

## Deployment and setup checklist

1. Create the Vercel project from the Founding assignment repository and set its Root Directory to `ai-backend`.
2. Create a Gemini API key in Google AI Studio and add it to Vercel as a Sensitive `GEMINI_API_KEY` for Production (and Preview if needed). Leave Google billing unlinked to stay on the free tier.
3. Deploy the backend and point each frontend's `ai-config.js` to its HTTPS `/api/ask-company` URL.
4. Deploy the frontends to GitHub Pages. GitHub Pages serves only static UI; Vercel serves the AI API.
5. Confirm the API accepts the two page origins, then exercise the evaluation checklist above.

## MVP acceptance criteria

- Both sites show the same Ask FINN experience in the Research view, including on phone-sized screens.
- Requests include only the selected ticker/name and the question; no stored portfolio or network records are sent.
- Gemini API authentication stays server-side and is never included in frontend assets.
- NSE disclosure records are retrieved from the official exchange endpoint; filing URLs and citations are validated against official NSE/BSE domains. If no official record is available, FINN must say it could not verify the answer.
- The UI distinguishes an unconfigured API, an unsupported/no-source answer, a provider error, and a sourced answer.
- No response is presented as a buy/sell recommendation, and sample figures remain labelled as illustrative.

## Current setup requirements

- Production secret: `GEMINI_API_KEY` configured in Vercel. For local development, use a local uncommitted environment file.
- Optional backend setting: `FINN_ALLOWED_ORIGINS` (comma-separated exact origins).
- Frontend setting: `window.FINN_AI_CONFIG.endpoint` in each `ai-config.js` (already set to the deployed Vercel API URL).
- Gemini 3.5 Flash-Lite model tokens and URL Context are listed as free on the standard Free tier. Google may use free-tier prompts to improve products; no personal or confidential details should be submitted.
