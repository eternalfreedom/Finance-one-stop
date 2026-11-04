// Social sentiment: StockTwits (trending + message sentiment) and Reddit mention counts via ApeWisdom.
import { cached, getJSON, pool, decodeEntities } from './net.js';
import { tickerNews } from './news.js';

const stOff = () => {
  if (process.env.STOCKTWITS === 'off') throw Object.assign(new Error('turned off (STOCKTWITS=off)'), { status: null });
};

export async function stocktwitsSymbol(sym) {
  stOff();
  sym = sym.toUpperCase();
  return cached(`st:sym:${sym}`, 5 * 60e3, async () => {
    const j = await getJSON(`https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(sym)}.json`);
    const msgs = j.messages || [];
    let bull = 0, bear = 0;
    for (const m of msgs) {
      const s = m.entities?.sentiment?.basic;
      if (s === 'Bullish') bull++;
      else if (s === 'Bearish') bear++;
    }
    const n = msgs.length || 1;
    return {
      symbol: sym,
      title: j.symbol?.title,
      logo: j.symbol?.logo_url,
      watchers: j.symbol?.watchlist_count,
      bullish: bull / n,
      bearish: bear / n,
      sample: msgs.length,
      messages: msgs.slice(0, 20).map((m) => ({
        id: m.id,
        body: decodeEntities(m.body),
        at: m.created_at,
        user: m.user?.username,
        sentiment: m.entities?.sentiment?.basic || null,
        likes: m.likes?.total || 0,
      })),
    };
  });
}

export async function stocktwitsTrending() {
  stOff();
  return cached('st:trending', 5 * 60e3, async () => {
    const j = await getJSON('https://api.stocktwits.com/api/2/trending/symbols.json');
    const syms = (j.symbols || []).filter((s) => s.instrument_class !== 'Crypto' || true).slice(0, 20);
    const sentiments = await pool(syms.slice(0, 12), 2, (s) => stocktwitsSymbol(s.symbol).catch(() => null));
    return syms.map((s, i) => ({
      symbol: s.symbol,
      title: s.title,
      logo: s.logo_url,
      sector: s.sector,
      industry: s.industry,
      cls: s.instrument_class,
      rank: s.rank,
      score: s.trending_score,
      watchers: s.watchlist_count,
      summary: s.trends?.summary || '',
      summaryAt: s.trends?.summary_at,
      bullish: sentiments[i]?.bullish ?? null,
      bearish: sentiments[i]?.bearish ?? null,
      sample: sentiments[i]?.sample ?? null,
    }));
  });
}

export const REDDIT_FILTERS = ['all-stocks', 'wallstreetbets', 'stocks', 'investing', 'options', 'SPACs'];

export async function reddit(filter = 'all-stocks') {
  if (!REDDIT_FILTERS.includes(filter)) filter = 'all-stocks';
  return cached(`ape:${filter}`, 5 * 60e3, async () => {
    const pages = await pool([1, 2], 2, (p) => getJSON(`https://apewisdom.io/api/v1.0/filter/${filter}/page/${p}`));
    const rows = pages.flatMap((p) => p?.results || []).map((r) => ({
      ticker: r.ticker,
      name: decodeEntities(r.name),
      rank: r.rank,
      prevRank: r.rank_24h_ago,
      mentions: Number(r.mentions),
      prevMentions: Number(r.mentions_24h_ago) || 0,
      upvotes: Number(r.upvotes),
      delta: r.mentions_24h_ago ? ((r.mentions - r.mentions_24h_ago) / r.mentions_24h_ago) * 100 : null,
    }));
    const risers = rows
      .filter((r) => r.mentions >= 10 && r.prevMentions > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 12);
    return { filter, leaderboard: rows.slice(0, 50), risers };
  });
}

// Trending board: StockTwits when reachable (it blocks some networks with HTTP 403),
// otherwise Reddit mention surges with the latest headline as the "why".
export async function trending() {
  try {
    return { source: 'stocktwits', items: await stocktwitsTrending() };
  } catch (e) {
    return cached('trending:fallback', 5 * 60e3, async () => {
      const r = await reddit('all-stocks');
      const pick = [...r.leaderboard]
        .filter((x) => x.mentions >= 15 && !['SPY', 'QQQ', 'IWM', 'DIA'].includes(x.ticker))
        .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))
        .slice(0, 12);
      const news = await pool(pick, 3, (x) => tickerNews(x.ticker, x.name).catch(() => []));
      return {
        source: 'reddit',
        notice: `StockTwits is unavailable from this server (${e.status ? 'HTTP ' + e.status : e.message}), so this board uses Reddit mention surges and the latest headline for each stock.`,
        items: pick.map((x, i) => {
          const n = (news[i] || [])[0];
          return {
            symbol: x.ticker,
            title: x.name,
            rank: x.rank,
            mentions: x.mentions,
            delta: x.delta,
            summary: n ? `${n.title} (${n.source})` : '',
            link: n?.link || null,
            bullish: null,
            bearish: null,
            sample: null,
          };
        }),
      };
    });
  }
}
