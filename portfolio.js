/* Portfolio overview and persistent, device-local watchlist for the FINN demo. */
(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const watchlistStorageKey = "finn-watchlist-founding";
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[character]);
  const portfolioCompanies = () => companies.filter((company) => !company.isResearchOnly);

  function loadWatchlist() {
    let stored = null;
    try { stored = localStorage.getItem(watchlistStorageKey); } catch {}
    if (stored == null) {
      try { stored = sessionStorage.getItem(watchlistStorageKey); } catch {}
    }
    if (stored == null) {
      try { stored = localStorage.getItem("finn-followed"); } catch {}
    }
    if (stored == null) {
      try { stored = sessionStorage.getItem("finn-followed"); } catch {}
    }
    try {
      const saved = JSON.parse(stored || "[]");
      followedCompanies.clear();
      if (Array.isArray(saved)) {
        saved.forEach((ticker) => {
          if (companies.some((company) => company.ticker === ticker)) followedCompanies.add(ticker);
        });
      }
    } catch { followedCompanies.clear(); }
  }

  function saveWatchlist() {
    const saved = JSON.stringify([...followedCompanies]);
    try { localStorage.setItem(watchlistStorageKey, saved); } catch {}
    try { sessionStorage.setItem(watchlistStorageKey, saved); } catch {}
    updateWatchlistCount();
  }

  function updateWatchlistCount() {
    const count = followedCompanies.size;
    const badge = $("#watchlist-nav-count");
    if (badge) {
      badge.textContent = String(count);
      badge.hidden = count === 0;
      badge.setAttribute("aria-label", count + (count === 1 ? " company in watchlist" : " companies in watchlist"));
    }
    const summary = $("#watchlist-summary");
    if (summary) summary.innerHTML = '<div class="watchlist-summary-card"><span>Companies saved</span><b>' + count + '</b><small>Stored on this device</small></div>';
  }

  function companyCard(company, mode) {
    const inWatchlist = followedCompanies.has(company.ticker);
    const hasData = company.dataAvailable !== false;
    const price = company.price && company.price !== "—" ? "₹" + escapeHTML(company.price) : "Not connected";
    const marketCap = company.marketCap && company.marketCap !== "—" ? escapeHTML(company.marketCap) : "Not connected";
    const actionLabel = mode === "watchlist"
      ? "Remove"
      : (inWatchlist ? "★ In watchlist" : "☆ Add to watchlist");
    const action = mode === "watchlist" ? "remove" : (inWatchlist ? "remove" : "add");
    return '<article class="portfolio-card panel"><div class="portfolio-card-head"><div class="portfolio-company-id"><span class="company-logo">' +
      escapeHTML(company.short || company.ticker.slice(0, 5)) + '</span><div><h3>' + escapeHTML(company.name) + '</h3><p>' + escapeHTML(company.ticker) +
      ' · ' + escapeHTML(company.sector) + '</p></div></div><button class="watch-action" type="button" data-watch-toggle="' + escapeHTML(company.ticker) +
      '" data-watch-action="' + action + '" aria-pressed="' + String(inWatchlist) + '" aria-label="' +
      (inWatchlist ? "Remove " : "Add ") + escapeHTML(company.name) + ' ' + (mode === "watchlist" ? "from" : "to") + ' watchlist">' + actionLabel +
      '</button></div><div class="portfolio-card-metrics"><div><span>Share price · sample</span><b>' + price + '</b></div><div><span>Market cap · sample</span><b>' + marketCap +
      '</b></div></div><div class="portfolio-card-footer"><span class="data-status ' + (hasData ? "is-sample" : "is-pending") + '">' +
      (hasData ? "Illustrative research available" : "Research data not connected") + '</span><button class="text-btn" type="button" data-open-company="' +
      escapeHTML(company.ticker) + '">Open research <span>→</span></button></div></article>';
  }

  function renderPortfolio() {
    const list = $("#portfolio-list");
    if (!list) return;
    const all = portfolioCompanies();
    const query = String($("#portfolio-search")?.value || "").trim().toLowerCase();
    const matching = all.filter((company) => (company.name + company.ticker + company.sector).toLowerCase().includes(query));
    const sampled = all.filter((company) => company.dataAvailable !== false).length;
    const summary = $("#portfolio-summary");
    if (summary) summary.innerHTML = '<div class="portfolio-stat"><span>Companies tracked</span><b>' + all.length +
      '</b><small>Sample portfolio coverage</small></div><div class="portfolio-stat"><span>Research examples</span><b>' + sampled +
      '</b><small>Illustrative figures only</small></div><div class="portfolio-stat"><span>On your watchlist</span><b>' + followedCompanies.size +
      '</b><small>Saved on this device</small></div>';
    list.innerHTML = matching.length
      ? matching.map((company) => companyCard(company, "portfolio")).join("")
      : '<div class="portfolio-empty panel"><b>No portfolio matches</b><p>Try another company name, ticker, or sector.</p></div>';
  }

  function renderWatchlist() {
    const list = $("#watchlist-list");
    if (!list) return;
    const saved = [...followedCompanies].map((ticker) => companies.find((company) => company.ticker === ticker)).filter(Boolean);
    updateWatchlistCount();
    list.innerHTML = saved.length
      ? saved.map((company) => companyCard(company, "watchlist")).join("")
      : '<div class="portfolio-empty panel"><span class="empty-star" aria-hidden="true">☆</span><b>Your watchlist is empty</b><p>Save a company from its research page or add one from your portfolio.</p><button class="primary-btn" type="button" data-go-view="portfolio">Browse portfolio <span>→</span></button></div>';
  }

  function notify(message) {
    if (typeof toast === "function") toast(message);
  }

  function updateBreadcrumb(view) {
    const label = ({ portfolio: "Portfolio", watchlist: "Watchlist" })[view];
    if (label && $("#crumb-current")) $("#crumb-current").textContent = label;
  }

  function setWatchlisted(ticker, shouldSave) {
    const company = companies.find((item) => item.ticker === ticker);
    if (!company) return;
    if (shouldSave) followedCompanies.add(ticker);
    else followedCompanies.delete(ticker);
    saveWatchlist();
    renderPortfolio();
    renderWatchlist();
    notify(company.name + (shouldSave ? " added to watchlist" : " removed from watchlist"));
  }

  const baseNavigate = window.navigate;
  if (typeof baseNavigate === "function") {
    window.navigate = (view, options) => {
      baseNavigate(view, options);
      updateBreadcrumb(view);
      if (view === "portfolio") renderPortfolio();
      if (view === "watchlist") renderWatchlist();
    };
    $$(".nav-item").forEach((button) => { button.onclick = () => window.navigate(button.dataset.view); });
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!target) return;
    const followButton = target.closest("#follow-btn");
    if (followButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const ticker = selected;
      setWatchlisted(ticker, !followedCompanies.has(ticker));
      if (typeof window.renderResearch === "function") window.renderResearch();
      return;
    }
    const watchButton = target.closest("[data-watch-toggle]");
    if (watchButton) {
      event.preventDefault();
      event.stopPropagation();
      setWatchlisted(watchButton.dataset.watchToggle, watchButton.dataset.watchAction === "add");
      return;
    }
    const companyButton = target.closest("[data-open-company]");
    if (companyButton) {
      event.preventDefault();
      selected = companyButton.dataset.openCompany;
      window.navigate("research");
      return;
    }
    const viewButton = target.closest("[data-go-view]");
    if (viewButton) {
      event.preventDefault();
      window.navigate(viewButton.dataset.goView);
    }
  }, true);

  const search = $("#portfolio-search");
  if (search) search.addEventListener("input", renderPortfolio);
  ["popstate", "hashchange"].forEach((eventName) => window.addEventListener(eventName, () => {
    const view = location.hash.slice(1);
    updateBreadcrumb(view);
    if (view === "portfolio") renderPortfolio();
    if (view === "watchlist") renderWatchlist();
  }));

  loadWatchlist();
  saveWatchlist();
  renderPortfolio();
  renderWatchlist();
  if (typeof window.renderResearch === "function") window.renderResearch();
  const initialView = location.hash.slice(1);
  updateBreadcrumb(initialView);
  if (initialView === "portfolio") renderPortfolio();
  if (initialView === "watchlist") renderWatchlist();
})();
