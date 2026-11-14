# FINN — Founding AI Engineer

## AI-assisted project history

**Prepared:** 14 November 2026  
**Format:** Curated, reconstructed dialogue summary

> This is an edited account of the project decisions and work. It is not a verbatim transcript of the Codex conversation and does not reproduce exact prompts.

## Project conversation

### 1. Defining the assignment

**Project owner — What should the prototype help an investor do?**  
Describe a clear daily workflow that connects a short list of important events to deeper company research, with useful network context where appropriate.

**AI — Recommended product shape**  
Build FINN around three connected flows: **Push** for a concise daily brief, **Pull** for company research, and **Network** for private, permission-aware context. Keep each step easy to follow on a phone.

### 2. Choosing a build approach

**Project owner — How should the assignment be delivered?**  
Create a working, reviewable prototype in the assignment folder and make it straightforward to publish.

**AI — Implementation choice**  
Use static HTML, CSS, and JavaScript for the prototype. This keeps the demo simple to run and inspect. Clearly label sample prices, financial figures, events, and profiles so the interface does not imply a live data service.

### 3. Building the core investor journey

**Project owner — What should the daily brief lead into?**  
Selecting an event should take the investor to the relevant company, and company search should support both the mock portfolio and outside examples.

**AI — Interaction design**  
Connect alert cards to the matching research view; add portfolio and research-only company search; make alert filters and threshold preferences functional. Carry the selected company into the Network view so its context is not lost.

### 4. Making analysis easier to check

**Project owner — Are the calculations and sample claims internally consistent?**  
Review the calculations, thresholds, labels, and company-specific metrics.

**AI — Quality improvements**  
Show formulas and their sample inputs, handle missing or zero values safely, and keep illustrative calculations separate from verified facts. Use bank-appropriate prompts instead of EBITDA for banks and lenders. Make movement alerts respond to numeric price and volume thresholds, and remove copy that conflicted with the sample revenue series.

### 5. Refining the phone experience

**Project owner — How should the interface feel and behave on a phone?**  
Apply a stronger macOS 26 Liquid Glass treatment, make the Sitender profile control interactive, and ensure a company tap reveals its information.

**AI — UI and flow changes**  
Strengthen the glass surfaces while keeping mobile layouts responsive. Make research saving visible, keep the last research view easy to resume, and scroll the selected company detail into view after a company chip, alert, saved item, or research-queue action is tapped.

### 6. Handling the Network privately

**Project owner — What should happen when someone looks for a connection?**  
Show relevant context without sending a message or exposing real contact data.

**AI — Network behavior**  
Match only the prototype’s synthetic profiles against the selected company’s sector and expertise. Let the investor save and clear a private question draft in the current browser session. No message is sent.

### 7. Reviewing and publishing

**Project owner — What remains honest and useful for a reviewer?**  
Check the complete journey, disclose data limits, and make the live demo available.

**AI — Review summary**  
Run JavaScript syntax checks and structural checks for duplicate HTML IDs and missing script files. Publish the static prototype to GitHub Pages and confirm the Pages workflow succeeds. The project owner reported checking the phone layout; a later screen recording exposed the company-detail scroll gap, which was then fixed and redeployed.

## Delivered prototype

- Daily brief with sample event filters, relevance reasons, and editable demo thresholds
- Research for a 16-company mock portfolio and five research-only examples
- Source-discovery links and transparent illustrative calculations
- Company-specific context matching against synthetic Network profiles
- Private draft creation, saved research, and phone-friendly company-detail navigation
- macOS 26 Liquid Glass visual treatment and interactive Sitender profile

## Validation and deployment

- JavaScript syntax checks passed for app.js and analysis.js.
- HTML structure checks found no duplicate IDs or missing local scripts.
- GitHub Pages deployments completed successfully.
- The owner reported completing a phone check. The latest company-selection scroll fix was verified through code checks and successful Pages deployment; no independent on-device retest is recorded here.

**Live prototype:** https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/  
**Public repository:** https://github.com/sitendernarwal/enam-finn-founding-ai-engineer

## Known limits

- Prices, financial values, alerts, and events are illustrative; no live market feed, filing ingestion, or fundamentals pipeline is connected.
- Network profiles are synthetic, and draft/saved state is local to the browser session.
- The prototype does not call a language model or present AI-generated financial conclusions as verified facts.
- The source links are discovery pages rather than links to the specific documents behind sample claims.

## AI-use note

AI assistance was used for product framing, UI and interaction implementation, code review, documentation, and deployment preparation. The project owner reviewed the output and provided product feedback. This file is a curated project record; use a separate Codex export or share link if a reviewer requires the complete conversation.
