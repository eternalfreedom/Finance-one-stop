// SEC EDGAR helpers: ticker map, SIC -> sector, and CUSIP -> ticker (OpenFIGI).
import { cached, getJSON, diskLoad, diskSave, fetchRaw } from './net.js';

export const SECTORS = [
  'Technology', 'Financial Services', 'Healthcare', 'Consumer Cyclical', 'Industrials',
  'Communication Services', 'Consumer Defensive', 'Energy', 'Basic Materials', 'Real Estate', 'Utilities',
];

export function sicToSector(sicRaw) {
  const s = Number(sicRaw);
  if (!s) return null;
  const r = (a, b) => s >= a && s <= b;
  if (r(100, 999)) return 'Consumer Defensive';
  if (r(1300, 1399)) return 'Energy';
  if (r(1000, 1499)) return 'Basic Materials';
  if (r(1500, 1799)) return 'Industrials';
  if (r(2000, 2199)) return 'Consumer Defensive';
  if (r(2200, 2399) || r(2500, 2599) || r(3100, 3199)) return 'Consumer Cyclical';
  if (r(2400, 2499) || r(2600, 2699)) return 'Basic Materials';
  if (r(2700, 2799)) return 'Communication Services';
  if (r(2830, 2836)) return 'Healthcare';
  if (r(2840, 2844)) return 'Consumer Defensive';
  if (r(2800, 2899)) return 'Basic Materials';
  if (r(2900, 2999)) return 'Energy';
  if (r(3000, 3399)) return 'Basic Materials';
  if (r(3570, 3579) || r(3600, 3629) || r(3640, 3699) || s === 3559) return 'Technology';
  if (r(3630, 3639)) return 'Consumer Cyclical';
  if (r(3711, 3716) || r(3750, 3751)) return 'Consumer Cyclical';
  if (r(3400, 3799)) return 'Industrials';
  if (s === 3812) return 'Industrials';
  if (r(3840, 3851)) return 'Healthcare';
  if (r(3800, 3899)) return 'Technology';
  if (r(3900, 3999)) return 'Consumer Cyclical';
  if (r(4000, 4799)) return 'Industrials';
  if (r(4800, 4899)) return 'Communication Services';
  if (r(4900, 4999)) return 'Utilities';
  if (s === 5122 || s === 5912) return 'Healthcare';
  if (r(5140, 5149) || r(5400, 5499)) return 'Consumer Defensive';
  if (r(5000, 5199)) return 'Industrials';
  if (r(5200, 5999)) return 'Consumer Cyclical';
  if (s === 6798 || r(6500, 6599)) return 'Real Estate';
  if (r(6000, 6799)) return 'Financial Services';
  if (r(7370, 7379)) return 'Technology';
  if (r(7800, 7999)) return 'Communication Services';
  if (r(7000, 7299)) return 'Consumer Cyclical';
  if (r(8000, 8099)) return 'Healthcare';
  if (r(8200, 8299)) return 'Consumer Defensive';
  return 'Industrials';
}

// ---- ticker map ----
export function normName(n = '') {
  return n
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/\b(the|inc|incorporated|corp|corporation|co|company|ltd|limited|plc|llc|lp|l\.p|n\.v|nv|sa|ag|se|holdings?|group|class [a-c]|cl [a-c]|com|new|del|ord|shs|adr|sponsored|ads|common stock|stock)\b\.?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export async function tickerMap() {
  return cached('sec:tickers', 24 * 3600e3, async () => {
    const raw = await getJSON('https://www.sec.gov/files/company_tickers.json');
    const byTicker = {};
    const byName = {};
    for (const r of Object.values(raw)) {
      byTicker[r.ticker] = { cik: r.cik_str, title: r.title };
      const n = normName(r.title);
      if (n && !byName[n]) byName[n] = r.ticker; // first = most prominent share class
    }
    return { byTicker, byName };
  });
}

export async function companyName(ticker) {
  const m = await tickerMap().catch(() => null);
  return m?.byTicker[ticker]?.title || '';
}

// ---- sector lookups (SIC via submissions endpoint), SIC codes persisted to disk ----
const sicCache = diskLoad('sic.json', {});
const sectorPending = new Map();
// SIC codes too broad to infer what a company does (business services, blank checks)
export const isBroadSic = (ticker) => [7389, 6770, 9995, 8900].includes(sicCache[ticker?.toUpperCase()]);
export async function sectorFor(ticker) {
  if (!ticker) return null;
  ticker = ticker.toUpperCase();
  if (ticker in sicCache) return sicToSector(sicCache[ticker]);
  if (sectorPending.has(ticker)) return sectorPending.get(ticker);
  const p = (async () => {
    try {
      const m = await tickerMap();
      const e = m.byTicker[ticker] || m.byTicker[ticker.replace('.', '-')];
      if (!e) {
        sicCache[ticker] = null;
        return null;
      }
      const sub = await getJSON(`https://data.sec.gov/submissions/CIK${String(e.cik).padStart(10, '0')}.json`);
      sicCache[ticker] = Number(sub.sic) || null;
      diskSave('sic.json', sicCache);
      return sicToSector(sicCache[ticker]);
    } catch {
      return null;
    } finally {
      sectorPending.delete(ticker);
    }
  })();
  sectorPending.set(ticker, p);
  return p;
}

// ---- CUSIP -> ticker via OpenFIGI, persisted ----
const figi = diskLoad('cusip.json', {});
export async function cusipsToTickers(cusips, nameHints = {}) {
  const todo = [...new Set(cusips)].filter((c) => !(c in figi));
  const per = process.env.OPENFIGI_API_KEY ? 100 : 10;
  for (let i = 0; i < todo.length; i += per) {
    const batch = todo.slice(i, i + per);
    try {
      const res = await fetchRaw('https://api.openfigi.com/v3/mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.OPENFIGI_API_KEY ? { 'X-OPENFIGI-APIKEY': process.env.OPENFIGI_API_KEY } : {}),
        },
        body: JSON.stringify(batch.map((c) => ({ idType: 'ID_CUSIP', idValue: c }))),
      });
      const out = await res.json();
      out.forEach((r, j) => {
        const rows = r.data || [];
        const us = rows.find((x) => x.exchCode === 'US') || rows[0];
        figi[batch[j]] = us ? us.ticker.replace('/', '.') : null;
      });
      diskSave('cusip.json', figi);
    } catch (e) {
      if (e.status === 429) break; // try again next cycle
    }
  }
  // fall back to name matching for anything OpenFIGI couldn't resolve
  const m = await tickerMap().catch(() => null);
  const result = {};
  for (const c of cusips) {
    let t = figi[c];
    if (!t && m && nameHints[c]) t = m.byName[normName(nameHints[c])] || null;
    result[c] = t || null;
  }
  return result;
}
