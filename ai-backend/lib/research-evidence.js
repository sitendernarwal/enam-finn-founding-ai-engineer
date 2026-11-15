const results = /\b(?:results?|revenue|ebitda|profit|margin|quarterly earnings|earnings|financial performance)\b/i;
const outlook = /\b(?:outlook|guidance|forecast|management commentary|investor presentation|earnings call)\b/i;
const risks = /\b(?:risks?|litigation|default|penalty|regulatory|lawsuit)\b/i;
const otherFiling = /\b(?:dividend|buyback|acquisition|merger|board change|resignation)\b/i;
const numericRequest = /\b(?:revenue|ebitda|profit|margin|earnings per share|eps|how much|reporting period|figures|financial performance)\b/i;
const metadataRequest = /\b(?:metadata|filing date|when.{0,24}(?:filed|announced)|link to (?:the )?filing)\b/i;
const resultsFiling = /\b(?:financial|quarterly|annual|earnings|unaudited|audited)\b.{0,80}\bresults?\b|\bresults?\b.{0,80}\b(?:financial|quarterly|annual|earnings)\b|outcomeofbmresults/is;

function rank(items, topic, matcher) {
  const words = topic.toLowerCase().match(/[a-z]{4,}/g) || [];
  return items.map((item, i) => {
    const title = item.title.toLowerCase();
    const details = item.details.toLowerCase();
    const strong = matcher?.test(item.title) ? 8 : matcher?.test(`${item.details} ${item.source?.url || ""}`) ? 5 : 0;
    // Prefer the latest record if two filings match the category equally well.
    const hits = matcher ? 0 : words.reduce((n, word) => n + (title.includes(word) ? 2 : details.includes(word) ? 1 : 0), 0);
    return { item, i, score: strong + hits };
  }).sort((a, b) => b.score - a.score || a.i - b.i);
}

export function planResearch(items, question) {
  const topics = [
    { question: results, record: resultsFiling },
    { question: outlook, record: /outlook|guidance|forecast|investor presentation|transcript/i },
    { question: risks, record: risks },
    { question: otherFiling, record: otherFiling }
  ].filter(topic => topic.question.test(question));
  const includesResults = topics.some(topic => topic.question === results);
  const ranked = rank(items, question, topics[0]?.record);
  const rankedByTopic = topics.map(topic => rank(items, question, topic.record));
  const unique = new Set();
  for (const list of rankedByTopic) {
    const best = list.find(result => result.score > 0 && !unique.has(result.item));
    if (best) unique.add(best.item);
  }
  for (const { item } of ranked) {
    if (unique.size >= 5) break;
    unique.add(item);
  }
  const metadataOnly = metadataRequest.test(question) && !outlook.test(question) && topics.length < 2 &&
    (/\bmetadata\b/i.test(question) || !numericRequest.test(question));
  const simpleResults = includesResults && topics.length === 1 && !/\b(?:compare|versus|vs|each)\b/i.test(question) &&
    (metadataOnly || !/\band\b/i.test(question) && !numericRequest.test(question) &&
      !/\b(?:summari[sz]e|what did|what does|explain)\b/i.test(question));
  const wantsPdf = !metadataOnly && (numericRequest.test(question) || outlook.test(question) ||
    includesResults && /\b(?:summari[sz]e|what did|what does|explain|compare)\b/i.test(question));
  const pdfRank = outlook.test(question) && !numericRequest.test(question)
    ? rankedByTopic[topics.findIndex(topic => topic.question === outlook)] : ranked;
  const pdf = wantsPdf ? pdfRank.find(({ item, score }) => score > 0 && item.source &&
    /\.pdf$/i.test(new URL(item.source.url).pathname))?.item : null;
  return { disclosures: [...unique], pdf, simpleResults, latestResults: items.find(item =>
    item.timestamp > 0 && resultsFiling.test(`${item.title} ${item.details} ${item.source?.url || ""}`)) };
}

const MAX_PDF_BYTES = 2 * 1024 * 1024;

export async function readOfficialPdf(source) {
  const url = new URL(source.url);
  if (!/^(?:nsearchives\.)?nseindia\.(?:com|in)$/.test(url.hostname)) return null;
  const response = await fetch(url, {
    redirect: "error", signal: AbortSignal.timeout(6_000),
    headers: { Accept: "application/pdf, application/octet-stream" }
  });
  const type = response.headers.get("content-type") || "";
  if (!response.ok || !response.body || !/^(?:application\/pdf|application\/octet-stream)(?:;|$)/i.test(type) ||
      Number(response.headers.get("content-length") || 0) > MAX_PDF_BYTES) {
    await response.body?.cancel().catch(() => {});
    return null;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_PDF_BYTES) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const pdf = Buffer.concat(chunks, size);
  return pdf.subarray(0, 5).toString() === "%PDF-" ? pdf.toString("base64") : null;
}
