(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const endpoint = window.FINN_AI_CONFIG?.marketEndpoint || "https://finn-ai-api.vercel.app/api/market-data";
  const appId = document.body.dataset.app === "ai-engineer" ? "ai-engineer" : "founding-ai-engineer";
  const storage = { portfolio: `finn-live-portfolio-${appId}`, watchlist: `finn-live-watchlist-${appId}` };
  const DEMO_PORTFOLIO = [
    ["RELIANCE", "Reliance Industries"], ["HDFCBANK", "HDFC Bank"], ["ICICIBANK", "ICICI Bank"], ["SBIN", "State Bank of India"],
    ["INFY", "Infosys"], ["TCS", "Tata Consultancy Services"], ["LT", "Larsen & Toubro"], ["ITC", "ITC"],
    ["BHARTIARTL", "Bharti Airtel"], ["SUNPHARMA", "Sun Pharmaceutical Industries"], ["MARUTI", "Maruti Suzuki India"], ["TITAN", "Titan Company"],
    ["POWERGRID", "Power Grid Corporation of India"], ["ONGC", "Oil & Natural Gas Corporation"], ["ULTRACEMCO", "UltraTech Cement"], ["TRENT", "Trent"]
  ].map(([symbol, name]) => ({ symbol, name }));
  const state = {
    view: "home", overview: null, movers: [], moverFilter: "all", moverMode: "live", moverDate: "", search: [], selected: null,
    companies: new Map(), portfolio: readPortfolio(storage.portfolio), watchlist: read(storage.watchlist), searchTimer: 0, searchSequence: 0
  };
  let overviewLoading = false;
  let lastOverviewSuccessAt = 0;
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const titleCase = (value) => String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const normKey = (key) => String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
  const formatNumber = (value, digits = 2) => Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value)) : "Unavailable";
  const formatPercent = (value) => value != null && value !== "" && Number.isFinite(Number(value)) ? `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(2)}%` : "—";
  const asRows = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      for (const key of ["data", "records", "stocks", "quotes", "results", "items", "announcements", "history", "candles", "prices", "indices", "equities"]) {
        if (Array.isArray(value[key])) return value[key];
      }
    }
    return [];
  };
  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value.filter((item) => item && /^[A-Z0-9&.-]{1,24}$/.test(String(item.symbol || ""))) : [];
    } catch { return []; }
  }
  function readPortfolio(key) {
    let saved = null;
    let seeded = false;
    try { saved = JSON.parse(localStorage.getItem(key) || "null"); } catch {}
    const seededKey = `${key}-demo-universe-v1`;
    try { seeded = localStorage.getItem(seededKey) === "1"; } catch {}
    if ((!Array.isArray(saved) || saved.length === 0) && !seeded) {
      write(key, DEMO_PORTFOLIO);
      try { localStorage.setItem(seededKey, "1"); } catch {}
      return DEMO_PORTFOLIO.map((entry) => ({ ...entry }));
    }
    return Array.isArray(saved) ? saved.filter((item) => item && /^[A-Z0-9&.-]{1,24}$/.test(String(item.symbol || ""))) : [];
  }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  async function request(params) {
    const url = new URL(endpoint);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 22_000);
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The official NSE feed could not be reached.");
      return payload;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("The NSE data request took too long. Please refresh to try again.");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }
  function toast(message) {
    const node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => node.classList.remove("show"), 2400);
  }
  function navigate(view, options = {}) {
    if (!document.querySelector(`.nav-item[data-view="${view}"]`) || !document.getElementById(`view-${view}`)) return;
    state.view = view;
    $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    $$(".view").forEach((section) => section.classList.toggle("active", section.id === `view-${view}`));
    const labels = { home: "Market", research: "Research", portfolio: "Portfolio", watchlist: "Watchlist", network: "Network", signals: "Signals" };
    if ($("#crumb-current")) $("#crumb-current").textContent = labels[view];
    if (!options.fromHash && location.hash !== `#${view}`) history.replaceState(null, "", `#${view}`);
    if (view === "portfolio") renderPortfolio();
    if (view === "watchlist") renderWatchlist();
    if (view === "signals") window.dispatchEvent(new CustomEvent("finn:signals-view-opened"));
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  window.navigate = navigate;
  window.FINN_LIVE = {
    get selected() { return state.selected; },
    get movers() { return state.movers; },
    get moverMode() { return state.moverMode; },
    get moverDate() { return state.moverDate; },
    get portfolio() { return state.portfolio; },
    get companies() { return state.companies; },
    openCompany: (symbol) => ensureCompany(symbol, symbol, true),
    refresh: loadOverview,
    loadPortfolio: (force = false) => {
      let cursor = 0;
      const worker = async () => {
        while (cursor < state.portfolio.length) {
          const entry = state.portfolio[cursor++];
          if (force) {
            const current = state.companies.get(entry.symbol);
            if (current) current.loadedAt = 0;
          }
          await ensureCompany(entry.symbol, entry.name, false);
        }
      };
      return Promise.all(Array.from({ length: Math.min(3, state.portfolio.length) }, worker));
    }
  };

  function objectsDeep(value, depth = 0, output = []) {
    if (depth > 6 || value == null) return output;
    if (Array.isArray(value)) {
      value.forEach((item) => { if (item && typeof item === "object") objectsDeep(item, depth + 1, output); });
      return output;
    }
    if (typeof value === "object") {
      output.push(value);
      Object.values(value).forEach((item) => { if (item && typeof item === "object") objectsDeep(item, depth + 1, output); });
    }
    return output;
  }
  function field(record, aliases) {
    const wanted = new Set(aliases.map(normKey));
    for (const object of objectsDeep(record)) {
      for (const [key, value] of Object.entries(object)) {
        if (wanted.has(normKey(key)) && value != null && String(value).trim() !== "") return value;
      }
    }
    return null;
  }
  function numeric(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return null;
    const cleaned = value.replace(/,/g, "").replace(/[₹%\s]/g, "").replace(/[−–]/g, "-");
    const match = cleaned.match(/[+-]?\d+(?:\.\d+)?/);
    if (!match) return null;
    const result = Number(match[0]);
    return Number.isFinite(result) ? result : null;
  }
  function symbolOf(row) { return String(field(row, ["symbol", "ticker", "stockSymbol", "securityCode", "symbolName"]) || "").trim().toUpperCase(); }
  function nameOf(row) { return String(field(row, ["companyName", "company", "securityName", "name", "company_name"]) || symbolOf(row)).trim(); }
  function quoteOf(row) {
    const price = numeric(field(row, ["lastPrice", "lastTradedPrice", "ltp", "closePrice", "currentPrice", "last", "close", "price", "value"]));
    const change = numeric(field(row, ["pChange", "pctChange", "percentChange", "changePercent", "percentageChange", "dayChangePercent"]));
    const absoluteChange = numeric(field(row, ["change", "netChange", "changeValue"]));
    return { price, change: change ?? null, absoluteChange, raw: row };
  }
  function sourceLink(value, fallback = "https://www.nseindia.in/companies-listing/corporate-filings-announcements") {
    try {
      const url = new URL(value || fallback, "https://www.nseindia.in");
      if (url.protocol === "https:" && /(^|\.)nseindia\.(in|com)$/.test(url.hostname)) return url.href;
    } catch {}
    return fallback;
  }
  function listAnnouncements(company) {
    const announcements = company?.announcements?.items || [];
    const region = $("#announcement-list");
    if (!region) return;
    if (!announcements.length) {
      region.innerHTML = '<div class="analysis-note">No recent NSE announcement was returned for this symbol. <a href="https://www.nseindia.in/companies-listing/corporate-filings-announcements" target="_blank" rel="noopener noreferrer">Search official filings ↗</a></div>';
      return;
    }
    region.innerHTML = announcements.map((item) => `<article class="source-item"><b>${esc(item.title || "NSE disclosure")}</b><small>${esc(item.date || "Date not provided by NSE")}</small>${item.details ? `<p>${esc(item.details)}</p>` : ""}<a href="${esc(sourceLink(item.source?.url))}" target="_blank" rel="noopener noreferrer">Open official filing ↗</a></article>`).join("");
  }
  function marketStamp(value) {
    const raw = value ? new Date(value) : new Date();
    if (Number.isNaN(raw.getTime())) return "Latest available data · India time";
    return `Updated ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(raw)} IST`;
  }
  function rowsFrom(value) {
    const rows = asRows(value);
    return rows.length ? rows : objectsDeep(value).filter((item) => symbolOf(item));
  }
  function indexRows(value) {
    return rowsFrom(value).map((row) => ({
      name: String(field(row, ["indexName", "index", "name", "symbol"]) || "").toUpperCase(),
      price: numeric(field(row, ["last", "lastPrice", "lastValue", "currentValue", "close", "value"])),
      change: numeric(field(row, ["percentChange", "pChange", "pctChange", "changePercent", "percentageChange"])),
      date: String(field(row, ["date", "tradeDate", "tradingDate"]) || ""),
      raw: row
    })).filter((item) => item.name);
  }
  function renderIndices(payload) {
    const indices = indexRows(payload?.indices);
    const strip = $("#market-strip");
    for (const label of ["NIFTY 50", "NIFTY BANK"]) {
      const target = $(`[data-index="${label}"]`, strip);
      if (!target) continue;
      const history = numberList(label === "NIFTY 50" ? payload?.history : payload?.bankHistory);
      const lastClose = history.at(-1);
      const historicalIndex = lastClose ? {
        name: label,
        price: numeric(field(lastClose, ["close", "last", "value"])),
        change: numeric(field(lastClose, ["pctChange", "percentChange", "pChange"])),
        date: String(field(lastClose, ["date", "tradeDate", "tradingDate"]) || ""), eod: true
      } : null;
      const found = indices.find((item) => item.name.includes(label)) || historicalIndex;
      const priceNode = $("b", target);
      let changeNode = $(".market-move", target);
      if (!changeNode) {
        changeNode = document.createElement("span");
        changeNode.className = "market-move";
        target.append(changeNode);
      }
      if (!found || found.price == null) {
        priceNode.textContent = "Unavailable";
        changeNode.textContent = "—";
        changeNode.classList.remove("up", "down");
        continue;
      }
      priceNode.textContent = formatNumber(found.price);
      changeNode.textContent = formatPercent(found.change);
      changeNode.classList.toggle("up", found.change == null || found.change >= 0);
      changeNode.classList.toggle("down", found.change != null && found.change < 0);
      const note = $(".market-note", target);
      if (note) note.textContent = found.eod && found.date ? `Latest close · ${found.date}` : "NSE market data";
    }
    const counts = $$("#watchlist-market-count, #portfolio-mini-count");
    counts.forEach((node) => { node.textContent = node.id === "watchlist-market-count" ? `${state.watchlist.length} companies` : String(state.portfolio.length); });
    const stamp = $("#market-asof");
    const liveAvailable = indices.some((item) => item.price != null);
    const latestDate = String(field(numberList(payload?.history).at(-1), ["date", "tradeDate", "tradingDate"]) || payload?.eodMovers?.date || "");
    if (stamp) stamp.textContent = !liveAvailable && latestDate ? `Latest NSE session · ${latestDate} · end of day` : `${marketStamp(payload?.asOf)} · NSE may delay 1–3 min`;
    renderIndexChart(indices.find((item) => item.name.includes("NIFTY 50")));
  }
  function renderIndexChart(index) {
    const card = $("#market-chart");
    if (!card) return;
    const history = normalizedHistory(state.overview?.history);
    const series = history.length >= 2 ? svgChart(history, "NIFTY 50") : "";
    card.innerHTML = `<div class="chart-heading"><div><span class="eyebrow">MARKET SNAPSHOT · END OF DAY</span><h2>NIFTY 50</h2></div><span class="source-label">${series ? `${history.length} ACTUAL DAILY CLOSES` : index?.price == null ? "LIVE SERIES UNAVAILABLE" : "LATEST INDEX VALUE"}</span></div>${series || `<div class="chart-unavailable">${index?.price == null ? "Historical index values are unavailable right now. No synthetic chart is shown." : `<strong>${formatNumber(index.price)}</strong><span>${formatPercent(index.change)} · latest value reported by NSE</span>`}</div>`}<div class="chart-foot">Intraday delay: 1–3 minutes · historical values are end-of-day · <a href="https://www.nseindia.in/nse-mcp" target="_blank" rel="noopener noreferrer">NSE source ↗</a></div>`;
  }
  function normalizeMovers(payload) {
    const collect = (source, mode) => {
      const gainers = rowsFrom(source?.gainers).map((raw) => ({ raw, direction: "up" }));
      const losers = rowsFrom(source?.losers).map((raw) => ({ raw, direction: "down" }));
      const unique = new Map();
      for (const item of [...gainers, ...losers]) {
        const symbol = symbolOf(item.raw);
        const quote = quoteOf(item.raw);
        if (!symbol) continue;
        unique.set(symbol, { symbol, name: nameOf(item.raw), quote, direction: quote.change == null ? item.direction : quote.change >= 0 ? "up" : "down", raw: item.raw, mode });
      }
      return [...unique.values()];
    }
    const live = collect(payload, "live");
    if (live.length) {
      state.moverMode = "live";
      state.moverDate = "";
      return live;
    }
    const endOfDay = collect(payload?.eodMovers, "eod");
    state.moverMode = endOfDay.length ? "eod" : "live";
    state.moverDate = String(payload?.eodMovers?.date || "");
    return endOfDay;
  }
  function renderMovers() {
    const items = state.movers.filter((item) => state.moverFilter === "all" || (state.moverFilter === "gainers" ? item.direction === "up" : item.direction === "down"));
    const list = $("#feed");
    const count = $("#mover-count");
    const heading = $(".section-head h2");
    const subtitle = $(".section-head p");
    if (heading?.firstChild) heading.firstChild.textContent = state.moverMode === "eod" ? "Latest NSE session movers " : "Live market movers ";
    if (subtitle) subtitle.textContent = state.moverMode === "eod" ? `Official end-of-day gainers and losers · ${state.moverDate || "latest trading session"}` : "Official NSE gainers and losers · delayed during market hours";
    if (count) count.textContent = String(items.length);
    if (!items.length) {
      list.innerHTML = `<div class="panel empty-state">${state.overview ? "No verified NSE market movers were returned for the latest trading session. No sample prices are substituted." : "NSE market data is temporarily unavailable. Please refresh in a moment."}</div>`;
      window.dispatchEvent(new CustomEvent("finn:movers-updated", { detail: { items: state.movers, mode: state.moverMode, date: state.moverDate } }));
      return;
    }
    list.innerHTML = items.map((item) => `<button type="button" class="feed-card live-mover" data-symbol="${esc(item.symbol)}" aria-label="Open ${esc(item.name)} research"><span class="priority-bar ${item.direction === "up" ? "low" : "high"}"></span><span class="company-logo">${esc(item.symbol.slice(0, 5))}</span><span class="card-main"><span class="card-meta"><span class="ticker">${esc(item.symbol)}</span><span class="tag ${item.direction === "up" ? "results" : "market"}">${item.direction === "up" ? "Gainer" : "Loser"}</span></span><span class="feed-title">${esc(item.name)}</span><span class="feed-copy">${item.mode === "eod" ? `Official NSE end-of-day data for ${esc(state.moverDate || "the latest trading session")}.` : "Official NSE market-mover data."} Tap to open company research.</span></span><span class="card-right"><span class="move ${item.direction}">${formatPercent(item.quote.change)}</span><small>${item.quote.price == null ? "Price unavailable" : `₹${formatNumber(item.quote.price)}`}</small></span></button>`).join("");
    window.dispatchEvent(new CustomEvent("finn:movers-updated", { detail: { items: state.movers, mode: state.moverMode, date: state.moverDate } }));
  }
  async function loadOverview() {
    if (overviewLoading) return;
    overviewLoading = true;
    const refresh = $("#refresh-btn");
    if (refresh) { refresh.disabled = true; refresh.setAttribute("aria-busy", "true"); }
    try {
      const payload = await request({ view: "overview" });
      state.overview = payload;
      state.movers = normalizeMovers(payload);
      lastOverviewSuccessAt = Date.now();
      $("#market-strip")?.classList.remove("is-stale");
      $("#feed")?.removeAttribute("aria-label");
      renderIndices(payload);
      renderMovers();
    } catch (error) {
      if (state.overview) {
        $("#market-strip")?.classList.add("is-stale");
        const stamp = $("#market-asof");
        if (stamp) stamp.textContent = "Showing the last successful NSE update · refresh failed";
        const list = $("#feed");
        if (list && error?.message) list.setAttribute("aria-label", `Refresh failed. Showing the last successful NSE data. ${error.message}`);
      } else {
        const stamp = $("#market-asof");
        if (stamp) stamp.textContent = "NSE feed temporarily unavailable";
        renderIndices(null);
        renderMovers();
        const list = $("#feed");
        if (list && error?.message) list.setAttribute("aria-label", error.message);
      }
    } finally {
      overviewLoading = false;
      if (refresh) { refresh.disabled = false; refresh.removeAttribute("aria-busy"); }
    }
  }
  function persistLists() {
    write(storage.portfolio, state.portfolio);
    write(storage.watchlist, state.watchlist);
    const count = state.watchlist.length;
    const badge = $("#watchlist-nav-count");
    if (badge) { badge.textContent = String(count); badge.hidden = !count; }
    const watchCount = $("#watchlist-market-count");
    if (watchCount) watchCount.textContent = `${count} companies`;
    const tracked = $("#portfolio-mini-count");
    if (tracked) tracked.textContent = String(state.portfolio.length);
  }
  function companyCard(entry, mode) {
    const company = state.companies.get(entry.symbol) || entry;
    const quote = company.quoteData || { price: null, change: null };
    const priceLabel = quote.isClose ? `Latest close${company.historyAsOf ? ` · ${company.historyAsOf}` : ""}` : "Live price · NSE";
    const freshnessLabel = quote.isClose ? `End of day · ${company.historyAsOf || "date not provided"}` : company.updatedAt ? marketStamp(company.updatedAt) : "Price loads when available";
    const isTracked = state.portfolio.some((item) => item.symbol === entry.symbol);
    const isWatched = state.watchlist.some((item) => item.symbol === entry.symbol);
    const remove = mode === "watchlist" ? `<button class="watch-action" data-watch-action="remove" data-symbol="${esc(entry.symbol)}">Remove</button>` : "";
    return `<article class="portfolio-card panel"><div class="portfolio-card-head"><div class="portfolio-company-id"><span class="company-logo">${esc(company.short || entry.symbol.slice(0, 5))}</span><div><h3>${esc(company.name || entry.name || entry.symbol)}</h3><p>${esc(entry.symbol)} · ${esc(company.sector || "NSE listed equity")}</p></div></div>${remove}</div><div class="portfolio-card-metrics"><div><span>${esc(priceLabel)}</span><b>${quote.price == null ? "Unavailable" : `₹${formatNumber(quote.price)}`}</b></div><div><span>${quote.isClose ? "Change from previous close" : "Day change"}</span><b class="${quote.change != null && quote.change < 0 ? "down" : "up"}">${formatPercent(quote.change)}</b></div></div><div class="portfolio-card-footer"><span class="data-status">${esc(freshnessLabel)}</span><span class="card-actions"><button class="text-btn" data-card-action="${isTracked ? "untrack" : "track"}" data-symbol="${esc(entry.symbol)}">${isTracked ? "Remove from portfolio" : "Add to portfolio"}</button><button class="text-btn" data-card-action="${isWatched ? "unwatch" : "watch"}" data-symbol="${esc(entry.symbol)}">${isWatched ? "Remove watch" : "☆ Watch"}</button><button class="text-btn" data-open-company="${esc(entry.symbol)}">Research →</button></span></div></article>`;
  }
  function emptyList(title, copy, actionLabel = "Find a company") {
    return `<div class="portfolio-empty panel"><span class="empty-star" aria-hidden="true">☆</span><b>${esc(title)}</b><p>${esc(copy)}</p><button class="primary-btn" type="button" data-go-view="research">${esc(actionLabel)} <span>→</span></button></div>`;
  }
  function renderPortfolio() {
    const query = String($("#portfolio-search")?.value || "").trim().toLowerCase();
    const entries = state.portfolio.filter((item) => `${item.name} ${item.symbol}`.toLowerCase().includes(query));
    const summary = $("#portfolio-summary");
    if (summary) summary.innerHTML = `<div class="portfolio-stat"><span>Demo universe</span><b>${state.portfolio.length}</b><small>Listed companies · this device</small></div><div class="portfolio-stat"><span>Market data</span><b>NSE</b><small>Actual exchange quote when available</small></div><div class="portfolio-stat"><span>Watchlist</span><b>${state.watchlist.length}</b><small>Saved on this device</small></div>`;
    const list = $("#portfolio-list");
    if (list) list.innerHTML = entries.length ? entries.map((entry) => companyCard(entry, "portfolio")).join("") : emptyList(query ? "No tracked company matches" : "Your demo universe is empty", query ? "Try a different name or symbol." : "Search for NSE-listed companies to build a coverage universe. This list never represents positions or investment returns.");
    if (state.view === "portfolio") entries.forEach((entry) => ensureCompany(entry.symbol, entry.name, false));
    persistLists();
  }
  function renderWatchlist() {
    const summary = $("#watchlist-summary");
    if (summary) summary.innerHTML = `<div class="watchlist-summary-card"><span>Saved companies</span><b>${state.watchlist.length}</b><small>This device only</small></div>`;
    const list = $("#watchlist-list");
    if (list) list.innerHTML = state.watchlist.length ? state.watchlist.map((entry) => companyCard(entry, "watchlist")).join("") : emptyList("Your watchlist is empty", "Follow a company from its research page to keep it here.");
    state.watchlist.forEach((entry) => ensureCompany(entry.symbol, entry.name, false));
    persistLists();
  }
  function toggleList(type, symbol, name) {
    const collection = type === "watchlist" ? state.watchlist : state.portfolio;
    const index = collection.findIndex((item) => item.symbol === symbol);
    if (index >= 0) collection.splice(index, 1);
    else collection.push({ symbol, name: name || state.companies.get(symbol)?.name || symbol });
    persistLists();
    renderPortfolio();
    renderWatchlist();
    if (state.selected?.symbol === symbol) renderResearch();
  }
  function renderChips() {
    const region = $("#company-chips");
    if (!region) return;
    if (!state.search.length) { region.replaceChildren(); return; }
    region.innerHTML = state.search.map((item) => `<button class="company-chip ${state.selected?.symbol === item.symbol ? "active" : ""}" type="button" data-symbol="${esc(item.symbol)}"><b>${esc(item.name)}</b><small>${esc(item.symbol)}</small></button>`).join("");
  }
  async function searchCompanies(query) {
    const region = $("#company-chips");
    const trimmed = query.trim();
    const sequence = ++state.searchSequence;
    const isCurrentSearch = () => sequence === state.searchSequence && ($("#company-search")?.value.trim() ?? trimmed) === trimmed;
    if (trimmed.length < 2) { state.search = []; renderChips(); return; }
    if (region) region.innerHTML = '<span class="search-status">Searching official NSE listings…</span>';
    try {
      const parseItems = (payload) => (Array.isArray(payload.items) ? payload.items : []).filter((item) => item.symbol).map((item) => ({ symbol: String(item.symbol).toUpperCase(), name: item.name || item.symbol, sector: item.sector || "NSE listed equity" }));
      let items = parseItems(await request({ view: "search", q: trimmed }));
      if (!isCurrentSearch()) return;
      if (!items.length && /\s/.test(trimmed)) {
        const compact = trimmed.toUpperCase().replace(/[^A-Z0-9&.-]/g, "");
        if (/^[A-Z0-9&.-]{2,24}$/.test(compact)) items = parseItems(await request({ view: "search", q: compact }));
      }
      if (!isCurrentSearch()) return;
      state.search = items;
      state.search.forEach((item) => state.companies.set(item.symbol, { ...state.companies.get(item.symbol), ...item, short: item.symbol.slice(0, 5) }));
      const directSymbol = trimmed.toUpperCase().replace(/\.NS$/, "").replace(/[^A-Z0-9&.-]/g, "");
      if (!state.search.length && /^[A-Z0-9&.-]{1,24}$/.test(directSymbol)) {
        const symbol = directSymbol;
        state.search = [{ symbol, name: symbol, sector: "NSE listed equity" }];
      }
      renderChips();
      if (!state.search.length && region) region.innerHTML = '<span class="search-status">No NSE-listed match was returned.</span>';
    } catch (error) {
      if (!isCurrentSearch()) return;
      state.search = [];
      const message = String(error?.message || "The official NSE listings could not be searched.").trim().replace(/[.!?]+$/, "");
      if (region) region.innerHTML = `<span class="search-status">${esc(message)}. Try again in a moment.</span>`;
    }
  }
  function numberList(value) {
    const rows = asRows(value);
    if (rows.length) return rows;
    return objectsDeep(value).filter((item) => field(item, ["date", "timestamp", "close", "closePrice", "lastPrice"]) != null);
  }
  function normalizedHistory(value) {
    return numberList(value).map((row) => ({
      date: String(field(row, ["date", "timestamp", "tradeDate", "tradingDate", "datetime"]) || ""),
      close: numeric(field(row, ["close", "closePrice", "lastPrice", "ltp", "price", "value"]))
    })).filter((item) => item.close != null).slice(-180);
  }
  function svgChart(history, name) {
    if (history.length < 2) return '<div class="analysis-note">The official feed did not return enough end-of-day history to draw a chart. No estimated values are plotted.</div>';
    const values = history.map((point) => point.close);
    const min = Math.min(...values), max = Math.max(...values), span = Math.max(max - min, Math.abs(max) * 0.002, 1);
    const points = values.map((value, index) => [12 + index * (976 / (values.length - 1)), 190 - ((value - min) / span) * 152]);
    const line = points.map(([x, y], index) => `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${line} L ${points.at(-1)[0].toFixed(1)} 210 L ${points[0][0].toFixed(1)} 210 Z`;
    const direction = values.at(-1) >= values[0] ? "up" : "down";
    const gradientId = `priceGradient-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "series"}`;
    const markerEvery = Math.max(1, Math.ceil(points.length / 8));
    const markers = points.map(([x, y], index) => index % markerEvery === 0 || index === points.length - 1
      ? `<circle class="price-point" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"><title>${esc(history[index].date || "End of day")} · ₹${formatNumber(values[index])}</title></circle>`
      : "").join("");
    return `<div class="price-chart-wrap"><div class="price-chart-top"><span>${esc(history[0].date || "Historical")}</span><span>${esc(history.at(-1).date || "Latest EOD")}</span></div><svg class="price-chart ${direction}" viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label="${esc(name)} end-of-day price history from ${esc(history[0].date || "the earliest close")} to ${esc(history.at(-1).date || "the latest close")}"><defs><linearGradient id="${gradientId}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--glass-chart)" stop-opacity=".28"/><stop offset="100%" stop-color="var(--glass-chart)" stop-opacity="0"/></linearGradient></defs><path class="pulse-grid" d="M0 42H1000 M0 94H1000 M0 146H1000 M0 198H1000"/><path class="price-area" style="fill:url(#${gradientId})" d="${area}"/><path class="price-line" d="${line}"/>${markers}</svg><div class="chart-range" aria-label="Price range for the displayed history"><span><small>LOW</small><b>₹${formatNumber(min)}</b></span><span><small>HIGH</small><b>₹${formatNumber(max)}</b></span><span><small>LATEST CLOSE</small><b>₹${formatNumber(values.at(-1))}</b></span></div></div><div class="chart-foot">${history.length} actual end-of-day observations · hover the chart points for dated closes · <a href="https://www.nseindia.in/nse-mcp" target="_blank" rel="noopener noreferrer">NSE source ↗</a></div>`;
  }
  async function ensureCompany(symbol, suggestedName = symbol, open = true) {
    symbol = String(symbol || "").toUpperCase();
    if (!/^[A-Z0-9&.-]{1,24}$/.test(symbol)) return;
    const current = state.companies.get(symbol) || { symbol, name: suggestedName || symbol, short: symbol.slice(0, 5), sector: "NSE listed equity" };
    if (current.loading) return current.loading;
    if (current.loadedAt && Date.now() - current.loadedAt < 45_000) {
      if (open) { state.selected = current; renderResearch(); }
      return current;
    }
    current.loading = (async () => {
      if (open) {
        state.selected = current;
        $("#research-card").innerHTML = '<div class="panel research-placeholder"><span class="empty-star">◌</span><h2>Loading official company data…</h2><p>Requesting the NSE quote, end-of-day history and recent corporate disclosures.</p></div>';
        navigate("research");
      }
      try {
        const payload = await request({ view: "company", symbol });
        const liveQuote = quoteOf(payload.quote);
        const history = normalizedHistory(payload.history);
        const historyRows = numberList(payload.history);
        const lastHistoryRow = historyRows.at(-1);
        const closeQuote = lastHistoryRow ? quoteOf(lastHistoryRow) : { price: null, change: null, absoluteChange: null };
        if (closeQuote.price != null && closeQuote.change == null) {
          const previousClose = numeric(field(lastHistoryRow, ["prevClose", "previousClose", "prevDayClose"]));
          if (previousClose != null && previousClose !== 0) {
            closeQuote.change = ((closeQuote.price - previousClose) / previousClose) * 100;
            closeQuote.absoluteChange = closeQuote.price - previousClose;
          }
        }
        const quote = liveQuote.price != null ? { ...liveQuote, isClose: false } : { ...closeQuote, isClose: closeQuote.price != null };
        const updated = { ...current, symbol, name: String(field(payload.quote, ["companyName", "company", "securityName", "name"]) || current.name || symbol), quoteData: quote, rawQuote: payload.quote, history, announcements: payload.announcements || { items: [] }, updatedAt: payload.updatedAt || new Date().toISOString(), source: payload.source, freshness: payload.freshness, historyAsOf: String(field(lastHistoryRow, ["date", "tradeDate", "tradingDate"]) || ""), loadedAt: Date.now(), loading: null };
        state.companies.set(symbol, updated);
        if (state.selected?.symbol === symbol || open) { state.selected = updated; renderResearch(); }
        window.dispatchEvent(new CustomEvent("finn:company-updated", { detail: updated }));
        if (state.view === "portfolio") renderPortfolio();
        if (state.view === "watchlist") renderWatchlist();
        return updated;
      } catch (error) {
        current.loading = null;
        current.error = error.message;
        state.companies.set(symbol, current);
        window.dispatchEvent(new CustomEvent("finn:company-updated", { detail: current }));
        if (open) {
          state.selected = current;
          $("#research-card").innerHTML = `<div class="panel analysis-note"><b>Live company data is unavailable.</b><p>${esc(error.message)}</p><button type="button" class="primary-btn" data-retry-company="${esc(symbol)}">Try again</button></div>`;
        }
        if (state.view === "portfolio") renderPortfolio();
        if (state.view === "watchlist") renderWatchlist();
        return current;
      }
    })();
    return current.loading;
  }
  function renderResearch() {
    const company = state.selected;
    if (!company || !company.symbol) return;
    const quote = company.quoteData || { price: null, change: null };
    const tracked = state.portfolio.some((item) => item.symbol === company.symbol);
    const watched = state.watchlist.some((item) => item.symbol === company.symbol);
    const priceKind = quote.isClose ? `Latest close${company.historyAsOf ? ` · ${esc(company.historyAsOf)}` : ""}` : "Live quote · NSE delay applies";
    const movementKind = quote.isClose ? "Change from previous close" : "Day change · NSE";
    $("#research-card").innerHTML = `<div class="research-layout"><div class="panel research-main"><div class="company-title"><span class="company-logo">${esc(company.short || company.symbol.slice(0, 5))}</span><div><h2>${esc(company.name || company.symbol)}</h2><p>${esc(company.symbol)} · ${esc(company.sector || "NSE listed equity")} · NSE</p></div><button class="quiet-btn company-actions" type="button" data-company-action="${tracked ? "untrack" : "track"}" data-symbol="${esc(company.symbol)}">${tracked ? "✓ In portfolio" : "＋ Portfolio"}</button><button class="quiet-btn" type="button" data-company-action="${watched ? "unwatch" : "watch"}" data-symbol="${esc(company.symbol)}">${watched ? "★ Saved" : "☆ Watch"}</button></div><div class="metric-grid"><div class="metric"><span>${priceKind}</span><b>${quote.price == null ? "Unavailable" : `₹${formatNumber(quote.price)}`}</b><small class="${quote.change != null && quote.change < 0 ? "down" : "up"}">${formatPercent(quote.change)}</small></div><div class="metric"><span>${movementKind}</span><b>${quote.absoluteChange == null ? "Unavailable" : `₹${formatNumber(quote.absoluteChange)}`}</b><small>${quote.isClose ? "Calculated from NSE closes" : "As reported by NSE"}</small></div><div class="metric"><span>Revenue</span><b>Not in feed</b><small>Verify in company filings</small></div><div class="metric"><span>Profit</span><b>Not in feed</b><small>Verify in company filings</small></div></div><section class="research-section"><div class="chart-heading"><div><span class="eyebrow">PRICE HISTORY · END OF DAY</span><h3>${esc(company.name || company.symbol)}</h3></div><span class="source-label">${company.history?.length || 0} observations</span></div>${svgChart(company.history || [], company.name || company.symbol)}</section><section class="research-section"><h3>Recent corporate announcements</h3><p class="source-status">NSE announcement metadata. Open the filing to verify its full contents.</p><div id="announcement-list"></div></section><section class="research-section"><h3>Fundamentals</h3><p>Quarterly revenue, EBITDA, profit, margins and market capitalization are not supplied by this live market feed, so FINN leaves them blank. Open a primary disclosure to inspect reported financial statements.</p></section></div><aside class="panel research-side"><h3>Data quality & sources</h3><div class="source-item"><b>Quote</b><small>${esc(company.freshness || "NSE delayed intraday feed")}</small><a href="https://www.nseindia.in/nse-mcp" target="_blank" rel="noopener noreferrer">NSE market data terms ↗</a></div><div class="source-item"><b>Price history</b><small>End-of-day values from the exchange history feed.</small></div><div class="source-item"><b>AI research</b><small>Ask FINN summarizes recent NSE announcement metadata; it does not claim to read filing attachments.</small></div></aside></div>`;
    listAnnouncements(company);
    renderChips();
    window.dispatchEvent(new CustomEvent("finn:company-selected", { detail: company }));
  }
  function openModal(title, body, eyebrow = "PROFILE") {
    $("#modal-title").textContent = title;
    $("#modal-eyebrow").textContent = eyebrow;
    $("#modal-body").innerHTML = body;
    $("#modal-backdrop").classList.add("open");
  }
  function bindActions() {
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : event.target?.parentElement;
      if (!target) return;
      const nav = target.closest("[data-view]");
      if (nav) { event.preventDefault(); navigate(nav.dataset.view); return; }
      const go = target.closest("[data-go-view]");
      if (go) { event.preventDefault(); navigate(go.dataset.goView); return; }
      const profile = target.closest("[data-profile-trigger]");
      if (profile) { event.preventDefault(); openModal("Sitender", '<p>Your FINN workspace is stored in this browser.</p><div class="setting-row"><span>Display name</span><b>Sitender</b></div><div class="setting-row"><span>Data storage</span><b>This device only</b></div><p class="muted">No account or contacts are connected.</p>'); return; }
      if (target.closest("#modal-close") || target.id === "modal-backdrop") { $("#modal-backdrop").classList.remove("open"); return; }
      const symbolButton = target.closest("[data-symbol]");
      if (symbolButton?.dataset.symbol) {
        if (symbolButton.closest(".company-chips")) ensureCompany(symbolButton.dataset.symbol, symbolButton.querySelector("b")?.textContent || symbolButton.dataset.symbol, true);
        else if (symbolButton.closest(".feed-card")) ensureCompany(symbolButton.dataset.symbol, symbolButton.dataset.symbol, true);
      }
      const openButton = target.closest("[data-open-company]");
      if (openButton) ensureCompany(openButton.dataset.openCompany, openButton.dataset.openCompany, true);
      const companyAction = target.closest("[data-company-action]");
      if (companyAction) {
        const company = state.selected;
        if (company) toggleList(companyAction.dataset.companyAction.includes("watch") ? "watchlist" : "portfolio", company.symbol, company.name);
      }
      const cardAction = target.closest("[data-card-action]");
      if (cardAction) {
        const action = cardAction.dataset.cardAction;
        toggleList(action === "watch" || action === "unwatch" ? "watchlist" : "portfolio", cardAction.dataset.symbol);
      }
      const watchAction = target.closest("[data-watch-action]");
      if (watchAction) toggleList("watchlist", watchAction.dataset.symbol);
      const retry = target.closest("[data-retry-company]");
      if (retry) ensureCompany(retry.dataset.retryCompany, retry.dataset.retryCompany, true);
      const moverFilter = target.closest("[data-mover-filter]");
      if (moverFilter) {
        state.moverFilter = moverFilter.dataset.moverFilter;
        $$("[data-mover-filter]").forEach((button) => { const active = button === moverFilter; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
        renderMovers();
      }
    });
    $("#refresh-btn")?.addEventListener("click", loadOverview);
    $("#company-search")?.addEventListener("input", (event) => {
      window.clearTimeout(state.searchTimer);
      state.searchTimer = window.setTimeout(() => searchCompanies(event.target.value), 320);
    });
    $("#company-search")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const query = event.currentTarget.value.trim();
        const directSymbol = query.toUpperCase().replace(/\.NS$/, "");
        const exact = state.search.find((item) => item.symbol === directSymbol);
        if (/^[A-Z0-9&.-]{1,24}$/.test(directSymbol)) ensureCompany(directSymbol, exact?.name || directSymbol, true);
        else if (state.search.length === 1) ensureCompany(state.search[0].symbol, state.search[0].name, true);
        else searchCompanies(query).then(() => { if (state.search.length === 1) ensureCompany(state.search[0].symbol, state.search[0].name, true); });
      }
    });
    $("#portfolio-search")?.addEventListener("input", renderPortfolio);
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); navigate("research"); $("#company-search")?.focus(); }
      if (event.key === "Escape") $("#modal-backdrop")?.classList.remove("open");
    });
    window.addEventListener("hashchange", () => { const view = location.hash.slice(1); if (view) navigate(view, { fromHash: true }); });
  }

  bindActions();
  persistLists();
  renderPortfolio();
  renderWatchlist();
  const initialView = location.hash.slice(1);
  if (initialView) navigate(initialView, { fromHash: true });
  loadOverview();
  window.setInterval(() => { if (!document.hidden) loadOverview(); }, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - lastOverviewSuccessAt >= 60_000) loadOverview();
  });
})();
