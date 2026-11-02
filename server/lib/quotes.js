// Prices: Yahoo Finance chart endpoint (no key) with optional Finnhub fallback.
import { cached, getJSON, pool } from './net.js';

const FINNHUB = process.env.FINNHUB_API_KEY;
export const INDEXES = [
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^IXIC', label: 'Nasdaq' },
  { symbol: '^DJI', label: 'Dow' },
  { symbol: '^RUT', label: 'Russell 2K' },
  { symbol: '^VIX', label: 'VIX' },
  { symbol: '^TNX', label: '10Y Yield' },
  { symbol: 'CL=F', label: 'Crude' },
  { symbol: 'GC=F', label: 'Gold' },
  { symbol: 'BTC-USD', label: 'Bitcoin' },
];

const yahooSym = (s) => s.replace(/\./g, '-').replace(/^BRK-B$/, 'BRK-B');

async function yahooChart(sym, range, interval) {
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
  let lastErr;
  for (const h of hosts) {
    try {
      const j = await getJSON(
        `https://${h}/v8/finance/chart/${encodeURIComponent(yahooSym(sym))}?range=${range}&interval=${interval}&includePrePost=false`,
        { timeout: 10000 },
      );
      const r = j?.chart?.result?.[0];
      if (!r) throw new Error('no chart result');
      return r;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function finnhubQuote(sym) {
  const q = await getJSON(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${FINNHUB}`);
  if (!q || !q.c) throw new Error('finnhub empty');
  return { symbol: sym, price: q.c, prevClose: q.pc, change: q.c - q.pc, changePct: ((q.c - q.pc) / q.pc) * 100, time: q.t * 1000, spark: [], source: 'finnhub' };
}

export async function quote(sym) {
  sym = sym.toUpperCase();
  return cached(`q:${sym}`, 15e3, async () => {
    try {
      const r = await yahooChart(sym, '1d', '5m');
      const m = r.meta;
      const closes = (r.indicators?.quote?.[0]?.close || []).filter((x) => x != null);
      const price = m.regularMarketPrice ?? closes.at(-1);
      const prev = m.chartPreviousClose ?? m.previousClose;
      return {
        symbol: sym,
        name: m.longName || m.shortName || '',
        price,
        prevClose: prev,
        change: price - prev,
        changePct: prev ? ((price - prev) / prev) * 100 : 0,
        time: (m.regularMarketTime || 0) * 1000,
        currency: m.currency,
        spark: closes.filter((_, i) => i % 3 === 0),
        source: 'yahoo',
      };
    } catch (e) {
      if (FINNHUB && !sym.includes('^') && !sym.includes('=')) return finnhubQuote(sym);
      throw e;
    }
  });
}

export async function quotes(symbols) {
  const list = [...new Set(symbols.map((s) => s.toUpperCase()))].slice(0, 60);
  const res = await pool(list, 6, (s) => quote(s).catch(() => null));
  const out = {};
  list.forEach((s, i) => res[i] && (out[s] = res[i]));
  return out;
}

// Daily closes for the last year: [{t, c}]
export async function history(sym, range = '1y') {
  sym = sym.toUpperCase();
  return cached(`h:${sym}:${range}`, 6 * 3600e3, async () => {
    const r = await yahooChart(sym, range, range === '5d' ? '30m' : '1d');
    const ts = r.timestamp || [];
    const cl = r.indicators?.quote?.[0]?.close || [];
    return ts.map((t, i) => ({ t: t * 1000, c: cl[i] })).filter((p) => p.c != null);
  });
}

// Close on/after a given date (ms) from a history series.
export function priceAt(series, when) {
  if (!series?.length) return null;
  for (const p of series) if (p.t >= when - 12 * 3600e3) return p.c;
  return null;
}
export function peakBefore(series, when, days = 90) {
  const from = when - days * 864e5;
  let max = null;
  for (const p of series || []) if (p.t >= from && p.t <= when + 864e5) max = Math.max(max ?? -Infinity, p.c);
  return max;
}

export async function indexes() {
  const q = await quotes(INDEXES.map((i) => i.symbol));
  return INDEXES.map((i) => ({ ...i, ...(q[i.symbol] || {}) }));
}
