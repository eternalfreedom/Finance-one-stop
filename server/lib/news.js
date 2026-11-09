// Headlines from public RSS feeds (Google News, MarketWatch, Yahoo Finance).
import { cached, getText, xmlBlocks, xmlVal, pool, decodeEntities } from './net.js';
import { tickerMap, normName } from './sec.js';

const g = (q, gl = 'US', hl = 'en-US') =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl.split('-')[0]}`;

const BUSINESS = 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en';
export const REGIONS = {
  'for-you': { label: 'For You', feeds: ['https://feeds.content.dowjones.io/public/rss/mw_topstories', BUSINESS, g('stock market when:1d')] },
  us: { label: 'United States', feeds: [BUSINESS, 'https://feeds.content.dowjones.io/public/rss/mw_marketpulse', 'https://feeds.content.dowjones.io/public/rss/RSSMarketsMain'] },
  china: { label: 'China', feeds: [g('China economy OR yuan OR "Hang Seng" when:2d')] },
  japan: { label: 'Japan', feeds: [g('Japan economy OR Nikkei OR yen OR "Bank of Japan" when:2d')] },
  europe: { label: 'Europe', feeds: [g('ECB OR "European stocks" OR eurozone economy when:2d')] },
  crypto: { label: 'Crypto', feeds: [g('bitcoin OR crypto market when:1d')] },
};

const IMPORTANT = /\b(fed|federal reserve|rate (cut|hike)|cpi|inflation|jobs report|payrolls|gdp|recession|tariff|sanction|war|strike|opec|oil|default|bankrupt|crash|plunge|surge|record high|ecb|boj|pboc|treasury yields?|downgrade)\b/i;

function parseFeed(xml, feedUrl) {
  const channelTitle = xmlVal(xml, 'title');
  return xmlBlocks(xml, 'item').map((it) => {
    let title = decodeEntities(xmlVal(it, 'title')).replace(/<[^>]+>/g, '');
    let source = decodeEntities(xmlVal(it, 'source')) || channelTitle.replace(/^"|"$/g, '');
    // Google News titles end with " - Publisher"
    const dash = title.lastIndexOf(' - ');
    if (feedUrl.includes('news.google.com') && dash > 20) {
      source = title.slice(dash + 3);
      title = title.slice(0, dash);
    }
    const img = (/<media:content[^>]+url="([^"]+)"/.exec(it) || /<enclosure[^>]+url="([^"]+)"/.exec(it) || [])[1] || null;
    const desc = decodeEntities(xmlVal(it, 'description')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return {
      title,
      link: decodeEntities(xmlVal(it, 'link')),
      at: Date.parse(xmlVal(it, 'pubDate')) || Date.now(),
      source: source.replace(/^MarketWatch.*$/i, 'MarketWatch'),
      image: img,
      summary: desc && !feedUrl.includes('news.google.com') ? desc.slice(0, 260) : '',
      important: IMPORTANT.test(title),
    };
  });
}

async function feed(url) {
  return cached(`rss:${url}`, 5 * 60e3, async () => parseFeed(await getText(url), url));
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((i) => {
    const k = i.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ---------- categories ----------
export const CATEGORIES = ['Markets', 'Economy', 'Earnings', 'Company', 'Deals', 'Policy', 'Commodities', 'Crypto'];
const CAT_RULES = [
  ['Earnings', /\b(earnings|quarterly|q[1-4]|profits?|revenue|results|guidance|beats? (estimates|expectations)|miss(es)? (estimates|expectations)|eps)\b/i],
  ['Deals', /\b(acquir|acquisition|merger|merge|buyout|takeover|to buy|to sell|stake|deal|ipo|spin[- ]?off|bid for|agrees to)\b/i],
  ['Crypto', /\b(bitcoin|crypto|ether(eum)?|stablecoin|token(ized)?|blockchain|solana|avalanche)\b/i],
  ['Commodities', /\b(oil|crude|opec|gold|silver|copper|natural gas|wheat|brent|commodity|commodities)\b/i],
  ['Economy', /\b(cpi|inflation|jobs|payrolls|unemployment|jobless|gdp|recession|consumer (spending|confidence|sentiment)|retail sales|housing|home (sales|prices)|mortgage|fed\b|federal reserve|rate cut|rate hike|interest rates?|ecb|boj|pboc|central bank|wages|economy|economic|hiring)/i],
  ['Policy', /\b(fda|tariff|sanction|congress|senate|white house|trump|biden|election|regulat|sec\b|lawsuit|antitrust|ban|government|treasury secretary|bill\b|legislat|court)/i],
  ['Markets', /\b(dollar|yen|euro|currenc|stocks?|s&p|dow|nasdaq|wall street|futures|rally|sell-?off|index|indices|shares|yields?|treasur|bonds?|vix|market)/i],
];
export function categorize(title) {
  for (const [c, re] of CAT_RULES) if (re.test(title)) return c;
  return 'Company';
}

// ---------- ticker detection ----------
// Words that are company names but also common headline words
const AMBIGUOUS = new Set(('dow nasdaq america americas january february march april june july august september october november december monday tuesday wednesday thursday friday saturday sunday jan feb mar apr jun jul aug sep sept oct nov dec target block visa general american united first national international global capital financial energy bank home public realty digital data health life live new south north west east royal gold golden standard best shell ford state street union main core prime pacific atlantic central southern northern western eastern federal mid key fair premier summit pioneer apollo carrier booking match snap square ball dollar sun alpha delta progressive peoples citizens regions arch eagle liberty patriot heritage frontier vista pilgrim pool lumen gap nov amp workday chewy dutch bros oracle intuitive tapestry otis ally mobile service equity trust select advanced applied axon unity masco southwest sealed kellanova constellation sempra entergy eversource cardinal agilent illumina lennar pulte meta').split(' '));
let nameIndex = null;
async function getNameIndex() {
  if (nameIndex) return nameIndex;
  const m = await tickerMap();
  const top = Object.entries(m.byTicker).slice(0, 1500); // file is ordered by market value
  const first = {}, full = {};
  for (const [t, v] of top) {
    if (/[^A-Z.]/.test(t)) continue;
    const n = normName(v.title);
    if (!n) continue;
    if (!full[n]) full[n] = t;
    const w = n.split(' ')[0];
    if (w.length >= 4 && !AMBIGUOUS.has(w)) first[w] = first[w] === undefined ? t : first[w] === t ? t : null; // null = ambiguous
  }
  Object.assign(first, { google: 'GOOGL', alphabet: 'GOOGL', facebook: 'META', meta: 'META', nvidia: 'NVDA', tesla: 'TSLA', microsoft: 'MSFT', amazon: 'AMZN', apple: 'AAPL', netflix: 'NFLX', oracle: 'ORCL', spacex: null, openai: null, anthropic: null, walmart: 'WMT', "mcdonald's": 'MCD', mcdonalds: 'MCD', disney: 'DIS', boeing: 'BA', intel: 'INTC', broadcom: 'AVGO', 'coca-cola': 'KO', pepsico: 'PEP', jpmorgan: 'JPM', goldman: 'GS', 'morgan stanley': 'MS', berkshire: 'BRK.B', palantir: 'PLTR', uber: 'UBER', starbucks: 'SBUX', nike: 'NKE', costco: 'COST', zillow: 'Z', target: null });
  nameIndex = { first, full, tickers: new Set(Object.keys(m.byTicker)) };
  return nameIndex;
}
const MACRO = [
  [/\b(oil|crude|opec|brent)\b/i, 'CL=F'],
  [/\bgold\b/i, 'GC=F'],
  [/\b(bitcoin|crypto)\b/i, 'BTC-USD'],
  [/\b(cpi|inflation|treasur(y|ies)|bond yields?|10-year|fed\b|federal reserve|rate cut|rate hike)/i, 'TLT'],
  [/\b(nikkei)\b/i, '^N225'],
  [/\b(hang seng)\b/i, '^HSI'],
  [/\b(s&p 500|s&p|wall street|stocks? (rally|fall|slide|rise|close|leap|surge)|dow|nasdaq)\b/i, 'SPY'],
];
async function tagTickers(items, watchlist) {
  const wl = new Set(watchlist);
  const idx = await getNameIndex().catch(() => ({ first: {}, full: {} }));
  for (const i of items) {
    const found = [];
    const add = (t) => t && !found.includes(t) && found.push(t);
    if (i.ticker) add(i.ticker);
    // explicit tickers: $NVDA, (NASDAQ: NVDA), (NVDA)
    for (const m of i.title.matchAll(/\$([A-Z]{1,5})\b|\((?:NYSE|NASDAQ|Nasdaq|NYSEARCA|AMEX)\s*:\s*([A-Z.]{1,6})\)|\(([A-Z]{2,5})\)/g)) {
      const t = m[1] || m[2] || m[3];
      if (m[2] || idx.tickers?.has(t)) add(t);
    }
    for (const m of i.title.matchAll(/\b[A-Z]{2,5}\b/g)) if (wl.has(m[0]) && !AMBIGUOUS.has(m[0].toLowerCase())) add(m[0]);
    // company names written in the headline (must be capitalised)
    for (const m of i.title.matchAll(/\b([A-Z][A-Za-z'&.-]{2,}(?:\s[A-Z][a-z]+)?)/g)) {
      const words = m[1].toLowerCase().split(' ').map((w) => w.replace(/['’]s$/, ''));
      if (AMBIGUOUS.has(words[0]) && words.length === 1) continue;
      const t = idx.full[normName(words.join(' '))] || idx.first[words.join(' ')] || (AMBIGUOUS.has(words[0]) ? null : idx.first[words[0]]);
      if (t) add(t);
      if (found.length >= 2) break;
    }
    if (found.length < 2) for (const [re, t] of MACRO) if (re.test(i.title)) { add(t); break; }
    i.tickers = found.slice(0, 2);
    i.category = categorize(i.title);
  }
  return items;
}

export async function headlines(region = 'for-you', watchlist = []) {
  const r = REGIONS[region] || REGIONS['for-you'];
  const lists = await pool(r.feeds, 3, (u) => feed(u).catch(() => []));
  let items = lists.flat();
  if (region === 'for-you' && watchlist.length) {
    const wl = await pool(watchlist.slice(0, 10), 3, (t) => tickerNews(t).catch(() => []));
    items = items.concat(wl.flat().slice(0, 40).map((i) => ({ ...i, watchlist: true })));
  }
  items = dedupe(items.sort((a, b) => b.at - a.at)).slice(0, 120);
  return tagTickers(items, watchlist);
}

export async function tickerNews(t, name = '') {
  t = t.toUpperCase();
  const clean = t.replace(/^\^/, '');
  const short = String(name)
    .replace(/&amp;/g, '&')
    .replace(/\b(inc|corp|corporation|co|ltd|plc|holdings?|class [a-c]|the|etf|trust)\b\.?/gi, '')
    .replace(/[^A-Za-z0-9& .-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const q = short ? `"${short}" OR "${clean}" stock when:7d` : `"${clean}" stock when:7d`;
  let items = await feed(g(q)).catch(() =>
    feed(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(t)}&region=US&lang=en-US`),
  );
  // keep headlines that actually mention the company or ticker
  const word = short.split(' ')[0]?.toLowerCase();
  const relevant = items.filter((i) => i.title.includes(clean) || (word && word.length > 2 && i.title.toLowerCase().includes(word)));
  if (relevant.length) items = relevant;
  return items.sort((a, b) => b.at - a.at).map((i) => ({ ...i, ticker: t }));
}
