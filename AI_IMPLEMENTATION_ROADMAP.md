# FINN AI implementation roadmap

## Product direction

Build FINN as a source-grounded research assistant. Keep the assignment frontends as static sites on GitHub Pages and run all model calls in a shared Vercel serverless API. The browser must never receive an OpenAI secret. The first AI feature belongs in **Research** and answers questions about the selected company using official NSE and BSE disclosures, with visible source links.

The current company figures, alerts, portfolio, and watchlist are prototype data. AI must not describe those sample values as current facts or use them to calculate real returns. Calculation logic stays deterministic and must use verified inputs before it can be presented as live analysis.

## Delivery phases

### Phase 0 — Safe AI foundation

- Create one Vercel project from this repository, rooted at `ai-backend/`; this is a server deployment, not GitHub Pages hosting.
- Add a Node.js API endpoint that both assignment sites can call.
- Keep `OPENAI_API_KEY` in Vercel's encrypted environment settings. Use a project service-account key for a deployed workload where available.
- Restrict browser origins, validate ticker/question inputs, bound response size, avoid storing prompts, and search only NSE/BSE domains for the MVP.
- Set a modest per-IP request throttle. Before broad public use, move throttling to a shared durable store or platform firewall because serverless memory is best-effort.

### Phase 1 — Ask FINN MVP (implemented in this change)

- Add an accessible, mobile-friendly Ask FINN panel to Research in both apps.
- Offer suggested filing questions and free-form questions for the currently selected company.
- Use the OpenAI Responses API with web search limited to official NSE/BSE domains.
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
2. Set `OPENAI_API_KEY` in Vercel Project Settings → Environment Variables (Production and Preview as needed). Do not paste it into chat, source files, or GitHub.
3. Deploy the backend and copy its HTTPS URL.
4. Put the resulting `/api/ask-company` URL in `ai-config.js` in each frontend repository.
5. Deploy the frontends to GitHub Pages. GitHub Pages serves only static UI; Vercel serves the AI API.
6. Confirm the API accepts the two page origins, then exercise the evaluation checklist above.

## MVP acceptance criteria

- Both sites show the same Ask FINN experience in the Research view, including on phone-sized screens.
- Requests include only the selected ticker/name and the question; no stored portfolio or network records are sent.
- The API key exists only in Vercel server settings.
- Web search is constrained to NSE/BSE; source links are HTTPS and validated before display.
- The UI distinguishes an unconfigured API, an unsupported/no-source answer, a provider error, and a sourced answer.
- No response is presented as a buy/sell recommendation, and sample figures remain labelled as illustrative.

## Current setup requirements

- Required secret: `OPENAI_API_KEY` (set by the project owner in Vercel, not committed here).
- Optional backend settings: `OPENAI_MODEL` (defaults to `gpt-6.1-sol`) and `FINN_ALLOWED_ORIGINS` (comma-separated exact origins).
- Frontend setting: `window.FINN_AI_CONFIG.endpoint` in each `ai-config.js` (filled with the deployed Vercel API URL).
- A valid OpenAI API project with API billing/usage enabled is required; a ChatGPT subscription alone is not an API key.
