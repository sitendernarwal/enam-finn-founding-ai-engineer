# FINN AI implementation roadmap

## Product direction

Build FINN as a source-grounded research assistant. Keep the assignment frontends as static sites on GitHub Pages and run all model calls in a shared Vercel serverless API. Provider credentials stay on the server. The first AI feature belongs in **Research** and answers questions about the selected company using official NSE and BSE disclosures, with visible source links.

The current company figures, alerts, portfolio, and watchlist are prototype data. AI must not describe those sample values as current facts or use them to calculate real returns. Calculation logic stays deterministic and must use verified inputs before it can be presented as live analysis.

## Current status

- Ask FINN and the shared Vercel API are deployed.
- Both static frontends point to `https://finn-ai-api.vercel.app/api/ask-company`.
- OpenAI's API returned `credit_balance_exhausted`, so the backend now uses Vercel AI Gateway's free-eligible `nvidia/nemotron-3.5-lightning-free` model and Parallel Search restricted to NSE/BSE. Search charges use the included $5 monthly AI Gateway allowance; the app does not select paid models, buy credits, or enable auto-reload.
- Vercel requires a valid payment method on the account to activate the included allowance. Requests stop when the free balance is unavailable or exhausted.
- The free NVIDIA endpoint may log prompts and responses for service improvement. The app sends only the selected ticker/company and the user's question, and warns users not to include personal or confidential details.
- The AI API is hosted on Vercel; GitHub Pages remains the frontend host.

## Delivery phases

### Phase 0 — Safe AI foundation

- Create one Vercel project from this repository, rooted at `ai-backend/`; this is a server deployment, not GitHub Pages hosting.
- Add a Node.js API endpoint that both assignment sites can call.
- Use Vercel's deployment OIDC token to authenticate the Vercel function to AI Gateway. A separate Gateway API key is only needed for local development outside a linked Vercel project.
- Restrict browser origins, validate ticker/question inputs, bound response size, avoid storing prompts, and search only NSE/BSE domains for the MVP.
- Set a modest per-IP request throttle. Before broad public use, move throttling to a shared durable store or platform firewall because serverless memory is best-effort.

### Phase 1 — Ask FINN MVP (implemented in this change)

- Add an accessible, mobile-friendly Ask FINN panel to Research in both apps.
- Offer suggested filing questions and free-form questions for the currently selected company.
- Use Vercel AI Gateway's free-eligible text model and server-side Parallel Search with results limited to official NSE/BSE domains.
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
2. Keep auto-reload disabled and do not purchase AI Gateway credits. Vercel's deployment OIDC token authenticates production requests; the included monthly free allowance covers search while available.
3. Deploy the backend and point each frontend's `ai-config.js` to its HTTPS `/api/ask-company` URL.
4. Deploy the frontends to GitHub Pages. GitHub Pages serves only static UI; Vercel serves the AI API.
5. Confirm the API accepts the two page origins, then exercise the evaluation checklist above.

## MVP acceptance criteria

- Both sites show the same Ask FINN experience in the Research view, including on phone-sized screens.
- Requests include only the selected ticker/name and the question; no stored portfolio or network records are sent.
- Gateway authentication stays server-side and is never included in frontend assets.
- Web search is constrained to NSE/BSE; source links are HTTPS and validated before display.
- The UI distinguishes an unconfigured API, an unsupported/no-source answer, a provider error, and a sourced answer.
- No response is presented as a buy/sell recommendation, and sample figures remain labelled as illustrative.

## Current setup requirements

- Production auth: Vercel OIDC token, provided to the deployed function. Optional local-only auth: `AI_GATEWAY_API_KEY`.
- Optional backend setting: `FINN_ALLOWED_ORIGINS` (comma-separated exact origins).
- Frontend setting: `window.FINN_AI_CONFIG.endpoint` in each `ai-config.js` (already set to the deployed Vercel API URL).
- The free AI Gateway allowance requires a valid payment method on the Vercel account. Do not add paid credits or enable auto-reload for this prototype. Model token pricing is $0; search costs $5 per 1,000 calls and is covered only while the included allowance remains.
