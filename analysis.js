(() => {
  "use strict";

  const periods = ["Q4 FY26", "Q1 FY27", "Q2 FY27"];
  const nseFilingsUrl = "https://www.nseindia.com/companies-listing/corporate-filings-announcements";
  const isFounding = Boolean(document.getElementById("view-network"));
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[character]);
  const toNumber = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (value == null || String(value).trim() === "" || String(value).trim() === "—") return null;
    const cleaned = String(value).replace(/[−–]/g, "-").replace(/[^0-9.+-]/g, "");
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : null;
  };
  const formatAmount = (value) => value == null
    ? "—"
    : "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value) + " Cr";
  const formatPercent = (value) => value == null
    ? "Not calculated"
    : (value > 0 ? "+" : "") + value.toFixed(1) + "%";
  const percentChange = (previous, current) => {
    if (!Number.isFinite(previous) || !Number.isFinite(current) || previous === 0) return null;
    return ((current / previous) - 1) * 100;
  };
  const ratioPercent = (numerator, denominator) => {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return numerator / denominator * 100;
  };
  const hasValue = (values) => Array.isArray(values) && values.some(Number.isFinite);

  function buildFinancialModel(company) {
    const series = {};
    for (const row of Array.isArray(company.trends) ? company.trends : []) {
      if (Array.isArray(row) && row.length > 1) series[row[0]] = row.slice(1).map(toNumber);
    }
    const available = Object.values(series).some(hasValue) && company.dataAvailable !== false;
    return { currency: "INR", unit: "crore", periods, series, status: available ? "illustrative" : "missing", source: null };
  }
  for (const company of companies) company.financialModel = buildFinancialModel(company);
  const getCompany = (ticker) => companies.find((company) => company.ticker === ticker) || companies[0];
  const ensureModel = (company) => company.financialModel || (company.financialModel = buildFinancialModel(company));
  const allowedViews = new Set($$(".view").map((view) => view.id.replace("view-", "")));
  const defaultVolumeThreshold = 2;
  const defaultPriceThreshold = 3;
  const validStoredNumber = (key, allowed, fallback) => {
    try {
      const value = Number(sessionStorage.getItem(key));
      return allowed.includes(value) ? value : fallback;
    } catch { return fallback; }
  };
  volumeThreshold = validStoredNumber("finn-volume-threshold", [1.5, 2, 3], defaultVolumeThreshold);
  priceThreshold = validStoredNumber("finn-price-threshold", [1, 3, 5], defaultPriceThreshold);
  try {
    const saved = JSON.parse(sessionStorage.getItem("finn-followed") || "[]");
    followedCompanies.clear();
    if (Array.isArray(saved)) for (const ticker of saved) if (companies.some((company) => company.ticker === ticker)) followedCompanies.add(ticker);
  } catch { followedCompanies.clear(); }

  const eventAgeMinutes = { HDFCBANK: 18, RELIANCE: 50, TCS: 852, LT: 1004 };
  const impactWeight = { high: 30, med: 20, low: 10 };
  function alertRelevance(alert) {
    const company = companies.find((item) => item.ticker === alert.ticker);
    const portfolioMatch = Boolean(company && !company.isResearchOnly);
    const impact = impactWeight[alert.priority] || 10;
    const recency = Math.max(0, 20 * (1 - Math.min(eventAgeMinutes[alert.ticker] ?? 1440, 1440) / 1440));
    return Math.round((portfolioMatch ? 35 : 0) + impact + recency + (alert.network ? 15 : 0));
  }
  function alertReasons(alert) {
    const company = companies.find((item) => item.ticker === alert.ticker);
    const reasons = [];
    if (company && !company.isResearchOnly) reasons.push("Portfolio match");
    reasons.push(({ high: "High impact", med: "Medium impact", low: "Lower impact" })[alert.priority] || "Sample event");
    if (alert.network) reasons.push("Network match");
    const age = eventAgeMinutes[alert.ticker];
    if (age != null) reasons.push(age < 60 ? "Within the hour" : age < 720 ? "Today" : "Yesterday");
    return reasons;
  }
  function movementPasses(alert) {
    if (alert.type !== "movement") return true;
    const volumePass = Number.isFinite(alert.volumeMultiple) && alert.volumeMultiple >= volumeThreshold;
    const pricePass = Number.isFinite(alert.percentMove) && Math.abs(alert.percentMove) >= priceThreshold;
    return volumePass || pricePass;
  }
  function getRevenueSummary(company) {
    const values = ensureModel(company).series.Revenue || [];
    const change = percentChange(values[1], values[2]);
    if (change == null) return "Revenue change is not calculated because Q1 or Q2 sample values are missing.";
    const description = Math.abs(change) < 0.05 ? "Revenue is flat" : "Revenue " + (change > 0 ? "grew" : "fell") + " " + Math.abs(change).toFixed(1) + "%";
    return description + " quarter over quarter in the illustrative values.";
  }

  function renderFeed() {
    const allEligible = alerts.filter(movementPasses).map((alert) => ({ alert, score: alertRelevance(alert) }))
      .sort((first, second) => second.score - first.score);
    const counts = {
      all: allEligible.length,
      filing: allEligible.filter(({ alert }) => alert.type !== "movement").length,
      movement: allEligible.filter(({ alert }) => alert.type === "movement").length
    };
    $$(".filter").forEach((button) => {
      const count = $(".filter-count", button);
      if (count) count.textContent = counts[button.dataset.filter] ?? 0;
    });
    const feedCount = $("#feed-count");
    if (feedCount) feedCount.textContent = counts.all;
    const volumeLabel = $("#volume-threshold-label");
    if (volumeLabel) volumeLabel.textContent = volumeThreshold + "×";
    const priceLabel = $("#price-threshold-label");
    if (priceLabel) priceLabel.textContent = priceThreshold + "%";
    const sampleStatus = $("#sample-activity-status");
    const sampleCopy = $("#sample-activity-copy");
    const sampleMovement = alerts.find((alert) => alert.type === "movement");
    if (sampleStatus && sampleMovement) sampleStatus.textContent = movementPasses(sampleMovement) ? "1 sample event matches" : "No sample event matches";
    if (sampleCopy && sampleMovement) {
      sampleCopy.textContent = movementPasses(sampleMovement)
        ? "L&T sample: 2.4× volume and +1.1% price move. At least one demo threshold is met; live monitoring is not connected. Current limits: " + volumeThreshold + "× volume and ±" + priceThreshold + "% price."
        : "The L&T sample (2.4× volume, +1.1% price) is below both demo thresholds. Live monitoring is not connected. Current limits: " + volumeThreshold + "× volume and ±" + priceThreshold + "% price.";
    }
    const selectedAlerts = allEligible.filter(({ alert }) =>
      activeFilter === "all" ||
      (activeFilter === "filing" && alert.type !== "movement") ||
      (activeFilter === "movement" && alert.type === "movement")
    );
    const feed = $("#feed");
    if (!feed) return;
    feed.innerHTML = selectedAlerts.map(({ alert, score }, index) => {
      const company = companies.find((item) => item.ticker === alert.ticker);
      const short = company?.short || alert.ticker.slice(0, 6);
      const reasons = alertReasons(alert).map((reason) => '<span class="rank-reason">' + escapeHTML(reason) + "</span>").join("");
      const copy = alert.type === "results" && company ? getRevenueSummary(company) + " " + alert.copy : alert.copy;
      const sourceLink = '<a href="' + nseFilingsUrl + '" target="_blank" rel="noopener noreferrer">Find NSE announcements ↗</a>';
      return '<article class="feed-card" role="group" tabindex="0" aria-label="Alert for ' + escapeHTML(alert.ticker) + ": " + escapeHTML(alert.title) + ". Demo relevance score " + score + " of 100. Press Enter to open company research." + '" data-company="' + escapeHTML(alert.ticker) + '">' +
        '<div class="priority-bar ' + escapeHTML(alert.priority) + '"></div><div class="company-logo">' + escapeHTML(short) + '</div><div class="card-main">' +
        '<div class="card-meta"><span class="ticker">' + escapeHTML(alert.ticker) + '</span><span class="tag ' + (alert.type === "results" ? "results" : alert.type === "movement" ? "market" : "") + '">' + escapeHTML(alert.label) + '</span><span class="tag demo-event">SAMPLE</span>' +
        (alert.network ? '<span class="tag people">NETWORK MATCH</span>' : "") + '</div><h3 class="feed-title">' + escapeHTML(alert.title) + '</h3><p class="feed-copy">' + escapeHTML(copy) + '</p>' +
        '<div class="rank-reasons" aria-label="Why this alert is shown">' + reasons + '</div><div class="card-meta-bottom"><span>' + escapeHTML(alert.time) + '</span><span>·</span>' + sourceLink + '</div></div>' +
        '<div class="card-right">' + (alert.move ? '<span class="move up">' + escapeHTML(alert.move) + '</span>' : '<span class="card-arrow">↗</span>') +
        '<small>' + (alert.move ? "sample move" : "View research") + '</small><span class="relevance-score" title="Illustrative demo score, not an investment rating">DEMO ' + score + '</span></div></article>';
    }).join("") || '<p class="muted empty-state">No sample alerts match these filters. Try a lower threshold or another filter.</p>';

    $$(".feed-card", feed).forEach((card) => {
      const openResearch = () => { selected = card.dataset.company; renderResearch(); navigate("research"); };
      card.addEventListener("click", (event) => { if (!event.target.closest("a")) openResearch(); });
      card.addEventListener("keydown", (event) => {
        if ((event.key === "Enter" || event.key === " ") && !event.target.closest("a")) {
          event.preventDefault();
          openResearch();
        }
      });
    });
  }

  function analysisCard(title, value, formula, inputLine) {
    return '<article class="calculated-card"><span class="calculated-label">' + escapeHTML(title) + '</span><strong>' + escapeHTML(value) +
      '</strong><small>' + escapeHTML(formula) + '</small><span class="calculation-input">' + escapeHTML(inputLine) + "</span></article>";
  }
  function renderResearch() {
    const company = getCompany(selected);
    if (!company) return;
    selected = company.ticker;
    const ticker = escapeHTML(company.ticker);
    const name = escapeHTML(company.name);
    const sector = escapeHTML(company.sector);
    const model = ensureModel(company);
    const revenue = model.series.Revenue || [];
    const ebitda = model.series.EBITDA || [];
    const pat = model.series.PAT || [];
    const hasData = model.status === "illustrative";
    const isFinancialCompany = /bank|lender|financial services|finance/i.test(company.sector || "");
    const revenueGrowth = percentChange(revenue[1], revenue[2]);
    const ebitdaMargin = isFinancialCompany ? null : ratioPercent(ebitda[2], revenue[2]);
    const patMargin = isFinancialCompany ? null : ratioPercent(pat[2], revenue[2]);
    const sourceStatus = hasData
      ? "Illustrative sample figures · no primary document is attached · live refresh is not connected."
      : "No financial values are attached for this ticker. Calculations are withheld until sourced inputs are available.";
    const cards = [
      analysisCard("Revenue change · Q2 vs Q1", formatPercent(revenueGrowth), "(Q2 ÷ Q1 − 1) × 100",
        revenue[1] != null && revenue[2] != null ? formatAmount(revenue[1]) + " → " + formatAmount(revenue[2]) : "Requires Q1 and Q2 revenue"),
      isFinancialCompany
        ? analysisCard("Lender profitability", "Not calculated", "Use NIM / NII and asset-quality metrics", "These inputs are not present in this sample")
        : analysisCard("EBITDA margin · Q2", formatPercent(ebitdaMargin), "Q2 EBITDA ÷ Q2 revenue × 100",
          ebitda[2] != null && revenue[2] != null ? formatAmount(ebitda[2]) + " ÷ " + formatAmount(revenue[2]) : "Requires Q2 EBITDA and revenue"),
      isFinancialCompany
        ? analysisCard("Asset quality", "Not calculated", "Use GNPA / NNPA and credit cost", "These inputs are not present in this sample")
        : analysisCard("PAT margin · Q2", formatPercent(patMargin), "Q2 PAT ÷ Q2 revenue × 100",
          pat[2] != null && revenue[2] != null ? formatAmount(pat[2]) + " ÷ " + formatAmount(revenue[2]) : "Requires Q2 PAT and revenue")
    ];
    const rows = Object.entries(model.series)
      .filter(([metric, values]) => (!isFinancialCompany || metric !== "EBITDA") && values.some((value) => value != null))
      .map(([metric, values]) => '<tr><td>' + escapeHTML(metric) + '</td>' + periods.map((period, index) => '<td>' + formatAmount(values[index]) + "</td>").join("") + "</tr>")
      .join("");
    const tableRows = rows || '<tr><td colspan="4">No financial periods available</td></tr>';
    const sourceNames = Array.isArray(company.sources) ? company.sources.map(escapeHTML).join(" · ") : "Latest results, investor presentation, and annual report";
    const displayedPrice = company.price && company.price !== "—" ? "₹" + escapeHTML(company.price) : "—";
    const displayedChange = company.change && company.change !== "—" ? escapeHTML(company.change) + " today · sample" : "Source needed";
    const displayedCap = company.marketCap && company.marketCap !== "—" ? escapeHTML(company.marketCap) : "—";
    const displayedRevenue = formatAmount(revenue[2]);
    const displayedPat = formatAmount(pat[2]);
    const networkAction = isFounding
      ? '<button class="text-btn" data-open-network style="margin-top:15px">Find network context →</button>'
      : '<button class="text-btn" data-focus-search style="margin-top:15px">Search another company →</button>';
    const bankNote = isFinancialCompany
      ? '<p class="muted bank-metric-note">EBITDA is omitted for banks and lenders. NIM, NII, deposit growth, GNPA, NNPA, and credit cost are missing from this sample.</p>'
      : "";
    const body = $("#research-card");
    if (!body) return;
    body.innerHTML = '<div class="research-layout"><div class="panel research-main">' +
      '<div class="company-title"><div class="company-logo">' + escapeHTML(company.short || company.ticker.slice(0, 6)) + '</div><div><h2>' + name + '</h2><p>' + ticker + " · " + sector + ' · NSE / BSE · illustrative</p></div>' +
      '<button class="quiet-btn company-actions" id="follow-btn" aria-pressed="' + String(followedCompanies.has(company.ticker)) + '">' + (followedCompanies.has(company.ticker) ? "✓ Saved" : "＋ Save research") + '</button></div>' +
      '<div class="metric-grid"><div class="metric"><span>Share price</span><b>' + displayedPrice + '</b><small>' + displayedChange + '</small></div><div class="metric"><span>Market cap</span><b>' + displayedCap +
      '</b><small>' + (company.marketCap === "—" ? "Source needed" : "Illustrative only") + '</small></div><div class="metric"><span>Revenue · Q2 FY27</span><b>' + displayedRevenue +
      '</b><small>' + (revenue[2] == null ? "Source needed" : "Sample input") + '</small></div><div class="metric"><span>PAT · Q2 FY27</span><b>' + displayedPat +
      '</b><small>' + (pat[2] == null ? "Source needed" : "Sample input") + '</small></div></div>' +
      '<section class="calculation-section" aria-labelledby="calculation-heading"><div class="calculation-heading"><div><span class="eyebrow">TRANSPARENT CALCULATIONS</span><h3 id="calculation-heading">What the sample numbers imply</h3></div><span class="calculation-stamp">DEMO ONLY</span></div>' +
      '<div class="calculated-grid">' + cards.join("") + '</div><p class="source-status">' + escapeHTML(sourceStatus) + '</p></section>' +
      '<div class="research-section">' + (company.dataAvailable === false ? '<div class="analysis-note"><b>Source lookup only</b><br>No imported or verified financial data is available for this ticker. Values and calculations stay blank until sourced.</div>' : "") +
      '<h3>Business snapshot</h3><p>' + escapeHTML(company.description) + '</p></div><div class="research-section"><h3>Quarterly figures <span class="source-label">Illustrative · INR crore</span></h3>' +
      '<div class="table-scroll"><table class="trend"><thead><tr><th></th>' + periods.map((period) => "<th>" + period + "</th>").join("") + '</tr></thead><tbody>' + tableRows + "</tbody></table></div>" + bankNote + '</div>' +
      '<div class="research-section"><h3>Factors to investigate <span class="source-label">Illustrative prompts</span></h3><div class="bull-bear"><div class="case"><strong>Potential support</strong><p>' +
      escapeHTML(company.bull || "Review reported growth, cash conversion, and management commentary.") + '</p></div><div class="case bear"><strong>Potential risks</strong><p>' +
      escapeHTML(company.bear || "Check balance-sheet risks, execution, and changes in guidance.") + '</p></div></div><p class="muted">These prompts are static examples; they are not generated from current filings or a live model.</p></div>' +
      '<div class="research-section"><h3>Questions to check</h3><p>Compare management’s outlook with the next reported period. Check whether profit growth converts to operating cash flow and whether working capital or capex is changing.</p></div></div>' +
      '<aside class="panel research-side"><h3>Source discovery</h3><p class="source-status">Suggested document types only; no specific filing is attached to the sample figures.</p>' +
      '<div class="source-item"><b>Exchange announcements</b><small>Official exchange discovery page · search by ticker and filing date</small><a href="' + nseFilingsUrl + '" target="_blank" rel="noopener noreferrer">Open NSE filings index ↗</a></div>' +
      '<div class="source-item"><b>Company document search</b><small>Third-party discovery page · verify against issuer filing</small><a href="https://www.screener.in/company/' + encodeURIComponent(company.ticker) + '/" target="_blank" rel="noopener noreferrer">Open ' + ticker + ' company page ↗</a></div>' +
      '<div class="source-label suggested-documents">Look for: ' + sourceNames + '</div><div class="analysis-note"><b>How to read this</b><br>Facts, calculations, and interpretation are separated. Sample data is not live or verified and is not an investment recommendation.</div>' +
      networkAction + "</aside></div>";

    const followButton = $("#follow-btn");
    if (followButton) followButton.onclick = () => {
      if (followedCompanies.has(company.ticker)) {
        followedCompanies.delete(company.ticker);
        toast(company.name + " removed from saved research");
      } else {
        followedCompanies.add(company.ticker);
        toast(company.name + " saved for later");
      }
      try { sessionStorage.setItem("finn-followed", JSON.stringify([...followedCompanies])); } catch {}
      followButton.textContent = followedCompanies.has(company.ticker) ? "✓ Saved" : "＋ Save research";
      followButton.setAttribute("aria-pressed", String(followedCompanies.has(company.ticker)));
      updateSavedResearch();
    };
    $$("[data-open-network]", body).forEach((button) => { button.onclick = () => openNetworkContext(company.ticker); });
    $$("[data-focus-search]", body).forEach((button) => { button.onclick = () => $("#company-search")?.focus(); });
    try { sessionStorage.setItem("finn-last-research", company.ticker); } catch {}
    updateResearchQueue();
    updateSavedResearch();
  }

  function updateSavedResearch() {
    const slot = $("#saved-research");
    if (!slot) return;
    const saved = [...followedCompanies].map((ticker) => companies.find((company) => company.ticker === ticker)).filter(Boolean);
    if (!saved.length) {
      slot.hidden = true;
      slot.innerHTML = "";
      return;
    }
    slot.hidden = false;
    slot.innerHTML = '<div class="saved-research-heading"><span class="eyebrow">SAVED RESEARCH · THIS TAB</span><span>' + saved.length + '</span></div><div class="saved-research-list">' +
      saved.map((company) => '<button class="saved-company-chip" type="button" data-saved-company="' + escapeHTML(company.ticker) + '">' + escapeHTML(company.name) + ' <span>→</span></button>').join("") + "</div>";
    $$("[data-saved-company]", slot).forEach((button) => {
      button.onclick = () => { selected = button.dataset.savedCompany; renderResearch(); navigate("research"); };
    });
  }

  function updateResearchQueue() {
    if (isFounding) return;
    let ticker = selected;
    try { ticker = sessionStorage.getItem("finn-last-research") || selected; } catch {}
    const company = companies.find((item) => item.ticker === ticker) || getCompany(selected);
    const copy = $("#research-queue-copy");
    const button = $("[data-open-research]");
    if (copy) copy.textContent = company
      ? "Last viewed: " + company.name + ". Your choice is remembered in this browser tab; figures are illustrative and filings are not connected."
      : "Choose a company to start a sample research view.";
    if (button) button.textContent = company ? "Continue " + company.name + " research →" : "Start company research →";
    if (button) button.setAttribute("aria-label", company ? "Continue research on " + company.name : "Start company research");
    if (button) button.onclick = () => { selected = company?.ticker || "HDFCBANK"; renderResearch(); navigate("research"); };
  }

  const sectorTerms = {
    bank: ["banking", "credit", "risk", "treasury"],
    technology: ["technology", "it services", "saas", "enterprise"],
    retail: ["retail", "distribution", "consumer"],
    infrastructure: ["infrastructure", "capex", "project"],
    energy: ["energy", "refining", "power"]
  };
  let networkContextTicker = null;
  function topicsForCompany(company) {
    const text = (company?.sector || "") + " " + (company?.name || "");
    if (/bank|lender/i.test(text)) return sectorTerms.bank;
    if (/it services|technology|software/i.test(text)) return sectorTerms.technology;
    if (/retail|consumer|digital/i.test(text)) return sectorTerms.retail.concat(sectorTerms.energy);
    if (/infrastructure|engineering|construction/i.test(text)) return sectorTerms.infrastructure;
    if (/energy|refining|power/i.test(text)) return sectorTerms.energy;
    return (company?.sector || "").toLowerCase().split(/[\s·&,-]+/).filter((word) => word.length > 3);
  }
  function personMatchesCompany(person, company) {
    const profile = [person.role, person.company, person.expertise, person.link].join(" ").toLowerCase();
    return topicsForCompany(company).some((topic) => profile.includes(topic));
  }
  function renderNetworkHeader() {
    if (!isFounding) return;
    const company = networkContextTicker ? companies.find((item) => item.ticker === networkContextTicker) : null;
    const heading = $(".network-hero h2");
    const description = $(".network-hero p");
    const count = $(".network-toolbar p");
    if (company) {
      if (heading) heading.textContent = "Context for " + company.name;
      if (description) description.textContent = "Matching synthetic profiles by sector and stated expertise. Opening a profile only creates a private draft; nothing is sent.";
      if (count) count.textContent = people.filter((person) => personMatchesCompany(person, company)).length + " synthetic profile matches for " + company.name + " · no messages are sent";
    } else {
      if (heading) heading.textContent = "Useful context lives one connection away.";
      if (description) description.textContent = "Explore the people and experience that could help you understand a company, sector, or event.";
      if (count) count.textContent = "6 sample profiles · Synthetic demo data";
    }
  }
  function renderNetworkDraft() {
    if (!isFounding) return;
    let slot = $("#network-draft");
    if (!slot) {
      const grid = $("#people-grid");
      if (!grid) return;
      slot = document.createElement("section");
      slot.id = "network-draft";
      slot.className = "network-draft";
      slot.setAttribute("aria-live", "polite");
      grid.insertAdjacentElement("afterend", slot);
    }
    let draft = "";
    try { draft = sessionStorage.getItem("finn-network-draft") || ""; } catch {}
    if (!draft) { slot.hidden = true; slot.innerHTML = ""; return; }
    slot.hidden = false;
    slot.innerHTML = '<div><span class="eyebrow">PRIVATE DRAFT · NOT SENT</span><p>' + escapeHTML(draft) + '</p></div><button class="quiet-btn" data-clear-network-draft>Clear draft</button>';
    $("[data-clear-network-draft]", slot).onclick = () => {
      try { sessionStorage.removeItem("finn-network-draft"); } catch {}
      renderNetworkDraft();
      toast("Private draft cleared");
    };
  }
  function renderPeople(query) {
    if (!isFounding || !Array.isArray(people)) return;
    const search = $("#people-search");
    const normalizedQuery = String(query ?? search?.value ?? "").trim().toLowerCase();
    const company = networkContextTicker ? companies.find((item) => item.ticker === networkContextTicker) : null;
    const candidates = company ? people.filter((person) => personMatchesCompany(person, company)) : people;
    const filtered = candidates.filter((person) => [person.name, person.role, person.company, person.expertise].join(" ").toLowerCase().includes(normalizedQuery));
    const grid = $("#people-grid");
    if (!grid) return;
    if (!filtered.length) {
      grid.innerHTML = '<div class="network-empty"><p class="muted">' + (company ? "No synthetic profiles match this company and search." : "No matches. Try a sector or skill.") + '</p>' +
        (company ? '<button class="text-btn" data-clear-network-context>Clear company context</button>' : "") + "</div>";
    } else {
      grid.innerHTML = filtered.map((person) => {
        const reason = company ? "Expertise match · " + person.expertise : person.expertise;
        return '<article class="person-card"><div class="person-head"><div class="person-avatar ' + escapeHTML(person.color) + '">' + escapeHTML(person.initials) +
          '</div><div><b>' + escapeHTML(person.name) + '</b><small>' + escapeHTML(person.role) + '</small></div></div><div class="connection">' + escapeHTML(person.company) +
          '<br><span style="color:#98a29b">' + escapeHTML(person.link) + '</span></div><span class="expertise">' + escapeHTML(reason) +
          '</span><a class="person-link" href="#network" data-person="' + escapeHTML(person.name) + '">Review context and draft a question →</a></article>';
      }).join("");
    }
    $$("[data-person]", grid).forEach((link) => {
      link.onclick = (event) => {
        event.preventDefault();
        const person = people.find((item) => item.name === link.dataset.person);
        if (!person) return;
        const companyName = company?.name || "a company";
        const draft = "I’m reviewing " + companyName + ". What should I understand about " + person.expertise + "?";
        showModal("Private question draft",
          '<p>This synthetic profile is shown because its stated experience may match the selected company context.</p><p><b>Suggested draft</b><br>' + escapeHTML(draft) +
          '</p><p class="muted">Saving keeps this draft in this browser session. It does not contact anyone or send data.</p><button class="primary-btn" data-save-network-draft data-draft="' + escapeHTML(draft) + '">Save private draft</button>',
          "NETWORK · PRIVATE");
      };
    });
    $$("[data-clear-network-context]", grid).forEach((button) => {
      button.onclick = () => { networkContextTicker = null; renderNetworkHeader(); renderPeople(""); };
    });
    renderNetworkDraft();
  }
  function openNetworkContext(ticker) {
    if (!isFounding) return;
    networkContextTicker = ticker;
    const search = $("#people-search");
    if (search) search.value = "";
    renderNetworkHeader();
    renderPeople("");
    navigate("network", { preserveNetworkContext: true });
  }

  function updateThresholdModal() {
    const trigger = $("#threshold-link");
    if (!trigger) return;
    trigger.onclick = () => {
      showModal("Alert thresholds",
        '<p>These rules filter the illustrative movement alert. No live price or volume feed is connected.</p>' +
        '<label class="setting-row"><span>Volume vs. 20-day average</span><select id="volume-setting"><option value="1.5">1.5×</option><option value="2">2×</option><option value="3">3×</option></select></label>' +
        '<label class="setting-row"><span>Absolute price move</span><select id="price-setting"><option value="1">±1%</option><option value="3">±3%</option><option value="5">±5%</option></select></label>' +
        '<p class="analysis-note">Sample L&amp;T event: volume 2.4× and price move +1.1%. Either condition can include the event.</p>' +
        '<div class="threshold-actions"><button class="quiet-btn" id="reset-settings">Restore defaults</button><button class="primary-btn" id="save-settings">Save preferences</button></div>' +
        '<p class="muted">Preferences are stored in this browser tab session.</p>', "PUSH · DEMO PREFERENCES");
      $("#volume-setting").value = String(volumeThreshold);
      $("#price-setting").value = String(priceThreshold);
      $("#reset-settings").onclick = () => {
        $("#volume-setting").value = String(defaultVolumeThreshold);
        $("#price-setting").value = String(defaultPriceThreshold);
      };
      $("#save-settings").onclick = () => {
        volumeThreshold = Number($("#volume-setting").value);
        priceThreshold = Number($("#price-setting").value);
        try {
          sessionStorage.setItem("finn-volume-threshold", String(volumeThreshold));
          sessionStorage.setItem("finn-price-threshold", String(priceThreshold));
        } catch {}
        $("#modal-backdrop").classList.remove("open");
        renderFeed();
        toast("Demo alert thresholds saved");
      };
    };
  }

  let modalReturnFocus = null;
  let modalWasOpen = false;
  const backdrop = $("#modal-backdrop");
  const closeModal = () => { if (backdrop) backdrop.classList.remove("open"); };
  window.showModal = function showModal(title, body, eyebrow) {
    if (!backdrop) return;
    if (!backdrop.classList.contains("open")) modalReturnFocus = document.activeElement;
    $("#modal-title").textContent = title;
    $("#modal-eyebrow").textContent = eyebrow || "FINN · DEMO";
    $("#modal-body").innerHTML = body;
    backdrop.classList.add("open");
    $("#modal-close")?.focus();
  };
  if (backdrop) {
    new MutationObserver(() => {
      const isOpen = backdrop.classList.contains("open");
      if (modalWasOpen && !isOpen && modalReturnFocus?.isConnected) modalReturnFocus.focus();
      modalWasOpen = isOpen;
    }).observe(backdrop, { attributes: true, attributeFilter: ["class"] });
    $("#modal-close").onclick = closeModal;
    backdrop.onclick = (event) => { if (event.target === backdrop) closeModal(); };
    document.addEventListener("keydown", (event) => {
      if (!backdrop.classList.contains("open")) return;
      if (event.key === "Tab") {
        const focusable = $$('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', backdrop)
          .filter((element) => element.offsetParent !== null);
        if (!focusable.length) { event.preventDefault(); return; }
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    $("#modal-body").addEventListener("click", (event) => {
      const option = event.target.closest(".question-option");
      if (option && isFounding) {
        const prompt = option.dataset.q;
        const search = $("#people-search");
        if (prompt === "sector") {
          networkContextTicker = selected;
          if (search) search.value = "";
        } else {
          networkContextTicker = null;
          if (search) search.value = prompt === "management" ? "governance" : "risk";
        }
        closeModal();
        renderNetworkHeader();
        renderPeople(search?.value || "");
        navigate("network", { preserveNetworkContext: true });
        return;
      }
      const save = event.target.closest("[data-save-network-draft]");
      if (!save) return;
      try { sessionStorage.setItem("finn-network-draft", save.dataset.draft || ""); } catch {}
      closeModal();
      renderNetworkDraft();
      toast("Private draft saved in this browser session");
    });
  }

  function navigate(view, options = {}) {
    if (!allowedViews.has(view)) return;
    if (view === "network" && !options.preserveNetworkContext) networkContextTicker = null;
    $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    $$(".view").forEach((section) => section.classList.toggle("active", section.id === "view-" + view));
    const crumb = $("#crumb-current");
    if (crumb) crumb.textContent = ({ home: "Daily brief", research: "Research", network: "My network" })[view] || "Workspace";
    if (view === "research") renderResearch();
    if (view === "home") renderFeed();
    if (view === "network") { renderNetworkHeader(); renderPeople($("#people-search")?.value || ""); }
    if (options.history !== false) {
      const nextHash = "#" + view;
      if (location.hash !== nextHash) history.pushState({ view }, "", location.pathname + location.search + nextHash);
    }
    if (options.scroll !== false) {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    }
  }
  window.navigate = navigate;
  window.openNetworkContext = openNetworkContext;
  window.renderFeed = renderFeed;
  window.renderResearch = renderResearch;
  if (isFounding) window.renderPeople = renderPeople;
  if (isFounding) {
    $$("[data-open-network]").filter((button) => !button.closest("#research-card"))
      .forEach((button) => { button.onclick = () => openNetworkContext(selected); });
  }

  if (isFounding) {
    const questionButton = $("#network-question");
    if (questionButton) questionButton.onclick = () => {
      const company = networkContextTicker ? companies.find((item) => item.ticker === networkContextTicker) : null;
      const suggestion = company ? "Context: " + company.name + ". " : "";
      showModal("Draft a private question",
        "<p>" + escapeHTML(suggestion) + "Choose a prompt to filter synthetic profiles. Nothing is sent.</p>" +
        '<div class="question-option" data-q="sector">Find experience relevant to this sector <span>→</span></div>' +
        '<div class="question-option" data-q="management">What should I understand about a leadership change? <span>→</span></div>' +
        '<div class="question-option" data-q="risk">Who has relevant risk experience? <span>→</span></div>' +
        '<p class="muted">Selecting a prompt only filters the local synthetic profile list.</p>', "NETWORK · PRIVATE");
    };
  }
  const refresh = $("#refresh-btn");
  if (refresh) refresh.onclick = () => toast("Static sample data · live prices, filings, and volume are not connected.");
  updateThresholdModal();
  $$(".nav-item").forEach((button) => { button.onclick = () => navigate(button.dataset.view); });
  $$(".filter").forEach((button) => {
    button.onclick = () => {
      activeFilter = button.dataset.filter;
      $$(".filter").forEach((filter) => {
        filter.classList.toggle("active", filter === button);
        filter.setAttribute("aria-pressed", String(filter === button));
      });
      renderFeed();
    };
  });

  window.addEventListener("popstate", () => {
    const view = location.hash.slice(1);
    navigate(allowedViews.has(view) ? view : "home", { history: false });
  });
  window.addEventListener("hashchange", () => {
    const view = location.hash.slice(1);
    if (allowedViews.has(view)) navigate(view, { history: false });
  });
  let initialTicker = selected;
  try {
    const savedTicker = sessionStorage.getItem("finn-last-research");
    if (companies.some((company) => company.ticker === savedTicker)) initialTicker = savedTicker;
  } catch {}
  selected = initialTicker;
  const initialView = location.hash.slice(1);
  renderFeed();
  renderResearch();
  if (isFounding) {
    renderNetworkHeader();
    renderPeople("");
    renderNetworkDraft();
  }
  navigate(allowedViews.has(initialView) ? initialView : "home", { history: false, scroll: false });
})();
