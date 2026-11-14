/* Small client-side enhancements for theme, phone navigation, and labelled demo market data. */
(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  let theme = "dark";
  try { theme = localStorage.getItem("finn-theme") === "light" ? "light" : "dark"; } catch {}
  root.dataset.theme = theme;

  const actions = $(".top-actions");
  if (actions) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "theme-toggle";
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
    const profileButton = $(".top-avatar", actions);
    actions.insertBefore(toggle, profileButton || null);

    const paintToggle = () => {
      const lightModeNext = root.dataset.theme === "dark";
      toggle.innerHTML = '<span class="theme-glyph" aria-hidden="true">' + (lightModeNext ? "☼" : "☾") + '</span><span>' + (lightModeNext ? "Light" : "Dark") + '</span>';
      toggle.setAttribute("aria-label", "Switch to " + (lightModeNext ? "light" : "dark") + " mode");
      toggle.title = "Switch to " + (lightModeNext ? "light" : "dark") + " mode";
      toggle.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
    };
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("finn-theme", root.dataset.theme); } catch {}
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.content = root.dataset.theme === "dark" ? "#0d1117" : "#f6f7f4";
      paintToggle();
    });
    paintToggle();
  }

  const navItems = $$(".nav-item");
  const nav = navItems[0]?.closest(".nav");
  if (nav) nav.style.setProperty("--nav-count", String(navItems.length));
  navItems.forEach((button) => {
    Array.from(button.childNodes).forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
      const label = document.createElement("span");
      label.className = "nav-label";
      label.textContent = node.textContent.trim();
      button.replaceChild(label, node);
    });
  });

  const strip = $(".market-strip");
  if (!strip || !strip.parentNode) return;

  const panel = document.createElement("section");
  panel.className = "market-pulse";
  panel.setAttribute("aria-label", "Simulated market movement");
  panel.innerHTML =
    '<div class="pulse-head"><div><div class="pulse-label"><i class="pulse-live"></i> Simulated NIFTY 50 pulse</div>' +
    '<div class="pulse-value-row"><strong class="pulse-value" id="pulse-value">—</strong><span class="pulse-change" id="pulse-change">—</span></div></div>' +
    '<div class="pulse-caption">Illustrative demo series<br>refreshes every 8 seconds</div></div>' +
    '<svg class="pulse-chart" viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label="Simulated NIFTY 50 index chart">' +
    '<defs><linearGradient id="pulseGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="var(--glass-chart)" stop-opacity=".72"/><stop offset="100%" stop-color="var(--glass-chart)" stop-opacity="0"/></linearGradient></defs>' +
    '<path class="pulse-grid" d="M0 42H1000 M0 94H1000 M0 146H1000 M0 198H1000"/>' +
    '<path class="pulse-area" id="pulse-area"/><path class="pulse-line" id="pulse-line" d=""/><circle class="pulse-last" id="pulse-last" r="5" cx="0" cy="0"/></svg>' +
    '<div class="pulse-foot"><span>Recent simulated ticks</span><span id="pulse-updated">Starting simulation…</span></div>';
  strip.insertAdjacentElement("afterend", panel);

  const baseNifty = 25842.30;
  const baseSensex = 84112.65;
  const points = [];
  for (let i = 0; i < 40; i += 1) {
    const drift = Math.sin(i * 0.34) * 36 + Math.sin(i * 0.11) * 23 + (Math.random() - 0.5) * 16;
    points.push(baseNifty + drift);
  }
  const initial = points[0];
  const formatIndex = (value) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const formatClock = () => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date());

  function renderPulse() {
    const min = Math.min.apply(null, points);
    const max = Math.max.apply(null, points);
    const spread = Math.max(max - min, 1);
    const coords = points.map((value, index) => {
      const x = 12 + (index / (points.length - 1)) * 976;
      const y = 190 - ((value - min) / spread) * 152;
      return [x, y];
    });
    const line = coords.map((point, index) => (index ? "L " : "M ") + point[0].toFixed(1) + " " + point[1].toFixed(1)).join(" ");
    const area = line + " L " + coords[coords.length - 1][0].toFixed(1) + " 210 L " + coords[0][0].toFixed(1) + " 210 Z";
    $("#pulse-line").setAttribute("d", line);
    $("#pulse-area").setAttribute("d", area);
    $("#pulse-last").setAttribute("cx", coords[coords.length - 1][0].toFixed(1));
    $("#pulse-last").setAttribute("cy", coords[coords.length - 1][1].toFixed(1));

    const current = points[points.length - 1];
    const change = ((current / initial) - 1) * 100;
    const changeText = (change >= 0 ? "+" : "") + change.toFixed(2) + "%";
    $("#pulse-value").textContent = formatIndex(current);
    $("#pulse-change").textContent = changeText;
    $("#pulse-change").classList.toggle("is-down", change < 0);
    $(".pulse-chart").setAttribute("aria-label", "Simulated NIFTY 50 at " + formatIndex(current) + ", " + changeText + " since the first displayed point.");

    const marketItems = $$(".market-strip > div:not(.strip-note)");
    const nifty = marketItems.find((item) => item.querySelector(".market-label")?.textContent.includes("NIFTY"));
    const sensex = marketItems.find((item) => item.querySelector(".market-label")?.textContent.includes("SENSEX"));
    const relativeChange = current / initial;
    if (nifty) {
      const value = $("b", nifty);
      const changeNode = $(".up, .down", nifty);
      if (value) value.textContent = formatIndex(current);
      if (changeNode) {
        changeNode.textContent = changeText;
        changeNode.classList.toggle("up", change >= 0);
        changeNode.classList.toggle("down", change < 0);
      }
    }
    if (sensex) {
      const value = $("b", sensex);
      const changeNode = $(".up, .down", sensex);
      if (value) value.textContent = formatIndex(baseSensex * relativeChange);
      if (changeNode) {
        changeNode.textContent = changeText;
        changeNode.classList.toggle("up", change >= 0);
        changeNode.classList.toggle("down", change < 0);
      }
    }
    const stamp = $("#pulse-updated");
    if (stamp) stamp.textContent = "Updated " + formatClock() + " IST";
    const note = $(".strip-note", strip);
    if (note) note.innerHTML = 'SIMULATION · <span aria-hidden="true">◷</span> 8 sec';
  }

  renderPulse();
  window.setInterval(() => {
    const previous = points[points.length - 1];
    const noise = (Math.random() - 0.48) * 0.0017;
    points.push(previous * (1 + noise));
    points.shift();
    renderPulse();
  }, 8000);
})();
