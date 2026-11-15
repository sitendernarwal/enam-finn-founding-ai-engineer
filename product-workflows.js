/* Assignment-specific workflows: network intelligence for the founding app,
   portfolio-aware Signals for the AI Engineer app. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const appId = document.body.dataset.app === "ai-engineer" ? "ai-engineer" : "founding-ai-engineer";
  const isFounding = appId === "founding-ai-engineer";
  const network = [
    { id: "anaya", name: "Anaya Rao", initials: "AR", role: "Former corporate banking associate", employer: "Demo Capital · fictional", sector: "Banking", expertise: ["Credit underwriting", "Private banks"], companies: ["HDFCBANK", "ICICIBANK", "SBIN"], path: "First degree · former teammate", daysSince: 72, reconnect: "A results cycle is a natural reason to reconnect." },
    { id: "kabir", name: "Kabir Sen", initials: "KS", role: "Payments product operator", employer: "Demo Fintech · fictional", sector: "Financial technology", expertise: ["Payments", "Digital banking"], companies: ["HDFCBANK", "ICICIBANK"], path: "Second degree · introduced by Anaya", daysSince: 34, reconnect: "Could add operating context on digital banking." },
    { id: "meera", name: "Meera Iyer", initials: "MI", role: "Healthcare operations leader", employer: "Demo Health · fictional", sector: "Healthcare & pharma", expertise: ["Pharma distribution", "Hospitals"], companies: ["SUNPHARMA"], path: "First degree · former classmate", daysSince: 61, reconnect: "A sector update could make this a useful check-in." },
    { id: "rohan", name: "Rohan Das", initials: "RD", role: "Digital infrastructure strategist", employer: "Demo Networks · fictional", sector: "Telecom & digital infrastructure", expertise: ["Telecom", "Data centres"], companies: ["BHARTIARTL", "RELIANCE"], path: "First degree · former colleague", daysSince: 19, reconnect: "Knows the telecom and digital-infrastructure landscape." },
    { id: "tara", name: "Tara Khanna", initials: "TK", role: "Consumer and retail operator", employer: "Demo Brands · fictional", sector: "Consumer & retail", expertise: ["Retail economics", "Brand distribution"], companies: ["ITC", "TRENT", "TITAN"], path: "Second degree · connected through a former colleague", daysSince: 96, reconnect: "Recent retail results are a natural reason to reconnect." },
    { id: "neel", name: "Neel Kapoor", initials: "NK", role: "Enterprise technology delivery lead", employer: "Demo Systems · fictional", sector: "Technology services", expertise: ["IT services", "Large deals"], companies: ["INFY", "TCS"], path: "First degree · former teammate", daysSince: 43, reconnect: "Can help frame delivery and deal-cycle questions." },
    { id: "isha", name: "Isha Menon", initials: "IM", role: "Automotive supply-chain specialist", employer: "Demo Mobility · fictional", sector: "Automotive", expertise: ["Auto supply chains", "Dealer networks"], companies: ["MARUTI"], path: "Second degree · introduced by Neel", daysSince: 58, reconnect: "Could add perspective on demand and channel checks." },
    { id: "vikram", name: "Vikram Shah", initials: "VS", role: "Industrial projects and energy finance", employer: "Demo Infrastructure · fictional", sector: "Industrials & energy", expertise: ["Capex execution", "Power networks"], companies: ["LT", "ULTRACEMCO", "ONGC", "POWERGRID"], path: "First degree · former project partner", daysSince: 83, reconnect: "A capex or project announcement is a useful reason to reconnect." }
  ];
  const bySymbol = (symbol) => network.filter((person) => person.companies.includes(String(symbol || "").toUpperCase()));
  const number = (value) => value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
  const percent = (value) => value == null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  const prefsKey = `finn-push-prefs-${appId}`;
  const readPrefs = () => {
    try { return JSON.parse(localStorage.getItem(prefsKey) || "{}"); } catch { return {}; }
  };
  const prefs = readPrefs();
  let networkFilter = "all";
  let networkQuery = "";

  function renderNetworkInsights() {
    const region = $("#network-insights");
    if (!region) return;
    const overlaps = new Set(network.flatMap((person) => person.companies));
    const direct = network.filter((person) => person.path.startsWith("First degree")).length;
    const reconnect = network.filter((person) => person.daysSince >= 55).length;
    region.innerHTML = `<div class="network-insight"><span>Fictional profiles</span><b>${network.length}</b><small>Clearly labeled for this product demo</small></div><div class="network-insight"><span>Company links</span><b>${overlaps.size}</b><small>Overlaps with the selected NSE universe</small></div><div class="network-insight"><span>Direct paths</span><b>${direct} / ${network.length}</b><small>${reconnect} natural reconnect moments in the demo</small></div>`;
  }

  function personMarkup(person, compact = false) {
    const overlap = person.companies.slice(0, 3).map((symbol) => `<button class="person-company" type="button" data-network-company="${esc(symbol)}">${esc(symbol)}</button>`).join("");
    return `<article class="person-card" data-person-card data-person-companies="${esc(person.companies.join(" "))}" data-person-sector="${esc(person.sector.toLowerCase())}" data-person-expertise="${esc(person.expertise.join(" ").toLowerCase())}" data-person-reconnect="${person.daysSince >= 55}">
      <div class="person-head"><span class="person-avatar">${esc(person.initials)}</span><div><b>${esc(person.name)}</b><small>${esc(person.role)}</small></div><span class="person-flag">Synthetic</span></div>
      <p class="connection"><b>${esc(person.path)}</b><br>${esc(person.employer)}</p>
      <div class="person-overlap"><b>Company context</b><br>${esc(person.companies.join(" · "))}</div>
      <div class="person-expertise">${person.expertise.map((label) => `<span class="expertise">${esc(label)}</span>`).join("")}</div>
      ${compact ? `<p class="person-reconnect">${esc(person.reconnect)}</p>` : `<p class="person-reconnect">${esc(person.daysSince)} days since last conversation · synthetic scenario</p>`}
      <div class="person-links">${overlap}<button class="person-link" type="button" data-network-company="${esc(person.companies[0])}">Explore company context <span aria-hidden="true">↗</span></button></div>
    </article>`;
  }

  function renderNetwork() {
    const target = $("#network-people");
    if (!target) return;
    const query = networkQuery.trim().toLowerCase();
    const matches = network.filter((person) => {
      const text = [person.name, person.role, person.employer, person.sector, person.expertise.join(" "), person.companies.join(" "), person.path].join(" ").toLowerCase();
      const byFilter = networkFilter === "all"
        || networkFilter === "company" && person.companies.length > 0
        || networkFilter === "expertise" && person.expertise.length > 0
        || networkFilter === "reconnect" && person.daysSince >= 55;
      return byFilter && (!query || text.includes(query));
    });
    target.innerHTML = matches.length ? matches.map((person) => personMarkup(person)).join("") : `<div class="panel empty-state">No synthetic profiles match this search. Try a sector, company symbol, or expertise area.</div>`;
  }

  function renderNetworkContext(company) {
    if (!isFounding || !company?.symbol) return;
    const main = $(".research-main");
    main?.querySelector(".network-research-context")?.remove();
    const matches = bySymbol(company.symbol);
    if (!main || !matches.length) return;
    const section = document.createElement("section");
    section.className = "network-research-context";
    section.innerHTML = `<div class="network-context-top"><div><span class="eyebrow">NETWORK CONTEXT · SYNTHETIC</span><h3>People who could add context</h3><p>Illustrative matches only · all relationships and profiles are fictional.</p></div><button type="button" class="quiet-btn" data-network-company="${esc(company.symbol)}">Open network ↗</button></div><div class="network-context-people">${matches.slice(0, 2).map((person) => `<article class="network-context-person"><span class="person-avatar">${esc(person.initials)}</span><div><b>${esc(person.name)} <span class="person-flag">Synthetic</span></b><small>${esc(person.role)} · ${esc(person.path)}</small><p>${esc(person.reconnect)}</p></div></article>`).join("")}</div>`;
    const metrics = main.querySelector(".metric-grid");
    metrics?.insertAdjacentElement("afterend", section);
  }

  function categoryOf(item) {
    const text = `${item?.title || ""} ${item?.details || ""} ${item?.category || ""}`.toLowerCase();
    if (/result|quarterly|financial performance|earnings|audited financial|unaudited financial/.test(text)) return "Results";
    if (/merger|acquisition|acquire|amalgamat|scheme of arrangement|joint venture|strategic investment|business transfer|capex|capital expenditure/.test(text)) return "Strategic event";
    if (/resign|appointment|appointed|chief executive|chief financial|managing director|whole.time director|key managerial|management change|board of director/.test(text)) return "Leadership";
    if (/litigation|court|tribunal|penalt|show cause|regulatory|sebi|tax demand|legal notice|order received/.test(text)) return "Legal / regulatory";
    return null;
  }

  function filingDate(value) {
    if (!value) return null;
    const normalized = String(value).trim().replace(/(\d{1,2})[-/ ]([A-Za-z]{3})[-/ ](\d{4})/, "$2 $1, $3");
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function withinWindow(date, hours) {
    if (hours === "all") return true;
    if (!date) return false;
    const age = Date.now() - date.getTime();
    return age >= -3 * 60 * 60 * 1000 && age <= Number(hours) * 60 * 60 * 1000;
  }

  function safeNseUrl(value) {
    const fallback = "https://www.nseindia.com/companies-listing/corporate-filings-announcements";
    try {
      const url = new URL(value || fallback, "https://www.nseindia.com");
      return url.protocol === "https:" && /(^|\.)nseindia\.(in|com)$/.test(url.hostname) ? url.href : fallback;
    } catch { return fallback; }
  }

  function buildPortfolioAlerts(threshold, windowHours, selectedCategories = null) {
    const api = window.FINN_LIVE;
    const portfolio = api?.portfolio || [];
    const companies = api?.companies || new Map();
    const alerts = [];
    let loaded = 0;
    for (const entry of portfolio) {
      const company = companies.get(entry.symbol);
      if (!company) continue;
      if (company.updatedAt || company.error) loaded += 1;
      const quote = company.quoteData;
      const move = number(quote?.change);
      if (move != null && Math.abs(move) >= threshold) {
        const related = bySymbol(entry.symbol)[0];
        alerts.push({ priority: 1, kind: "move", symbol: entry.symbol, name: company.name || entry.name || entry.symbol, headline: "Price move crossed your threshold", detail: quote.isClose ? `NSE close-to-close move · ${company.historyAsOf || "latest available close"}` : "NSE-reported market move · intraday data may be delayed", value: percent(move), direction: move >= 0 ? "up" : "down", source: "https://www.nseindia.in/nse-mcp", network: related, sortDate: company.updatedAt ? new Date(company.updatedAt).getTime() : 0 });
      }
      for (const item of company.announcements?.items || []) {
        const category = categoryOf(item);
        if (!category) continue;
        if (selectedCategories && !selectedCategories.has(category)) continue;
        const date = filingDate(item.date);
        if (!withinWindow(date, windowHours)) continue;
        const summary = String(item.details || "").trim().replace(/\s+/g, " ").slice(0, 240);
        alerts.push({ priority: category === "Leadership" || category === "Strategic event" || category === "Legal / regulatory" ? 0 : 1, kind: "filing", category, symbol: entry.symbol, name: company.name || entry.name || entry.symbol, headline: String(item.title || "NSE filing"), detail: summary || "NSE returned filing metadata; open the primary filing for its contents.", date: item.date || "Date not provided by NSE", dateValue: date, source: safeNseUrl(item.source?.url), network: bySymbol(entry.symbol)[0], sortDate: date?.getTime() || 0 });
      }
    }
    alerts.sort((a, b) => b.priority - a.priority || b.sortDate - a.sortDate || (Math.abs(number(b.value) || 0) - Math.abs(number(a.value) || 0)));
    const unique = new Set();
    return { alerts: alerts.filter((item) => { const key = `${item.kind}:${item.symbol}:${item.headline}:${item.date || ""}`; if (unique.has(key)) return false; unique.add(key); return true; }), loaded, total: portfolio.length };
  }

  function alertMarkup(item) {
    const networkNote = item.network && isFounding ? `<span class="signal-network-note"><b>Synthetic network context:</b> ${esc(item.network.name)} · ${esc(item.network.expertise[0])} <button type="button" data-network-company="${esc(item.symbol)}">Explore ↗</button></span>` : "";
    return `<article class="signal-card"><span class="signal-icon" aria-hidden="true">${item.kind === "move" ? "↗" : "▤"}</span><div class="signal-main"><div class="signal-label-row"><span class="signal-category">${esc(item.kind === "move" ? "PRICE MOVE" : item.category.toUpperCase())}</span><span class="ticker">${esc(item.symbol)} · ${esc(item.name)}</span></div><b>${esc(item.headline)}</b><p>${esc(item.detail)}</p><small>${esc(item.date || "NSE market data · latest available")} · ${esc(item.kind === "move" ? "NSE MCP" : "NSE filing")}</small>${networkNote}<a class="signal-source" href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">Open primary NSE source ↗</a></div><div class="signal-value ${esc(item.direction || "")}">${esc(item.value || "")}</div>${item.kind === "filing" ? `<button type="button" class="signal-card-action" data-open-company="${esc(item.symbol)}">Research</button>` : ""}</article>`;
  }

  function renderSignals() {
    const input = $("#signal-threshold");
    const threshold = number(input?.value);
    const windowHours = $("#digest-window")?.value || "24";
    const selectedCategories = new Set($$(".signal-category-list input:checked").map((item) => ({ results: "Results", strategic: "Strategic event", leadership: "Leadership", regulatory: "Legal / regulatory" }[item.value])).filter(Boolean));
    const target = $("#portfolio-signals");
    const summary = $("#signals-summary");
    if (!target) return;
    if (threshold == null || threshold < 0.1 || threshold > 20) {
      target.innerHTML = '<div class="panel empty-state">Choose a threshold between 0.1% and 20% to screen the actual NSE quote changes.</div>';
      return;
    }
    const result = buildPortfolioAlerts(threshold, windowHours, selectedCategories);
    const moves = result.alerts.filter((item) => item.kind === "move").length;
    const filings = result.alerts.length - moves;
    const count = $("#portfolio-signal-count");
    const explainer = $("#signals-explainer");
    if (count) count.textContent = String(result.alerts.length);
    if (explainer) explainer.textContent = `${result.loaded} of ${result.total} selected companies have a response · actual exchange values only`;
    const updated = $("#signals-updated");
    if (updated) updated.textContent = result.loaded ? `Data returned for ${result.loaded} of ${result.total} companies` : "Waiting for portfolio data";
    if (summary) summary.innerHTML = `<div class="signal-stat"><span>Companies checked</span><b>${result.loaded} / ${result.total}</b></div><div class="signal-stat"><span>Move alerts</span><b>${moves}</b></div><div class="signal-stat"><span>Material filings</span><b>${filings}</b></div>`;
    if (result.alerts.length) target.innerHTML = result.alerts.map(alertMarkup).join("");
    else if (result.loaded < result.total) target.innerHTML = `<div class="panel empty-state">Loading actual NSE quotes and filing metadata for your selected companies. ${result.loaded} of ${result.total} have responded so far; the list will update as data arrives.</div>`;
    else if (windowHours !== "all" && !selectedCategories.size) target.innerHTML = '<div class="panel empty-state">Select at least one filing category, or use “All returned filings”.</div>';
    else target.innerHTML = `<div class="panel empty-state">No actual NSE quote changes crossed ±${threshold.toFixed(1)}%, and no selected filing types matched this window. Nothing is fabricated to fill the digest.</div>`;
  }

  function renderFoundingPush() {
    const target = $("#founding-push-list");
    if (!target) return;
    const threshold = number($("#push-threshold")?.value);
    const windowHours = $("#push-window")?.value || "24";
    if (threshold == null || threshold < .1 || threshold > 20) {
      target.innerHTML = '<div class="empty-state">Set a price-move threshold between 0.1% and 20%.</div>';
      return;
    }
    const result = buildPortfolioAlerts(threshold, windowHours);
    const summary = $("#push-summary");
    if (summary) summary.innerHTML = `<span><b>${result.loaded}/${result.total}</b> companies checked</span><span><b>${result.alerts.length}</b> material signals</span><span><b>${result.alerts.filter((item) => item.network).length}</b> synthetic network matches</span>`;
    if (result.alerts.length) target.innerHTML = result.alerts.map(alertMarkup).join("");
    else if (result.loaded < result.total) target.innerHTML = `<div class="empty-state">Loading actual NSE quotes and filing metadata for the selected universe. ${result.loaded} of ${result.total} have responded so far.</div>`;
    else target.innerHTML = `<div class="empty-state">No actual NSE quote change crossed ±${threshold.toFixed(1)}%, and no material filing matched this window. FINN does not invent alerts when the source has none.</div>`;
  }

  function savePrefs() {
    const value = { threshold: $("#signal-threshold")?.value, window: $("#digest-window")?.value, categories: $$(".signal-category-list input:checked").map((input) => input.value), foundingThreshold: $("#push-threshold")?.value, foundingWindow: $("#push-window")?.value };
    try { localStorage.setItem(prefsKey, JSON.stringify({ ...prefs, ...value })); } catch {}
  }

  function bind() {
    if (isFounding) {
      const threshold = $("#push-threshold");
      const windowSelect = $("#push-window");
      if (threshold && prefs.foundingThreshold) threshold.value = prefs.foundingThreshold;
      if (windowSelect && prefs.foundingWindow) windowSelect.value = prefs.foundingWindow;
      threshold?.addEventListener("input", () => { savePrefs(); renderFoundingPush(); });
      windowSelect?.addEventListener("change", () => { savePrefs(); renderFoundingPush(); });
      $("#refresh-push")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        try { await window.FINN_LIVE?.loadPortfolio(true); await window.FINN_LIVE?.refresh(); }
        finally { button.disabled = false; button.removeAttribute("aria-busy"); renderFoundingPush(); }
      });
      $("[data-network-focus]")?.addEventListener("click", () => $("#network-directory")?.scrollIntoView({ behavior: "smooth", block: "start" }));
      $("#network-search")?.addEventListener("input", (event) => { networkQuery = event.currentTarget.value; renderNetwork(); });
      $$('[data-network-filter]').forEach((button) => button.addEventListener("click", () => {
        networkFilter = button.dataset.networkFilter;
        $$('[data-network-filter]').forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
        renderNetwork();
      }));
      document.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        const trigger = target?.closest("[data-network-company]");
        if (!trigger) return;
        const symbol = trigger.dataset.networkCompany;
        if (!symbol) return;
        event.preventDefault();
        window.navigate?.("network");
        const search = $("#network-search");
        if (search) { search.value = symbol; networkQuery = symbol; renderNetwork(); }
        $("#network-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      window.addEventListener("finn:company-selected", (event) => renderNetworkContext(event.detail));
      renderNetworkInsights();
      renderNetwork();
      renderFoundingPush();
      window.FINN_LIVE?.loadPortfolio();
    } else {
      const threshold = $("#signal-threshold");
      const digest = $("#digest-window");
      const savedCategories = Array.isArray(prefs.categories) ? new Set(prefs.categories) : null;
      if (threshold && Number.isFinite(Number(prefs.threshold))) threshold.value = prefs.threshold;
      if (digest && ["24", "168", "all"].includes(prefs.window)) digest.value = prefs.window;
      if (savedCategories) $$(".signal-category-list input").forEach((input) => { input.checked = savedCategories.has(input.value); });
      threshold?.addEventListener("input", () => { savePrefs(); renderSignals(); });
      digest?.addEventListener("change", () => { savePrefs(); renderSignals(); });
      $$(".signal-category-list input").forEach((input) => input.addEventListener("change", () => { savePrefs(); renderSignals(); }));
      $("#refresh-signals")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        try { await window.FINN_LIVE?.loadPortfolio(true); await window.FINN_LIVE?.refresh(); }
        finally { button.disabled = false; button.removeAttribute("aria-busy"); renderSignals(); }
      });
      window.addEventListener("finn:signals-view-opened", () => { renderSignals(); window.FINN_LIVE?.loadPortfolio(); });
      window.addEventListener("finn:company-updated", renderSignals);
      if ($("#view-signals")?.classList.contains("active")) window.FINN_LIVE?.loadPortfolio();
      renderSignals();
    }
    window.addEventListener("finn:company-updated", () => { if (isFounding) renderFoundingPush(); });
    window.addEventListener("finn:movers-updated", () => { if (isFounding) renderFoundingPush(); });
  }

  bind();
})();
