/* Theme handling plus progressive convex-glass refraction for supporting browsers. */
(() => {
  "use strict";
  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  let theme = root.dataset.theme === "light" ? "light" : "dark";
  root.dataset.theme = theme;

  const paintTheme = () => {
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
    if (themeMeta) themeMeta.content = theme === "dark" ? "#0d1117" : "#f6f7f4";
    paintTheme();
  });
  paintTheme();

  const nav = document.querySelector(".sidebar .nav");
  if (nav) nav.style.setProperty("--nav-count", String(nav.querySelectorAll(".nav-item").length));
  document.querySelector(".sidebar")?.setAttribute("data-glass", "dock");
  document.querySelector(".topbar")?.setAttribute("data-glass", "capsule");
  document.querySelector(".market-strip")?.setAttribute("data-glass", "wide");
  themeButton?.setAttribute("data-glass", "capsule");

  function makeGlassMap(width, height, mode = "pill", heightOnly = false) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return "";
    const image = context.createImageData(width, height);
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const radius = mode === "squircle" ? Math.min(width, height) * .19 : Math.min(height * .48, width * .2);
    const innerWidth = Math.max(1, halfWidth - radius);
    const innerHeight = Math.max(1, halfHeight - radius);
    const bevel = Math.max(8, Math.min(width, height) * .17);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const nx = (x - halfWidth) / innerWidth;
        const ny = (y - halfHeight) / innerHeight;
        const r2 = nx * nx + ny * ny;
        const radial = Math.sqrt(r2);
        const edge = Math.max(0, Math.min(1, (radial - .67) / .42));
        const curve = edge * edge * (3 - 2 * edge);
        const offset = (y * width + x) * 4;
        if (heightOnly) {
          const convexHeight = Math.max(0, 1 - Math.min(1, r2) ** (mode === "squircle" ? 1.38 : 1.08));
          image.data[offset] = 255;
          image.data[offset + 1] = 255;
          image.data[offset + 2] = 255;
          image.data[offset + 3] = Math.round(convexHeight * 255);
        } else {
          const nxLength = Math.hypot(nx, ny) || 1;
          const strength = curve * .43;
          image.data[offset] = Math.max(0, Math.min(255, Math.round(128 - nx / nxLength * strength * 112)));
          image.data[offset + 1] = Math.max(0, Math.min(255, Math.round(128 - ny / nxLength * strength * 112)));
          image.data[offset + 2] = 128;
          image.data[offset + 3] = 255;
        }
      }
    }
    context.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
  }

  function addSvgFilter(defs, id, map, height, scale) {
    const svgNS = "http://www.w3.org/2000/svg";
    const filter = document.createElementNS(svgNS, "filter");
    filter.id = id;
    filter.setAttribute("x", "-5%");
    filter.setAttribute("y", "-12%");
    filter.setAttribute("width", "110%");
    filter.setAttribute("height", "124%");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    filter.setAttribute("primitiveUnits", "userSpaceOnUse");

    const image = (href, result) => {
      const node = document.createElementNS(svgNS, "feImage");
      node.setAttribute("x", "0");
      node.setAttribute("y", "0");
      node.setAttribute("width", "100%");
      node.setAttribute("height", "100%");
      node.setAttribute("preserveAspectRatio", "none");
      node.setAttribute("href", href);
      node.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", href);
      node.setAttribute("result", result);
      return node;
    };
    const displacement = document.createElementNS(svgNS, "feDisplacementMap");
    displacement.setAttribute("in", "SourceGraphic");
    displacement.setAttribute("in2", "glass-normal-map");
    displacement.setAttribute("scale", String(scale));
    displacement.setAttribute("xChannelSelector", "R");
    displacement.setAttribute("yChannelSelector", "G");
    displacement.setAttribute("result", "refracted-backdrop");

    const blur = document.createElementNS(svgNS, "feGaussianBlur");
    blur.setAttribute("in", "glass-height-map");
    blur.setAttribute("stdDeviation", "1.2");
    blur.setAttribute("result", "glass-surface-normals");
    const lighting = document.createElementNS(svgNS, "feSpecularLighting");
    lighting.setAttribute("in", "glass-surface-normals");
    lighting.setAttribute("surfaceScale", "3.8");
    lighting.setAttribute("specularConstant", "0.62");
    lighting.setAttribute("specularExponent", "24");
    lighting.setAttribute("lighting-color", "#ffffff");
    lighting.setAttribute("result", "glass-specular");
    const light = document.createElementNS(svgNS, "feDistantLight");
    light.setAttribute("azimuth", "315");
    light.setAttribute("elevation", "52");
    lighting.append(light);
    const clip = document.createElementNS(svgNS, "feComposite");
    clip.setAttribute("in", "glass-specular");
    clip.setAttribute("in2", "SourceAlpha");
    clip.setAttribute("operator", "in");
    clip.setAttribute("result", "glass-highlight");
    const blend = document.createElementNS(svgNS, "feBlend");
    blend.setAttribute("in", "glass-highlight");
    blend.setAttribute("in2", "refracted-backdrop");
    blend.setAttribute("mode", "screen");
    blend.setAttribute("result", "liquid-glass");

    filter.append(image(map, "glass-normal-map"), image(height, "glass-height-map"), displacement, blur, lighting, clip, blend);
    defs.append(filter);
  }

  if (!document.getElementById("finn-glass-filters")) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.id = "finn-glass-filters";
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;pointer-events:none";
    const defs = document.createElementNS(svgNS, "defs");
    const variants = [
      { id: "finn-glass-wide", width: 520, height: 180, mode: "pill", scale: 28 },
      { id: "finn-glass-capsule", width: 440, height: 190, mode: "squircle", scale: 23 }
    ];
    for (const variant of variants) {
      addSvgFilter(defs, variant.id, makeGlassMap(variant.width, variant.height, variant.mode), makeGlassMap(variant.width, variant.height, variant.mode, true), variant.scale);
    }
    svg.append(defs);
    document.body.append(svg);
  }

  const supportsRefraction = window.CSS?.supports?.("backdrop-filter", "url(#finn-glass-capsule) blur(1px)") || window.CSS?.supports?.("-webkit-backdrop-filter", "url(#finn-glass-capsule)");
  if (supportsRefraction) root.dataset.glassRefraction = "supported";
  else root.dataset.glassRefraction = "fallback";

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
