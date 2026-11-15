import { cachedData } from "./data-cache.js";

export const NSE_FILINGS_PAGE = "https://www.nseindia.com/companies-listing/corporate-filings-announcements";
const NSE_API = "https://www.nseindia.com/api/corporate-announcements";
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric"
});
const months = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ");

export function nseTime(value) {
  const source = String(value || "").trim();
  const match = source.match(/^(\d{1,2})[-/ ](\d{1,2}|[a-z]{3,9})[-/ ](\d{4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/i);
  if (!match) {
    const timestamp = /^\d{4}-\d{2}-\d{2}/.test(source) ? Date.parse(source) : NaN;
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
  const [, day, mon, year, h = 0, m = 0, s = 0] = match;
  const month = /^\d+$/.test(mon) ? Number(mon) : months.indexOf(mon.slice(0, 3).toLowerCase()) + 1;
  const utc = Date.UTC(Number(year), month - 1, Number(day), Number(h), Number(m), Number(s));
  const date = new Date(utc);
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== Number(day) ||
      date.getUTCHours() !== Number(h) || date.getUTCMinutes() !== Number(m) || date.getUTCSeconds() !== Number(s)) return 0;
  return utc - 330 * 60 * 1000;
}

export function officialSource(value, title) {
  if (!value) return null;
  try {
    const url = new URL(value, NSE_FILINGS_PAGE);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        !/(^|\.)(nseindia\.in|nseindia\.com|bseindia\.com)$/.test(url.hostname)) return null;
    return { title: String(title).slice(0, 180), url: url.href };
  } catch { return null; }
}

function normalize(record, symbol) {
  const fields = new Map(Object.entries(record || {}).map(([key, value]) => [key.toLowerCase(), value]));
  const read = (...keys) => keys.map(key => String(fields.get(key) ?? "").trim()).find(Boolean) || "";
  const recordSymbol = read("symbol", "sm_symbol", "ticker").toUpperCase();
  if (recordSymbol && recordSymbol !== symbol) return null;
  const title = read("desc", "subject", "sub", "category", "announcement").slice(0, 250);
  const details = read("attchmnttext", "attachmenttext", "announcementtext", "description", "details").slice(0, 1500);
  if (!title && !details) return null;
  const date = read("an_dt", "dissemdt", "broadcast_date", "date", "filing_date");
  return {
    title: title || "NSE disclosure", details, date, timestamp: nseTime(date),
    source: officialSource(read("attchmntfile", "attachment_file", "attachment", "file_url", "fileurl", "url"), title || "NSE disclosure")
  };
}

export function getFilings(symbol) {
  return cachedData(`filings:${symbol}`, { ttl: 180, shared: true }, async () => {
    const now = new Date();
    const from = new Date(now.getTime() - 365 * 86400_000);
    const url = new URL(NSE_API);
    url.search = new URLSearchParams({
      index: "equities", symbol,
      from_date: formatter.format(from).replaceAll("/", "-"),
      to_date: formatter.format(now).replaceAll("/", "-")
    });
    const response = await fetch(url, {
      signal: AbortSignal.timeout(7_000),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: NSE_FILINGS_PAGE,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) throw new Error(`NSE_FILINGS_${response.status}`);
    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : ["data", "records", "announcements", "results"]
      .map(key => payload?.[key]).find(Array.isArray);
    if (!rows) throw new Error("NSE_FILINGS_INVALID_RESPONSE");
    const seen = new Set();
    const items = rows.map(record => normalize(record, symbol)).filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter(item => {
        const key = item.source?.url || `${item.title}|${item.date}|${item.details}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 160);
    return { url: url.href, items, fetchedAt: now.toISOString() };
  });
}
