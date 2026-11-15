(() => {
  "use strict";

  let serviceStatePromise;
  const panelMarkup = `
    <section class="panel finn-ai-panel" id="finn-ai-assistant" aria-labelledby="finn-ai-heading">
      <div class="finn-ai-heading">
        <div>
          <span class="eyebrow">AI · OFFICIAL DISCLOSURES</span>
          <h3 id="finn-ai-heading">Ask FINN</h3>
          <p class="finn-ai-intro">FINN uses NSE announcements and can read a relevant filing when the document is available.</p>
        </div>
        <span class="finn-ai-badge" id="finn-ai-badge">Checking service</span>
      </div>
      <div class="finn-ai-suggestions" aria-label="Suggested research questions">
        <button type="button" data-finn-question="What does the NSE metadata show for the latest results-related filing? Separate its filing date from the reporting period, and say if the period or figures are not provided.">Results metadata</button>
        <button type="button" data-finn-question="What recent official disclosures could materially affect this company? Include dates and sources.">Recent disclosures</button>
        <button type="button" data-finn-question="What does the latest relevant investor presentation or earnings filing say about the company's outlook? Cite the source.">Management outlook</button>
      </div>
      <form class="finn-ai-form" data-finn-form>
        <label class="sr-only" for="finn-ai-question">Ask a question about this company</label>
        <textarea id="finn-ai-question" name="question" rows="3" minlength="8" maxlength="800" required placeholder="Ask about results, filings, risks, or outlook…"></textarea>
        <div class="finn-ai-form-foot"><span>Free-tier Gemini prompts may improve Google products. Avoid personal or confidential details.</span><button class="primary-btn" type="submit">Ask FINN <span aria-hidden="true">↗</span></button></div>
      </form>
      <p class="finn-ai-status" id="finn-ai-status" role="status" aria-live="polite"></p>
      <div class="finn-ai-answer" id="finn-ai-answer" hidden>
        <h4>Research summary</h4>
        <p class="finn-ai-answer-text" data-finn-answer></p>
        <div class="finn-ai-sources" data-finn-sources></div>
        <p class="finn-ai-disclaimer">Research assistance only, not investment advice. Verify the original filing before relying on a claim.</p>
      </div>
    </section>`;

  function ensurePanel() {
    const card = document.querySelector("#research-card");
    const layout = card?.querySelector(".research-layout");
    if (!layout || layout.querySelector("#finn-ai-assistant")) return;
    layout.insertAdjacentHTML("beforeend", panelMarkup);
    updateServiceStatus();
  }

  function updateServiceStatus() {
    const endpoint = window.FINN_AI_CONFIG?.endpoint;
    const badge = document.querySelector("#finn-ai-badge");
    const status = document.querySelector("#finn-ai-status");
    if (!endpoint) {
      if (badge) badge.textContent = "Setup required";
      if (status) status.textContent = "The AI service will be available after the shared Vercel API is deployed and connected.";
      return;
    }
    if (badge) badge.textContent = "Checking service";
    if (status) status.textContent = "Checking that the AI service is configured…";
    if (!serviceStatePromise) {
      serviceStatePromise = fetch(endpoint, { method: "GET" })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error("service_unavailable");
          return Boolean(payload.configured);
        })
        .catch(() => null);
    }
    serviceStatePromise.then((configured) => {
      const currentBadge = document.querySelector("#finn-ai-badge");
      const currentStatus = document.querySelector("#finn-ai-status");
      if (!currentBadge || !currentStatus || document.querySelector("[data-finn-form] button[type='submit']")?.disabled) return;
      if (configured === true) {
        currentBadge.textContent = "Gemini connected";
        currentStatus.textContent = "Connected to Gemini 3.5 Flash-Lite. Ask about NSE disclosures, financial results, or management outlook.";
      } else if (configured === false) {
        currentBadge.textContent = "Service setup required";
        currentStatus.textContent = "Gemini API key is not configured. Add GEMINI_API_KEY to the Vercel project and redeploy the API.";
      } else {
        currentBadge.textContent = "Service unavailable";
        currentStatus.textContent = "Could not check the AI API. Confirm its Vercel deployment is available.";
      }
    });
  }

  function selectedCompany() {
    const card = document.querySelector("#research-card");
    const title = card?.querySelector(".company-title h2")?.textContent?.trim() || "";
    const subtitle = card?.querySelector(".company-title p")?.textContent || "";
    const ticker = (subtitle.split("·")[0] || "").trim().toUpperCase().replace(/\s+/g, "");
    return { companyName: title.slice(0, 100), ticker };
  }

  function safeOfficialUrl(value) {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      const official = ["nseindia.com", "nsearchives.nseindia.com", "nseindia.in", "nsearchives.nseindia.in", "bseindia.com"]
        .some((domain) => host === domain || host.endsWith("." + domain));
      return url.protocol === "https:" && official ? url.href : null;
    } catch {
      return null;
    }
  }

  function plainAnswer(value, ticker) {
    const escapedTicker = String(ticker || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return String(value || "")
      .replace(/\[([^\]]+)\]\(https?:\/\/[^)\s]+\)/g, "$1")
      .replace(new RegExp(`\\b${escapedTicker}\\s+Filing Link\\b`, "gi"), "the linked NSE filing")
      .replace(/\b(?:the |a |your )?company filing link\b/gi, "the linked NSE filing")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      .replace(/_([^_\n]+)_/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "• ")
      .trim();
  }

  document.addEventListener("click", (event) => {
    const suggestion = event.target.closest("[data-finn-question]");
    if (!suggestion) return;
    const input = document.querySelector("#finn-ai-question");
    if (!input) return;
    input.value = suggestion.dataset.finnQuestion || "";
    input.focus();
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-finn-form]");
    if (!form) return;
    event.preventDefault();

    const input = form.querySelector("textarea[name='question']");
    const status = document.querySelector("#finn-ai-status");
    const answerBox = document.querySelector("#finn-ai-answer");
    const answerText = document.querySelector("[data-finn-answer]");
    const sourcesBox = document.querySelector("[data-finn-sources]");
    const submit = form.querySelector("button[type='submit']");
    const endpoint = window.FINN_AI_CONFIG?.endpoint;
    const question = input?.value?.trim() || "";

    if (!endpoint) {
      if (status) status.textContent = "AI is not connected yet. Deploy the shared Vercel API and add its endpoint to ai-config.js.";
      return;
    }
    const company = selectedCompany();
    if (!company.ticker) {
      if (status) status.textContent = "Select a company before asking a research question.";
      return;
    }

    if (answerBox) answerBox.hidden = true;
    if (sourcesBox) sourcesBox.replaceChildren();
    if (status) status.textContent = `Searching official disclosures for ${company.ticker}…`;
    if (submit) {
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      submit.firstChild.textContent = "Searching… ";
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...company, question })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "FINN could not complete this request.");

      if (answerText) answerText.textContent = plainAnswer(payload.answer, company.ticker) || "No answer was returned.";
      const sources = Array.isArray(payload.sources) ? payload.sources : [];
      const links = sources.map((source) => {
        const href = safeOfficialUrl(source.url);
        if (!href) return null;
        const link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const reference = Number.isInteger(source.record) ? `[${source.record}] ` : "";
        link.textContent = reference + String(source.title || new URL(href).hostname).slice(0, 190);
        return link;
      }).filter(Boolean);
      if (sourcesBox) {
        if (links.length) {
          const heading = document.createElement("strong");
          heading.textContent = "Official sources";
          sourcesBox.append(heading, ...links);
        } else {
          const note = document.createElement("span");
          note.textContent = "No official source links were returned. Treat this answer as unverified.";
          sourcesBox.append(note);
        }
      }
      if (answerBox) answerBox.hidden = false;
      if (status) status.textContent = payload.evidence === "filing_pdf"
        ? "Based on an official filing PDF. Open the cited pages to verify the details."
        : "Based on NSE announcement metadata. Open the official filing for the full document.";
    } catch (error) {
      if (status) status.textContent = error?.name === "TypeError"
        ? "Could not reach FINN AI. Check that the Vercel API is deployed and connected."
        : (error?.message || "FINN could not complete this request. Please try again.");
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
        submit.firstChild.textContent = "Ask FINN ";
      }
    }
  });

  const researchCard = document.querySelector("#research-card");
  if (researchCard) {
    new MutationObserver(ensurePanel).observe(researchCard, { childList: true, subtree: true });
    ensurePanel();
  }
})();
