// Dashboard engines: market status, snapshot, computed Fear & Greed, valuation (CAPE),
// economic + earnings calendars, and data-driven market trends.
import { cached, getJSON, getText, pool } from './net.js';
import { indexes, history, quotes } from './quotes.js';
import { headlines } from './news.js';

// ---------- market status (NYSE hours, America/New_York) ----------
const HOLIDAYS = new Set([
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24',
]);
function nyParts(d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { ymd: `${p.year}-${p.month}-${p.day}`, mins: (Number(p.hour) % 24) * 60 + Number(p.minute), weekday: p.weekday };
}
export function marketStatus(d = new Date()) {
  const { ymd, mins, weekday } = nyParts(d);
  if (weekday === 'Sat' || weekday === 'Sun') return { state: 'closed', label: 'Weekend' };
  if (HOLIDAYS.has(ymd)) return { state: 'closed', label: 'Market holiday' };
  if (mins >= 240 && mins < 570) return { state: 'pre', label: 'Pre-Market' };
  if (mins >= 570 && mins < 960) return { state: 'open', label: 'Market Open' };
  if (mins >= 960 && mins < 1200) return { state: 'post', label: 'Post-Market' };
  return { state: 'closed', label: 'Market Closed' };
}

// ---------- computed Fear & Greed (modelled on CNN's seven-signal method) ----------
const SECTOR_ETFS = { Technology: 'XLK', 'Financial Services': 'XLF', Healthcare: 'XLV', 'Consumer Cyclical': 'XLY', Industrials: 'XLI', 'Communication Services': 'XLC', 'Consumer Defensive': 'XLP', Energy: 'XLE', 'Basic Materials': 'XLB', 'Real Estate': 'XLRE', Utilities: 'XLU' };

const sma = (arr, i, n) => {
  if (i < n - 1) return null;
  let s = 0;
  for (let k = i - n + 1; k <= i; k++) s += arr[k];
  return s / n;
};
// align several daily series on common dates
function align(seriesMap) {
  const maps = Object.fromEntries(Object.entries(seriesMap).map(([k, s]) => [k, new Map(s.map((p) => [new Date(p.t).toISOString().slice(0, 10), p.c]))]));
  const keys = Object.keys(maps);
  const dates = [...maps[keys[0]].keys()].filter((d) => keys.every((k) => maps[k].has(d))).sort();
  return { dates, cols: Object.fromEntries(keys.map((k) => [k, dates.map((d) => maps[k].get(d))])) };
}
const pctRank = (arr, v) => (arr.filter((x) => x != null && x <= v).length / Math.max(1, arr.filter((x) => x != null).length)) * 100;
export const fgLabel = (v) => (v < 25 ? 'Extreme Fear' : v < 45 ? 'Fear' : v <= 55 ? 'Neutral' : v <= 75 ? 'Greed' : 'Extreme Greed');

export async function fearGreed() {
  return cached('dash:fg', 30 * 60e3, async () => {
    const syms = ['^GSPC', '^VIX', 'SPY', 'TLT', 'HYG', 'IEF', ...Object.values(SECTOR_ETFS)];
    const hs = await pool(syms, 4, (s) => history(s, '2y'));
    const data = Object.fromEntries(syms.map((s, i) => [s, hs[i] || []]));
    if (!data['^GSPC'].length || !data['^VIX'].length) throw new Error('no history');
    const { dates, cols } = align(data);
    const n = dates.length;
    const spx = cols['^GSPC'], vix = cols['^VIX'];
    const comp = { momentum: [], strength: [], breadth: [], volatility: [], safeHaven: [], junk: [] };
    for (let i = 0; i < n; i++) {
      const ma125 = sma(spx, i, 125);
      comp.momentum.push(ma125 ? spx[i] / ma125 - 1 : null);
      // position within trailing 52-week range (proxy for new highs vs lows)
      if (i >= 250) {
        const win = spx.slice(i - 250, i + 1);
        const lo = Math.min(...win), hi = Math.max(...win);
        comp.strength.push((spx[i] - lo) / (hi - lo || 1));
      } else comp.strength.push(null);
      // breadth: share of sector ETFs above their 50-day average
      let above = 0, tot = 0;
      for (const e of Object.values(SECTOR_ETFS)) {
        const m = sma(cols[e], i, 50);
        if (m) {
          tot++;
          if (cols[e][i] > m) above++;
        }
      }
      comp.breadth.push(tot ? above / tot : null);
      const v50 = sma(vix, i, 50);
      comp.volatility.push(v50 ? -(vix[i] / v50 - 1) : null); // lower VIX vs average = greed
      comp.safeHaven.push(i >= 20 ? cols.SPY[i] / cols.SPY[i - 20] - cols.TLT[i] / cols.TLT[i - 20] : null);
      comp.junk.push(i >= 20 ? cols.HYG[i] / cols.HYG[i - 20] - cols.IEF[i] / cols.IEF[i - 20] : null);
    }
    const LABELS = { momentum: 'S&P 500 vs 125-day average', strength: 'S&P 500 within 52-week range', breadth: 'Sectors above 50-day average', volatility: 'VIX vs 50-day average', safeHaven: 'Stocks vs Treasuries (20d)', junk: 'Junk vs safe bonds (20d)' };
    const scoreAt = (i) => {
      const parts = {};
      for (const [k, arr] of Object.entries(comp)) {
        const hist = arr.slice(Math.max(0, i - 252), i + 1);
        if (arr[i] != null) parts[k] = pctRank(hist, arr[i]);
      }
      const vals = Object.values(parts);
      return { score: vals.reduce((a, b) => a + b, 0) / (vals.length || 1), parts };
    };
    const now = scoreAt(n - 1);
    const at = (back) => (n - 1 - back >= 260 ? Math.round(scoreAt(n - 1 - back).score) : null);
    return {
      score: Math.round(now.score),
      label: fgLabel(now.score),
      components: Object.entries(now.parts).map(([k, v]) => ({ key: k, label: LABELS[k], score: Math.round(v), rating: fgLabel(v) })),
      previousClose: at(1),
      weekAgo: at(5),
      monthAgo: at(21),
      asOf: dates[n - 1],
      method: 'Average of six market signals, each ranked against its own past year (0 = most fearful, 100 = most greedy).',
    };
  });
}

// ---------- valuation: Shiller CAPE percentile since 1881 ----------
export async function valuation() {
  return cached('dash:cape', 12 * 3600e3, async () => {
    const html = await getText('https://www.multpl.com/shiller-pe/table/by-month');
    const rows = [...html.matchAll(/<td>([A-Z][a-z]{2} \d{1,2}, \d{4})<\/td>\s*<td>\s*(?:&#x2002;)?\s*([\d.]+)/g)].map((m) => ({ date: m[1], value: Number(m[2]) }));
    if (rows.length < 100) throw new Error('could not parse CAPE table');
    const cur = rows[0];
    const vals = rows.map((r) => r.value);
    const pctile = pctRank(vals, cur.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const label = pctile >= 95 ? 'Extreme' : pctile >= 80 ? 'Expensive' : pctile >= 60 ? 'Elevated' : pctile >= 30 ? 'Fair' : 'Bargain';
    return { cape: cur.value, date: cur.date, percentile: Math.round(pctile), mean: +mean.toFixed(1), label, max: Math.max(...vals), source: 'multpl.com (Shiller CAPE, monthly since 1881)' };
  });
}

// ---------- snapshot: one-line market headline + summary + top stories ----------
const fmtPct = (v) => `${Math.abs(v).toFixed(Math.abs(v) >= 10 ? 0 : 1)}%`;
export async function snapshot() {
  return cached('dash:snapshot', 60e3, async () => {
    const [idx, news] = await Promise.all([indexes(), headlines('us').catch(() => [])]);
    const by = Object.fromEntries(idx.map((i) => [i.symbol, i]));
    const status = marketStatus();
    const spx = by['^GSPC'], ndx = by['^IXIC'], vix = by['^VIX'];
    const closed = status.state === 'post' || status.state === 'closed';
    let headline = 'Markets data loading';
    const summary = [];
    if (spx?.changePct != null) {
      const up = spx.changePct >= 0;
      const verb = status.state === 'pre' ? (up ? 'futures point higher' : 'futures point lower') : closed ? `closes ${up ? 'up' : 'down'} ${fmtPct(spx.changePct)}` : `${up ? 'up' : 'down'} ${fmtPct(spx.changePct)}`;
      headline = `S&P ${verb}`;
      // most notable side move, scaled by how unusual it is for that asset
      const side = [
        ['^VIX', 'fear gauge', 5],
        ['CL=F', 'oil', 2],
        ['GC=F', 'gold', 1.5],
        ['BTC-USD', 'Bitcoin', 3],
        ['^TNX', '10-year yield', 2],
        ['^IXIC', 'Nasdaq', 1.5],
      ]
        .map(([s, name, typ]) => ({ name, chg: by[s]?.changePct, z: Math.abs(by[s]?.changePct || 0) / typ }))
        .filter((x) => x.chg != null && x.z >= 1)
        .sort((a, b) => b.z - a.z)[0];
      if (side) headline += ` as ${side.name} ${side.chg >= 0 ? (side.name === 'fear gauge' ? 'jumps' : 'rises') : side.name === 'fear gauge' ? 'sinks' : 'falls'} ${fmtPct(side.chg)}`;
      summary.push(`The S&P 500 ${up ? 'rose' : 'fell'} ${fmtPct(spx.changePct)}${ndx?.changePct != null ? ` and the Nasdaq ${ndx.changePct >= 0 ? 'rose' : 'fell'} ${fmtPct(ndx.changePct)}` : ''}.`);
      if (vix?.changePct != null && Math.abs(vix.changePct) >= 3) summary.push(`The VIX fear gauge ${vix.changePct >= 0 ? 'jumped' : 'dropped'} ${fmtPct(vix.changePct)}.`);
      const oil = by['CL=F'];
      if (oil?.changePct != null && Math.abs(oil.changePct) >= 1.5) summary.push(`Oil ${oil.changePct >= 0 ? 'rose' : 'fell'} ${fmtPct(oil.changePct)}.`);
      const btc = by['BTC-USD'];
      if (btc?.changePct != null && Math.abs(btc.changePct) >= 2.5) summary.push(`Bitcoin ${btc.changePct >= 0 ? 'gained' : 'lost'} ${fmtPct(btc.changePct)}.`);
    }
    const since = Date.now() - 30 * 3600e3;
    const top = news.filter((n) => n.at >= since);
    const bullets = [...top.filter((n) => n.important), ...top.filter((n) => !n.important)].slice(0, 5).map((n) => ({ title: n.title, link: n.link, category: n.category, at: n.at }));
    return {
      status,
      headline: headline.charAt(0).toUpperCase() + headline.slice(1),
      summary: summary.join(' '),
      tiles: ['^VIX', 'SPY', 'BTC-USD'].map((s) => by[s] || { symbol: s }),
      bullets,
      updatedAt: Date.now(),
    };
  });
}

// ---------- calendars ----------
const isoNY = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
export async function economicCalendar() {
  return cached('dash:econ', 3 * 3600e3, async () => {
    const weeks = await pool(['thisweek', 'nextweek'], 2, (w) => getJSON(`https://nfs.faireconomy.media/ff_calendar_${w}.json`).catch(() => []));
    const today = isoNY(Date.now());
    const rows = weeks
      .flat()
      .filter((e) => e && e.country === 'USD' && isoNY(e.date) >= today)
      .map((e) => ({ title: e.title, at: Date.parse(e.date), day: isoNY(e.date), impact: e.impact, forecast: e.forecast || null, previous: e.previous || null }));
    const byDay = {};
    for (const e of rows) {
      const d = (byDay[e.day] ||= { day: e.day, events: [], fedSpeakers: 0, holiday: null });
      if (e.impact === 'Holiday') d.holiday = e.title;
      else if (/FOMC Member .* Speaks|Fed Chair .* Speaks|Speaks$/.test(e.title)) d.fedSpeakers++;
      else if (!/Auction|Bulletin|Treasury Currency Report|Weekly Employment/.test(e.title) && !d.events.some((x) => x.title === e.title)) d.events.push(e);
    }
    const rank = { High: 0, Medium: 1, Low: 2 };
    for (const d of Object.values(byDay)) d.events = d.events.sort((a, b) => rank[a.impact] - rank[b.impact] || a.at - b.at).slice(0, 6);
    return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)).slice(0, 8);
  });
}

const capNum = (s) => Number(String(s || '').replace(/[$,]/g, '')) || 0;
export async function earningsCalendar() {
  return cached('dash:earn', 3 * 3600e3, async () => {
    const days = [];
    for (let d = 0; days.length < 5 && d < 10; d++) {
      const dt = new Date(Date.now() + d * 864e5);
      const ymd = isoNY(dt);
      const wd = new Date(ymd + 'T12:00:00Z').getUTCDay();
      if (wd === 0 || wd === 6 || HOLIDAYS.has(ymd)) continue;
      days.push(ymd);
    }
    const res = await pool(days, 2, async (ymd) => {
      for (let a = 0; a < 3; a++) {
        try {
          return await getJSON(`https://api.nasdaq.com/api/calendar/earnings?date=${ymd}`);
        } catch {
          await new Promise((r) => setTimeout(r, 1000 * (a + 1)));
        }
      }
      return null;
    });
    if (res.every((r) => !r)) throw new Error('earnings calendar unavailable');
    return days.map((ymd, i) => {
      const rows = (res[i]?.data?.rows || [])
        .map((r) => ({
          symbol: r.symbol,
          name: r.name,
          cap: capNum(r.marketCap),
          time: r.time === 'time-pre-market' ? 'Before open' : r.time === 'time-after-hours' ? 'After close' : 'Time n/a',
          eps: r.epsForecast || null,
        }))
        .sort((a, b) => b.cap - a.cap)
        .filter((r, k, arr) => arr.findIndex((x) => x.name.split(' ')[0] === r.name.split(' ')[0] && x.time === r.time) === k); // drop duplicate share classes
      return { day: ymd, count: rows.length, companies: rows.slice(0, 30) };
    });
  });
}

const dayName = (ymd) => new Date(ymd + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });
export async function upcoming() {
  return cached('dash:upcoming', 30 * 60e3, async () => {
    const [econ, earn] = await Promise.all([economicCalendar().catch(() => []), earningsCalendar().catch(() => [])]);
    const notable = [];
    for (const d of econ) {
      const hi = d.events.filter((e) => e.impact === 'High');
      if (hi.some((e) => /CPI/.test(e.title))) notable.push(`Inflation report (CPI) ${dayName(d.day)}, 8:30 AM ET`);
      else if (hi.some((e) => /Non-Farm|Employment Change|Unemployment Rate/.test(e.title))) notable.push(`Jobs report ${dayName(d.day)}, 8:30 AM ET`);
      else if (hi.some((e) => /FOMC|Federal Funds Rate/.test(e.title))) notable.push(`Fed rate decision ${dayName(d.day)}`);
      else if (hi.some((e) => /PPI/.test(e.title))) notable.push(`Producer prices (PPI) ${dayName(d.day)}, 8:30 AM ET`);
      else if (hi.some((e) => /GDP/.test(e.title))) notable.push(`GDP report ${dayName(d.day)}`);
      else if (hi.some((e) => /Retail Sales/.test(e.title))) notable.push(`Retail sales ${dayName(d.day)}, 8:30 AM ET`);
      if (d.holiday) notable.push(`Bond market closed ${dayName(d.day)} (${HOLIDAYS.has(d.day) ? 'stocks closed too' : 'stocks open'})`);
    }
    const speakerDays = econ.filter((d) => d.fedSpeakers > 0).length;
    if (speakerDays >= 3) notable.push('Fed speakers all week');
    const bigEarn = earn.flatMap((d) => d.companies.slice(0, 1).map((c) => ({ ...c, day: d.day }))).filter((c) => c.cap >= 75e9).slice(0, 3);
    for (const c of bigEarn) notable.push(`${c.name.split(/,| S\.A\.| - | Inc\b| Corp\b| Corporation\b| Systems\b| Holdings?\b| Ltd\b| plc\b/i)[0].trim()} earnings ${dayName(c.day)} ${c.time.toLowerCase()}`);
    return { notable: [...new Set(notable)].slice(0, 7), econ, earnings: earn };
  });
}

// ---------- data-driven market trends ----------
export async function trends({ sectorHistory, congressFlows } = {}) {
  return cached('dash:trends', 3 * 3600e3, async () => {
    const entries = Object.entries(SECTOR_ETFS);
    const hs = await pool(entries, 4, ([, e]) => history(e, '2y'));
    const tnx = await history('^TNX', '1y').catch(() => []);
    const ret = (h, days) => (h?.length > days ? (h.at(-1).c / h.at(-1 - days).c - 1) * 100 : null);
    const rows = entries.map(([s, e], i) => ({ sector: s, etf: e, r3m: ret(hs[i], 63), r12m: ret(hs[i], 252) })).filter((r) => r.r3m != null);
    const by3 = [...rows].sort((a, b) => b.r3m - a.r3m);
    const by12 = [...rows].filter((r) => r.r12m != null).sort((a, b) => b.r12m - a.r12m);
    const mid = [];
    if (by3[0]) mid.push({ up: true, text: `${by3[0].sector} leads`, detail: `${by3[0].etf} ${by3[0].r3m >= 0 ? '+' : ''}${by3[0].r3m.toFixed(1)}% in 3 months` });
    if (by3[1]) mid.push({ up: by3[1].r3m >= 0, text: `${by3[1].sector} close behind`, detail: `${by3[1].etf} ${by3[1].r3m >= 0 ? '+' : ''}${by3[1].r3m.toFixed(1)}% in 3 months` });
    const last = by3.at(-1);
    if (last) mid.push({ up: false, text: `${last.sector} lags`, detail: `${last.etf} ${last.r3m >= 0 ? '+' : ''}${last.r3m.toFixed(1)}% in 3 months` });
    if (tnx.length > 63) {
      const d = tnx.at(-1).c - tnx.at(-64).c;
      if (Math.abs(d) >= 0.15) mid.push({ up: d < 0, text: `10-year yield ${d > 0 ? 'climbing' : 'easing'}`, detail: `${d > 0 ? '+' : ''}${d.toFixed(2)} pts in 3 months, now ${tnx.at(-1).c.toFixed(2)}%` });
    }
    const long = [];
    if (by12[0]) long.push({ up: true, text: `${by12[0].sector} 12-month leader`, detail: `${by12[0].etf} ${by12[0].r12m >= 0 ? '+' : ''}${by12[0].r12m.toFixed(1)}% in a year` });
    if (sectorHistory?.periods?.length >= 4) {
      const p = sectorHistory.periods;
      const a = p[p.length - 4], b = p.at(-1);
      const shifts = Object.keys(b.mix).map((s) => ({ s, d: (b.mix[s] - (a.mix[s] || 0)) * 100 })).sort((x, y) => y.d - x.d);
      if (shifts[0]?.d > 0.5) long.push({ up: true, text: `Funds rotating into ${shifts[0].s}`, detail: `+${shifts[0].d.toFixed(1)} pts of tracked-fund capital since ${a.label}` });
      const out = shifts.at(-1);
      if (out?.d < -0.5) long.push({ up: false, text: `Funds trimming ${out.s}`, detail: `${out.d.toFixed(1)} pts since ${a.label}` });
    }
    if (congressFlows?.length) {
      const topBuy = [...congressFlows].filter((f) => f.sector !== 'Other').sort((a, b) => b.net - a.net)[0];
      if (topBuy?.net > 0) long.push({ up: true, text: `Congress net buying ${topBuy.sector}`, detail: 'Largest net disclosed buying over 12 months' });
    }
    if (by12.length > 1) {
      const w = by12.at(-1);
      long.push({ up: false, text: `${w.sector} 12-month laggard`, detail: `${w.etf} ${w.r12m >= 0 ? '+' : ''}${w.r12m.toFixed(1)}% in a year` });
    }
    return { mid: mid.slice(0, 4), long: long.slice(0, 4), sectors: rows };
  });
}
