/* Theme toggle and progressive liquid-glass refraction enhancement. */
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
    themeButton.innerHTML = `<span aria-hidden="true">${next === "light" ? "☼" : "☾"}</span><span>${next === "light" ? "Light" : "Dark"}</span>`;
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

  function createPillDisplacementMap(width = 600, height = 180) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return "";
    const image = context.createImageData(width, height);
    const bezel = 18;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const distances = [x, width - 1 - x, y, height - 1 - y];
        let edge = 0;
        for (let i = 1; i < distances.length; i += 1) if (distances[i] < distances[edge]) edge = i;
        const distance = Math.max(0, distances[edge]);
        const t = Math.min(1, distance / bezel);
        const strength = Math.sin(Math.PI * t) * 0.34;
        const dx = edge === 0 ? strength : edge === 1 ? -strength : 0;
        const dy = edge === 2 ? strength : edge === 3 ? -strength : 0;
        const offset = (y * width + x) * 4;
        image.data[offset] = Math.max(0, Math.min(255, Math.round(128 + dx * 127)));
        image.data[offset + 1] = Math.max(0, Math.min(255, Math.round(128 + dy * 127)));
        image.data[offset + 2] = 128;
        image.data[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
  }

  if (!document.getElementById("finn-glass-filters")) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.id = "finn-glass-filters";
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    const defs = document.createElementNS(svgNS, "defs");
    const filter = document.createElementNS(svgNS, "filter");
    filter.id = "finn-liquid-glass";
    filter.setAttribute("x", "-8%");
    filter.setAttribute("y", "-18%");
    filter.setAttribute("width", "116%");
    filter.setAttribute("height", "136%");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    const displacement = document.createElementNS(svgNS, "feImage");
    displacement.setAttribute("x", "0");
    displacement.setAttribute("y", "0");
    displacement.setAttribute("width", "100%");
    displacement.setAttribute("height", "100%");
    displacement.setAttribute("preserveAspectRatio", "none");
    displacement.setAttribute("result", "bezel-map");
    const map = createPillDisplacementMap();
    if (map) {
      displacement.setAttribute("href", map);
      displacement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", map);
    }
    const refract = document.createElementNS(svgNS, "feDisplacementMap");
    refract.setAttribute("in", "SourceGraphic");
    refract.setAttribute("in2", "bezel-map");
    refract.setAttribute("scale", "18");
    refract.setAttribute("xChannelSelector", "R");
    refract.setAttribute("yChannelSelector", "G");
    filter.append(displacement, refract);
    defs.append(filter);
    svg.append(defs);
    document.body.append(svg);
  }
})();
