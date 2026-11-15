const local = new Map();
const inFlight = new Map();
let runtime;

async function sharedCache() {
  if (!process.env.VERCEL) return null;
  return runtime ??= import("@vercel/functions")
    .then(({ getCache }) => getCache({ namespace: "finn-public-nse-v1" }))
    .catch(() => null);
}

export async function cachedData(key, { ttl, shared = false, cacheable = () => true }, fetchData) {
  const hit = local.get(key);
  if (hit?.expires > Date.now()) return { value: hit.value, cache: "memory" };
  local.delete(key);
  if (inFlight.has(key)) return { value: (await inFlight.get(key)).value, cache: "joined" };

  const load = (async () => {
    const cache = shared ? await sharedCache() : null;
    const entry = cache ? await cache.get(key).catch(() => null) : null;
    if (entry?.expires > Date.now()) {
      remember(key, entry);
      return { value: entry.value, cache: "shared" };
    }
    const value = await fetchData();
    if (cacheable(value)) {
      const saved = { value, expires: Date.now() + ttl * 1000 };
      remember(key, saved);
      if (cache) await cache.set(key, saved, { ttl }).catch(() => {});
    }
    return { value, cache: "miss" };
  })();
  inFlight.set(key, load);
  try { return await load; }
  finally { inFlight.delete(key); }
}

function remember(key, entry) {
  if (local.size >= 200) local.delete(local.keys().next().value);
  local.set(key, entry);
}

export function timedStages(res, started = performance.now()) {
  const stages = [];
  return {
    async run(name, work) {
      const start = performance.now();
      try { return await work(); }
      finally { stages.push(`${name};dur=${(performance.now() - start).toFixed(1)}`); }
    },
    finish() {
      res.setHeader("Server-Timing", [...stages, `total;dur=${(performance.now() - started).toFixed(1)}`].join(", "));
    }
  };
}
