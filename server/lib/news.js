// Headlines from public RSS feeds (Google News, MarketWatch, Yahoo Finance).
import { cached, getText, xmlBlocks, xmlVal, pool, decodeEntities } from './net.js';

const g = (q, gl = 'US', hl = 'en-US') =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${gl}:${hl.split('-')[0]}`;

export const REGIONS = {
  'for-you': { label: 'For You', feeds: ['https://feeds.content.dowjones.io/public/rss/mw_topstories', g('stock market when:1d'), g('federal reserve OR inflation OR earnings when:1d')] },
  us: { label: 'United States', feeds: [g('US economy stocks when:1d'), 'https://feeds.content.dowjones.io/public/rss/mw_marketpulse'] },
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

const tagTickers = (items, tickers) => {
  const set = new Set(tickers);
  for (const i of items) {
    const found = new Set((i.title.match(/\$?\b[A-Z]{2,5}\b/g) || []).map((x) => x.replace('$', '')).filter((x) => set.has(x)));
    if (i.ticker) found.add(i.ticker);
    i.tickers = [...found];
  }
  return items;
};

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

export async function tickerNews(t) {
  t = t.toUpperCase();
  const clean = t.replace(/^\^/, '');
  const items = await feed(g(`"${clean}" stock when:7d`)).catch(() =>
    feed(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(t)}&region=US&lang=en-US`),
  );
  return items.sort((a, b) => b.at - a.at).map((i) => ({ ...i, ticker: t }));
}
