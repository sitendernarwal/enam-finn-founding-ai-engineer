# FINN — Founding AI Engineer

## AI-assisted project history

**Prepared:** 14 November 2026  
**Format:** Reconstructed, dialogue-style summary

> The prompts below are edited to reflect the project owner's direct, conversational style. They summarize the work; they are not copied or verbatim chat messages.

## Project conversation

### 1. Start with both assignments

**User:** I have two assignments. Tell me what I should do for each one.

**AI:** I reviewed them separately. The Founding AI Engineer assignment needs an investor brief, company research, and a private Network concept. The AI Engineer assignment focuses on the brief and company research. I kept each prototype in its own folder.

### 2. Choose the right approach

**User:** Which approach will be best for both?

**AI:** Build FINN as a mobile-first prototype with two connected flows: Push for the daily brief and Pull for company research. Add the Network flow only to the Founding AI Engineer version. Keep the first version static and label sample data clearly.

### 3. Build and check the assignment

**User:** Okay, build the two solutions separately. Then do a quality check and fix anything that needs improvement.

**AI:** I built the brief, filters, company search, research views, and source-discovery links. The mock portfolio contains 16 companies, with five additional research-only examples. I checked calculations, alert thresholds, missing data, labels, and the handoff from an alert to company research.

### 4. Make the analysis clearer

**User:** Are the calculations and analysis working properly? What else should be improved?

**AI:** I added transparent formulas and sample inputs, handled missing or zero values safely, and made movement alerts use numeric price and volume thresholds. I corrected a mismatch in the sample revenue commentary. Banks and lenders now show bank-appropriate metrics as missing instead of presenting EBITDA as a useful bank measure.

### 5. Refine the interface

**User:** Can you make the UI feel like macOS 26 Liquid Glass? Also, make the profile button work and show my name as Sitender.

**AI:** I strengthened the glass styling, kept the layouts responsive, and made the profile controls open a demo profile labeled Sitender.

### 6. Connect company research to the Network

**User:** When I look up a company, can I carry it into the Network and find relevant people?

**AI:** The research view carries the selected company into synthetic profile matching. A question can be saved as a private draft in the current browser session, and nothing is sent to a contact.

### 7. Fix the phone company-tap flow

**User:** If I tap a company on my phone, it should open the details or scroll me to that information.

**AI:** I updated company selection so tapping a company chip, alert, saved item, or research-queue action opens that company and scrolls its details into view. The selected company is also marked in the company list.

### 8. Decide what to do about live prices

**User:** Do I have to connect live prices for the assignment?

**AI:** The prototype can demonstrate its flows with clearly labeled sample data. The submission checklist marks live data ingestion as partial, so a live feed is needed only if the reviewer expects that checkpoint to be complete. This prototype does not claim that its prices or financial figures are live.

### 9. Prepare and publish the submission

**User:** I need to send two emails. Can you prepare one for each assignment?

**AI:** I drafted separate submission emails with each demo and repository link. I also created this curated history so a reviewer can follow the project decisions without treating it as a full conversation export.

**User:** Make both prototypes deployable.

**AI:** I published the static prototype to GitHub Pages. Both project Pages workflows completed successfully.

### 10. Polish the research screen for submission

**User:** The calculations section doesn't look right. Please fix it, and make the prototype polished enough to submit.

**AI:** I fixed the dark-theme contrast in the calculation panel and added a quarterly revenue chart that appears only when sample revenue inputs are available. I also made the market simulation, chart, and dashboard quotes stay in sync. The figures remain clearly labeled as illustrative.

### 11. Add portfolio and watchlist views

**User:** Now add a Portfolio option and a Watchlist option too.

**AI:** I added separate Portfolio and Watchlist screens to the navigation. Portfolio lists all 16 tracked demo companies, supports search, and opens each company's research. Companies can be added or removed from the Watchlist, which is saved in this browser on this device. The portfolio clearly says that position sizes and returns are not connected, and unsourced figures remain blank.

## Delivered prototype

- Push daily brief with sample event filters, relevance reasons, and editable demo thresholds
- Pull research for a 16-company mock portfolio and five research-only examples
- Source-discovery links and transparent illustrative calculations
- Company-specific context matching against synthetic Network profiles
- Private question drafts, saved research, and phone-friendly company-detail navigation
- macOS 26 Liquid Glass styling, a default dark theme with a light-mode toggle, and interactive Sitender profile
- Phone-friendly bottom navigation with safe-area spacing
- Simulated market pulse with a synchronized chart and clearly labeled dashboard quotes
- Quarterly revenue chart and higher-contrast calculation cards for companies with sample data
- A searchable Portfolio screen for 16 tracked companies, plus a Watchlist that saves on the current device

## Validation and deployment

- JavaScript syntax checks passed for app.js and analysis.js.
- HTML structure checks found no duplicate IDs or missing local scripts.
- GitHub Pages deployments completed successfully.
- A 390 px responsive browser preview confirmed the bottom navigation, theme toggle, simulated chart, and no horizontal overflow. The company-tap scroll fix is deployed; this browser preview is not a physical-device retest.
- Portfolio and Watchlist additions passed syntax, unique-ID, navigation-route, and local-script checks; a fresh phone visual review of these screens is pending.

**Live prototype:** https://sitendernarwal.github.io/enam-finn-founding-ai-engineer/  
**Public repository:** https://github.com/sitendernarwal/enam-finn-founding-ai-engineer

## Known limits

- Prices, financial values, alerts, and events are illustrative; no live market feed, filing ingestion, or fundamentals pipeline is connected.
- Network profiles are synthetic, private drafts remain in the browser session, and the Watchlist is saved locally on this device.
- The prototype does not call a language model or present AI-generated financial conclusions as verified facts.
- Source links lead to discovery pages rather than the specific documents behind sample claims.

## AI-use note

AI assistance supported product framing, UI and interaction implementation, code review, documentation, and deployment preparation. The project owner reviewed the output and provided product feedback. This file is a curated project history, not a full Codex export.
