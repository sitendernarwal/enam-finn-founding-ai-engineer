const ALLOWED_ORIGINS = new Set([
  "https://sitendernarwal.github.io",
  "http://localhost:3000",
  "http://localhost:8000",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:8000"
]);
const NSE_LIVE_MCP = "https://mcp.nseindia.in/cmmkt/mcp";
const NSE_EOD_MCP = "https://mcp.nseindia.in/bhavcopy/cm/mcp";
const NSE_FILINGS_API = "https://www.nseindia.com/api/corporate-announcements";
const NSE_FILINGS_PAGE = "https://www.nseindia.in/companies-listing/corporate-filings-announcements";
const TTL_MS = 45_000;
const responseCache = globalThis.__finnMarketDataCache || (globalThis.__finnMarketDataCache = new Map());

function send(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=30");
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(JSON.stringify(payload));
}

function corsHeaders(origin) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin"
  };
}

function decodeRpcBody(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { /* Streamable HTTP may return SSE. */ }
  const data = trimmed.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim());
  for (const item of data) {
    try { return JSON.parse(item); } catch { /* Ignore non-JSON SSE messages. */ }
  }
  throw new Error("NSE returned an unreadable MCP response.");
}

async function rpcPost(endpoint, sessionId, message, signal) {
  const headers = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    "MCP-Protocol-Version": "2025-03-26"
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;
  const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(message), signal });
  const raw = response.status === 202 ? "" : await response.text();
  if (!response.ok) throw new Error(`NSE_MCP_${response.status}`);
  return { data: decodeRpcBody(raw), sessionId: response.headers.get("mcp-session-id") || sessionId };
}

async function withMcp(endpoint, work) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14_000);
  try {
    const initialized = await rpcPost(endpoint, null, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "finn-investor-intelligence", version: "1.0.0" }
      }
    }, controller.signal);
    if (initialized.data?.error) throw new Error("NSE_MCP_INITIALIZE_FAILED");
    const sessionId = initialized.sessionId;
    try {
      await rpcPost(endpoint, sessionId, { jsonrpc: "2.0", method: "notifications/initialized" }, controller.signal);
    } catch { /* Some compatible servers return no body for notifications. */ }
    const listed = await rpcPost(endpoint, sessionId, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, controller.signal);
    if (listed.data?.error) throw new Error("NSE_MCP_TOOLS_UNAVAILABLE");
    const tools = listed.data?.result?.tools || [];
    if (!tools.length) throw new Error("NSE_MCP_NO_TOOLS");
    return await work({ tools, sessionId, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function findTool(tools, candidates) {
  for (const candidate of candidates) {
    const match = tools.find((tool) => tool.name === candidate);
    if (match) return match;
  }
  return null;
}

function buildArguments(tool, { symbol, query, index, direction, date, limit }) {
  const properties = tool?.inputSchema?.properties || {};
  const required = tool?.inputSchema?.required || [];
  const args = {};
  const normalize = (value) => String(value).toLowerCase().replace(/[^a-z]/g, "");
  const now = new Date();
  const fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const dateValue = (value) => value === "from" || value === "start"
    ? fromDate.toISOString().slice(0, 10)
    : now.toISOString().slice(0, 10);
  for (const [key, descriptor] of Object.entries(properties)) {
    const normalized = normalize(key);
    if (symbol && /(symbol|ticker|stockcode|securitycode)/.test(normalized)) args[key] = descriptor?.type === "array" ? [symbol] : symbol;
    else if (index && /index/.test(normalized)) args[key] = index;
    else if (query && /(query|search|company|name)/.test(normalized)) args[key] = query;
    else if (date && /^(date|tradedate|sessiondate|asofdate)$/.test(normalized)) args[key] = date;
    else if (direction && Array.isArray(descriptor?.enum) && descriptor.enum.some((value) => normalize(value) === normalize(direction))) {
      args[key] = descriptor.enum.find((value) => normalize(value) === normalize(direction));
    }
    else if (direction && /(direction|mover|gainerloser|sortby)/.test(normalized)) {
      args[key] = direction;
    }
    else if (limit != null && /^(limit|count|pagesize|maxrecords|topn|numberofstocks|numresults|numstocks)$/.test(normalized)) args[key] = limit;
    else if (/(start|from).*(date|time)|^(fromdate|startdate)$/.test(normalized)) args[key] = dateValue("from");
    else if (/(end|to).*(date|time)|^(todate|enddate)$/.test(normalized)) args[key] = dateValue("to");
    else if (/^(period|range|duration|lookback)$/.test(normalized)) args[key] = descriptor?.enum?.find((value) => ["3M", "90D", "3MONTHS", "1Y"].includes(String(value).toUpperCase().replace(/[^A-Z0-9]/g, ""))) || descriptor?.enum?.[0] || "3M";
    else if (/^(days|limit|count|pagesize)$/.test(normalized)) args[key] = 90;
    else if (/^(interval|frequency|resolution)$/.test(normalized)) args[key] = descriptor?.enum?.find((value) => ["1D", "DAY", "DAILY"].includes(String(value).toUpperCase().replace(/[^A-Z0-9]/g, ""))) || descriptor?.enum?.[0] || "day";
    else if (Array.isArray(descriptor?.enum) && descriptor.enum.length) {
      args[key] = descriptor.enum.find((value) => normalize(value) === normalize(index || "")) || descriptor.enum[0];
    }
  }
  for (const key of required) {
    if (Object.prototype.hasOwnProperty.call(args, key)) continue;
    const descriptor = properties[key] || {};
    if (Array.isArray(descriptor.enum) && descriptor.enum.length) args[key] = descriptor.enum[0];
    else if (descriptor.type === "boolean") args[key] = false;
    else if (descriptor.type === "number" || descriptor.type === "integer") args[key] = 90;
    else if (descriptor.type === "string") {
      const normalized = normalize(key);
      if (/(start|from).*(date|time)|^(fromdate|startdate)$/.test(normalized)) args[key] = dateValue("from");
      else if (/(end|to).*(date|time)|^(todate|enddate)$/.test(normalized)) args[key] = dateValue("to");
      else if (/index/.test(normalized)) args[key] = index || "NIFTY 50";
      else args[key] = query || symbol || index || "";
    }
  }
  return args;
}

async function callTool(endpoint, tool, input) {
  const args = buildArguments(tool, input);
  const response = await rpcPost(endpoint, input.sessionId, {
    jsonrpc: "2.0",
    id: input.id || 3,
    method: "tools/call",
    params: { name: tool.name, arguments: args }
  }, input.signal);
  if (response.data?.error) throw new Error(`NSE_MCP_TOOL_${tool.name}_FAILED`);
  const result = response.data?.result;
  if (result?.isError) throw new Error(`NSE_MCP_TOOL_${tool.name}_FAILED`);
  const text = Array.isArray(result?.content)
    ? result.content.filter((block) => block?.type === "text").map((block) => block.text).join("\n")
    : "";
  if (result?.structuredContent) return result.structuredContent;
  if (text) {
    try { return JSON.parse(text); } catch { return { text }; }
  }
  return result || null;
}

function listFrom(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of ["data", "records", "stocks", "quotes", "results", "items", "announcements", "history", "candles", "prices", "indices"]) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
}

function safeFilingUrl(value, title) {
  try {
    const parsed = new URL(value, "https://www.nseindia.in");
    const host = parsed.hostname.toLowerCase();
    if (parsed.protocol !== "https:" || !(host === "nseindia.in" || host.endsWith(".nseindia.in") || host === "nseindia.com" || host.endsWith(".nseindia.com"))) return null;
    return { title: String(title || "NSE disclosure").slice(0, 160), url: parsed.href };
  } catch { return null; }
}

function normalizeAnnouncement(record) {
  const title = String(record?.desc || record?.subject || record?.sub || record?.category || "NSE disclosure").trim();
  const details = String(record?.attchmntText || record?.attachmentText || record?.announcementText || record?.description || "").trim();
  const date = String(record?.an_dt || record?.dissemDT || record?.broadcast_date || record?.date || "").trim();
  const attachment = safeFilingUrl(record?.attchmntFile || record?.attachment_file || record?.attachment || record?.file_url || "", title);
  return { title, details, date, source: attachment };
}

async function getAnnouncements(symbol) {
  const now = new Date();
  const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const date = (value) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
  const url = new URL(NSE_FILINGS_API);
  url.searchParams.set("index", "equities");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("from_date", date(from));
  url.searchParams.set("to_date", date(now));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: NSE_FILINGS_PAGE,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) return { sourceUrl: NSE_FILINGS_PAGE, items: [], available: false };
    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : (payload?.data || []);
    const items = rows.slice(0, 10).map(normalizeAnnouncement).filter((item) => item.title || item.details);
    return { sourceUrl: url.href, items, available: true };
  } catch {
    return { sourceUrl: NSE_FILINGS_PAGE, items: [], available: false };
  } finally {
    clearTimeout(timeout);
  }
}

function cacheRead(key) {
  const hit = responseCache.get(key);
  if (hit && hit.expiry > Date.now()) return hit.value;
  if (hit) responseCache.delete(key);
  return null;
}

function cacheWrite(key, value) {
  if (responseCache.size > 200) responseCache.clear();
  responseCache.set(key, { expiry: Date.now() + TTL_MS, value });
  return value;
}

async function getOverview() {
  return withMcp(NSE_LIVE_MCP, async ({ tools, sessionId, signal }) => {
    const indicesTool = findTool(tools, ["cm_get_live_indices"]);
    const gainersTool = findTool(tools, ["cm_get_live_gainers", "nse_get_gainers"]);
    const losersTool = findTool(tools, ["cm_get_live_losers", "nse_get_losers"]);
    const result = { asOf: new Date().toISOString(), delay: "NSE reports a 1–3 minute delay during trading hours", indices: null, history: null, gainers: null, losers: null, source: "https://www.nseindia.in/nse-mcp" };
    if (indicesTool) {
      try { result.indices = await callTool(NSE_LIVE_MCP, indicesTool, { sessionId, signal }); } catch { result.indices = null; }
    }
    if (gainersTool) {
      try { result.gainers = await callTool(NSE_LIVE_MCP, gainersTool, { sessionId, signal }); } catch { result.gainers = null; }
    }
    if (losersTool) {
      try { result.losers = await callTool(NSE_LIVE_MCP, losersTool, { sessionId, signal }); } catch { result.losers = null; }
    }
    return result;
  }).then(async (result) => {
    try {
      const historyPayload = await withMcp(NSE_EOD_MCP, async ({ tools, sessionId, signal }) => {
        const historyTool = findTool(tools, ["get_index_history"]);
        const topMoversTool = findTool(tools, ["get_top_movers"]);
        const [history, bankHistory] = historyTool ? await Promise.all([
          callTool(NSE_EOD_MCP, historyTool, { index: "NIFTY 50", sessionId, signal, id: 3 }).catch(() => null),
          callTool(NSE_EOD_MCP, historyTool, { index: "NIFTY BANK", sessionId, signal, id: 4 }).catch(() => null)
        ]) : [null, null];
        const latestRow = listFrom(history).at(-1);
        const sessionDate = String(latestRow?.date || latestRow?.tradeDate || latestRow?.tradingDate || "");
        let eodMovers = null;
        if (topMoversTool && sessionDate && (!listFrom(result.gainers).length || !listFrom(result.losers).length)) {
          const [gainers, losers] = await Promise.all([
            callTool(NSE_EOD_MCP, topMoversTool, { date: sessionDate, direction: "gainers", limit: 5, sessionId, signal, id: 5 }).catch(() => null),
            callTool(NSE_EOD_MCP, topMoversTool, { date: sessionDate, direction: "losers", limit: 5, sessionId, signal, id: 6 }).catch(() => null)
          ]);
          eodMovers = { date: sessionDate, gainers, losers, source: "https://www.nseindia.in/nse-mcp" };
        }
        return { history, bankHistory, eodMovers };
      });
      result.history = historyPayload?.history || null;
      result.bankHistory = historyPayload?.bankHistory || null;
      result.eodMovers = historyPayload?.eodMovers || null;
    } catch { result.history = null; result.bankHistory = null; result.eodMovers = null; }
    return result;
  });
}

async function searchCompanies(query) {
  return withMcp(NSE_LIVE_MCP, async ({ tools, sessionId, signal }) => {
    const tool = findTool(tools, ["cm_get_equity_stocks"]);
    if (!tool) throw new Error("NSE_MCP_EQUITY_LIST_TOOL_UNAVAILABLE");
    const raw = await callTool(NSE_LIVE_MCP, tool, { query, sessionId, signal });
    const q = query.toUpperCase();
    const items = listFrom(raw).filter((item) => {
      const text = [item?.symbol, item?.ticker, item?.companyName, item?.name, item?.company, item?.securityName].join(" ").toUpperCase();
      return !q || text.includes(q);
    }).slice(0, 25).map((item) => ({
      symbol: String(item?.symbol || item?.ticker || item?.symbolName || "").toUpperCase(),
      name: String(item?.companyName || item?.name || item?.company || item?.securityName || item?.symbol || ""),
      sector: String(item?.sector || "NSE listed equity"),
      quote: item
    })).filter((item) => item.symbol && item.name);
    return { query, items, source: "https://www.nseindia.in/nse-mcp", updatedAt: new Date().toISOString() };
  });
}

async function getCompany(symbol) {
  const [quote, history, announcements] = await Promise.all([
    withMcp(NSE_LIVE_MCP, async ({ tools, sessionId, signal }) => {
      const tool = findTool(tools, ["cm_get_stock_quote"]);
      if (!tool) throw new Error("NSE_MCP_QUOTE_TOOL_UNAVAILABLE");
      return callTool(NSE_LIVE_MCP, tool, { symbol, sessionId, signal });
    }).catch(() => null),
    withMcp(NSE_EOD_MCP, async ({ tools, sessionId, signal }) => {
      const tool = findTool(tools, ["get_stock_history"]);
      if (!tool) throw new Error("NSE_MCP_HISTORY_TOOL_UNAVAILABLE");
      return callTool(NSE_EOD_MCP, tool, { symbol, sessionId, signal });
    }).catch(() => null),
    getAnnouncements(symbol)
  ]);
  if (quote == null && history == null && !announcements.available) throw new Error("NSE_MCP_COMPANY_DATA_UNAVAILABLE");
  return {
    symbol,
    quote,
    history,
    announcements,
    source: "https://www.nseindia.in/nse-mcp",
    updatedAt: new Date().toISOString(),
    freshness: "NSE says intraday data may be delayed by 1–3 minutes; historical candles are end-of-day."
  };
}

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) return send(res, 403, { error: "This site is not allowed to use live market data." });
  const headers = corsHeaders(origin);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
    res.end();
    return;
  }
  if (req.method !== "GET") return send(res, 405, { error: "Use GET to retrieve live NSE data." }, { Allow: "GET, OPTIONS", ...headers });

  const view = String(req.query?.view || "overview").trim().toLowerCase();
  if (view !== "overview" && view !== "company" && view !== "search") return send(res, 400, { error: "Choose the overview, company, or search view." }, headers);
  const symbol = String(req.query?.symbol || "").trim().toUpperCase();
  const query = String(req.query?.q || "").trim().slice(0, 80);
  if (view === "company" && !/^[A-Z0-9&.-]{1,24}$/.test(symbol)) return send(res, 400, { error: "Enter a valid NSE symbol." }, headers);
  if (view === "search" && query.length < 2) return send(res, 400, { error: "Enter at least two letters to search NSE listings." }, headers);
  const key = view === "company" ? `company:${symbol}` : view === "search" ? `search:${query.toUpperCase()}` : "overview";
  const cached = cacheRead(key);
  if (cached) return send(res, 200, cached, headers);

  try {
    const payload = view === "company" ? await getCompany(symbol) : view === "search" ? await searchCompanies(query) : await getOverview();
    return send(res, 200, cacheWrite(key, payload), headers);
  } catch (error) {
    const status = error?.name === "AbortError" ? 504 : 503;
    console.error("FINN live NSE lookup failed", String(error?.message || error?.name || "upstream_error").slice(0, 100));
    return send(res, status, {
      error: "The official NSE feed is unavailable right now. No sample prices are shown; please try again later.",
      source: "https://www.nseindia.in/nse-mcp"
    }, headers);
  }
}
