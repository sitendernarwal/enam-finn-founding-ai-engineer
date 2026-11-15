/* Theme handling plus progressive convex-glass refraction for supporting browsers. */
(() => {
  "use strict";
  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  let theme = root.dataset.theme === "light" ? "light" : "dark";
  root.dataset.theme = theme;

  const paintTheme = () => {
    if (themeMeta) themeMeta.content = theme === "dark" ? "#0b1117" : "#f3f6f5";
    if (!themeButton) return;
    const next = theme === "dark" ? "light" : "dark";
    themeButton.innerHTML = `<span class="theme-glyph" aria-hidden="true">${next === "light" ? "☼" : "☾"}</span><span>${next === "light" ? "Light" : "Dark"}</span>`;
    themeButton.setAttribute("aria-label", `Switch to ${next} mode`);
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
  };
  themeButton?.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    root.dataset.theme = theme;
    try { localStorage.setItem("finn-theme", theme); } catch {}
    paintTheme();
  });
  paintTheme();

  const nav = document.querySelector(".sidebar .nav");
  if (nav) nav.style.setProperty("--nav-count", String(nav.querySelectorAll(".nav-item").length));

  const surfaces = [
    { selector: ".sidebar", name: "dock", displacement: 16 },
    { selector: ".topbar", name: "capsule", displacement: 14 },
    { selector: ".market-loader", name: "startup", displacement: 23 }
  ];
  for (const glass of surfaces) {
    glass.element = document.querySelector(glass.selector);
    if (glass.element) glass.element.dataset.glass = glass.name;
  }
  themeButton?.setAttribute("data-glass", "capsule");

  // Build a narrow lens around the actual rounded edge, following the approaches at
  // https://kube.io/blog/liquid-glass-css-svg/ and https://github.com/hasib41/liquid-glass-nav.
  function createRimMap(width, height, radius) {
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 720 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return "";

    const map = context.createImageData(canvas.width, canvas.height);
    const band = Math.min(17, height / 4, width / 4);
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    for (let row = 0; row < canvas.height; row++) {
      const y = (row + .5) * height / canvas.height - halfHeight;
      const dy = Math.abs(y) - (halfHeight - radius);
      for (let col = 0; col < canvas.width; col++) {
        const x = (col + .5) * width / canvas.width - halfWidth;
        const dx = Math.abs(x) - (halfWidth - radius);
        const cornerX = Math.max(dx, 0);
        const cornerY = Math.max(dy, 0);
        const outside = Math.sqrt(cornerX * cornerX + cornerY * cornerY);
        const depth = radius - outside - Math.min(Math.max(dx, dy), 0);
        const offset = (row * canvas.width + col) * 4;
        let red = 128;
        let green = 128;

        if (depth >= 0 && depth < band) {
          const normalX = outside ? cornerX / outside : Number(dx > dy);
          const normalY = outside ? cornerY / outside : Number(dy >= dx);
          const t = 1 - depth / band;
          const bend = 121 * t * t * (3 - 2 * t);
          red -= Math.sign(x) * normalX * bend;
          green -= Math.sign(y) * normalY * bend;
        }

        map.data[offset] = red;
        map.data[offset + 1] = green;
        map.data[offset + 2] = 128;
        map.data[offset + 3] = 255;
      }
    }

    context.putImageData(map, 0, 0);
    return canvas.toDataURL();
  }

  function attachLenses() {
    // Some browsers parse url() here but do not paint the SVG backdrop filter.
    const chromium = navigator.userAgentData?.brands?.some(({ brand }) => brand === "Chromium")
      || /\b(?:Chrome|Chromium)\//.test(navigator.userAgent);
    if (!chromium || !window.CSS?.supports("backdrop-filter", "url(#finn-lens-dock)")
      || typeof ResizeObserver !== "function") return;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:fixed;pointer-events:none";
    const defs = document.createElementNS(svgNS, "defs");
    svg.append(defs);
    document.body.append(svg);

    const observer = new ResizeObserver((entries) => {
      for (const { target } of entries) {
        const glass = surfaces.find(({ element }) => element === target);
        const width = target.offsetWidth;
        const height = target.offsetHeight;
        if (!width || !height) continue;

        const cssRadius = getComputedStyle(target).borderTopLeftRadius;
        const radius = Math.min(parseFloat(cssRadius) || 0, width / 2, height / 2);
        const map = createRimMap(width, height, radius);
        if (!map) continue;

        glass.map.setAttribute("width", width);
        glass.map.setAttribute("height", height);
        glass.map.setAttribute("href", map);
        target.style.setProperty("--finn-lens", "url(#" + glass.filter.id + ")");
      }
    });

    for (const glass of surfaces) {
      if (!glass.element) continue;
      const filter = document.createElementNS(svgNS, "filter");
      filter.id = "finn-lens-" + glass.name;
      filter.setAttribute("color-interpolation-filters", "sRGB");
      // Keep the frost inside the SVG chain so it softens the refracted backdrop.
      filter.innerHTML = '<feImage x="0" y="0" preserveAspectRatio="none" result="rim"/>'
        + '<feDisplacementMap in="SourceGraphic" in2="rim" scale="' + (2 * glass.displacement)
        + '" xChannelSelector="R" yChannelSelector="G"/>'
        + '<feGaussianBlur stdDeviation="4" edgeMode="duplicate"/>'
        + '<feColorMatrix type="saturate" values="1.25"/>';
      glass.filter = filter;
      glass.map = filter.firstElementChild;
      defs.append(filter);
      observer.observe(glass.element);
    }
  }
  attachLenses();

  if (window.matchMedia?.("(pointer: fine)").matches) {
    document.querySelectorAll(".topbar, .sidebar").forEach((surface) => {
      let frame = 0;
      surface.addEventListener("pointermove", (event) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          const rect = surface.getBoundingClientRect();
          surface.style.setProperty("--glass-pointer-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
          surface.style.setProperty("--glass-pointer-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
          frame = 0;
        });
      }, { passive: true });
      surface.addEventListener("pointerleave", () => {
        surface.style.setProperty("--glass-pointer-x", "50%");
        surface.style.setProperty("--glass-pointer-y", "0%");
      }, { passive: true });
    });
  }
})();
