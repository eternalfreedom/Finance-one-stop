// Super-investors: quarterly 13F-HR holdings for a curated list of well-known funds.
import { cached, getJSON, getText, xmlBlocks, xmlVal, diskLoad, diskSave, pool } from './net.js';
import { cusipsToTickers, sectorFor, SECTORS } from './sec.js';

export const FUNDS = [
  { cik: 1067983, name: 'Berkshire Hathaway', manager: 'Warren Buffett / Greg Abel', popular: true },
  { cik: 1536411, name: 'Duquesne Family Office', manager: 'Stanley Druckenmiller', popular: true },
  { cik: 1336528, name: 'Pershing Square', manager: 'Bill Ackman', popular: true },
  { cik: 1656456, name: 'Appaloosa', manager: 'David Tepper', popular: true },
  { cik: 1061768, name: 'Baupost Group', manager: 'Seth Klarman' },
  { cik: 1040273, name: 'Third Point', manager: 'Dan Loeb' },
  { cik: 1709323, name: 'Himalaya Capital', manager: 'Li Lu' },
  { cik: 1167483, name: 'Tiger Global', manager: 'Chase Coleman' },
  { cik: 1135730, name: 'Coatue Management', manager: 'Philippe Laffont' },
  { cik: 1061165, name: 'Lone Pine Capital', manager: 'Stephen Mandel' },
  { cik: 1103804, name: 'Viking Global', manager: 'Andreas Halvorsen' },
  { cik: 1350694, name: 'Bridgewater Associates', manager: 'Ray Dalio (founder)' },
  { cik: 949509, name: 'Oaktree Capital', manager: 'Howard Marks' },
  { cik: 921669, name: 'Icahn Enterprises', manager: 'Carl Icahn' },
  { cik: 1029160, name: 'Soros Fund Management', manager: 'George Soros (founder)' },
  { cik: 1112520, name: 'Akre Capital', manager: 'Chuck Akre' },
  { cik: 1569205, name: 'Fundsmith', manager: 'Terry Smith' },
  { cik: 1166559, name: 'Gates Foundation Trust', manager: 'Bill & Melinda Gates Foundation' },
  { cik: 1541617, name: 'Altimeter Capital', manager: 'Brad Gerstner' },
  { cik: 1791786, name: 'Elliott Investment Mgmt', manager: 'Paul Singer' },
  { cik: 1418814, name: 'ValueAct Capital', manager: 'Mason Morfit' },
];

let store = diskLoad('13f.json', { filings: {} }); // accession -> parsed holdings
if (store.v !== 2) store = { v: 2, filings: {} };

const pad = (c) => String(c).padStart(10, '0');

async function listFilings(cik) {
  const sub = await getJSON(`https://data.sec.gov/submissions/CIK${pad(cik)}.json`);
  const r = sub.filings.recent;
  const out = [];
  r.form.forEach((f, i) => {
    if (f === '13F-HR') out.push({ acc: r.accessionNumber[i], filed: r.filingDate[i], period: r.reportDate[i] });
  });
  // keep newest filing per period
  const byPeriod = {};
  for (const f of out) if (!byPeriod[f.period] || f.filed > byPeriod[f.period].filed) byPeriod[f.period] = f;
  return Object.values(byPeriod).sort((a, b) => b.period.localeCompare(a.period));
}

async function loadHoldings(cik, f, { trim = false } = {}) {
  if (store.filings[f.acc]) return store.filings[f.acc];
  const folder = `https://www.sec.gov/Archives/edgar/data/${cik}/${f.acc.replace(/-/g, '')}/`;
  const idx = await getJSON(folder + 'index.json');
  const xmls = idx.directory.item.map((i) => i.name).filter((n) => n.endsWith('.xml') && !/primary_doc/i.test(n));
  let table = null;
  for (const n of xmls) {
    const x = await getText(folder + n);
    if (/infoTable/i.test(x)) {
      table = x;
      break;
    }
  }
  if (!table) {
    // Fallback: the complete submission text file embeds every document
    const full = await getText(folder + f.acc + '.txt');
    const m = /<(?:\w+:)?informationTable[\s\S]*<\/(?:\w+:)?informationTable>/i.exec(full);
    if (m) table = m[0];
  }
  if (!table) throw new Error('no info table for ' + f.acc);
  const pos = {};
  for (const b of xmlBlocks(table, 'infoTable')) {
    if (xmlVal(b, 'putCall')) continue; // skip options
    const cusip = xmlVal(b, 'cusip').toUpperCase();
    const p = (pos[cusip] ||= { cusip, name: xmlVal(b, 'nameOfIssuer'), cls: xmlVal(b, 'titleOfClass'), value: 0, shares: 0 });
    p.value += parseFloat(xmlVal(b, 'value')) || 0;
    p.shares += parseFloat(xmlVal(b, 'sshPrnamt')) || 0;
  }
  // Values should be in dollars (since 2023), but older filings - and some filers still - report thousands.
  // Detect by the implied median share price.
  const implied = Object.values(pos).filter((p) => p.shares > 0).map((p) => p.value / p.shares).sort((a, b) => a - b);
  const median = implied[Math.floor(implied.length / 2)] || 0;
  const mult = f.period < '2022-12-31' || median < 0.5 ? 1000 : 1;
  const holdings = Object.values(pos).map((p) => ({ ...p, value: p.value * mult }));
  const total = holdings.reduce((a, h) => a + h.value, 0);
  // Older quarters are only used for sector history: keep their 40 largest positions to save disk
  const kept = trim ? [...holdings].sort((a, b) => b.value - a.value).slice(0, 40) : holdings;
  const rec = { ...f, folder, total, trimmed: trim, holdings: kept };
  store.filings[f.acc] = rec;
  diskSave('13f.json', store);
  return rec;
}

function diff(curr, prev) {
  const prevMap = Object.fromEntries((prev?.holdings || []).map((h) => [h.cusip, h]));
  const currMap = Object.fromEntries(curr.holdings.map((h) => [h.cusip, h]));
  const changes = [];
  for (const h of curr.holdings) {
    const p = prevMap[h.cusip];
    const px = h.shares ? h.value / h.shares : 0;
    if (!p) changes.push({ ...h, type: 'New', deltaShares: h.shares, deltaValue: h.value, pct: null, avgPrice: px });
    else {
      const d = h.shares - p.shares;
      if (Math.abs(d) / Math.max(p.shares, 1) < 0.02) continue;
      changes.push({ ...h, type: d > 0 ? 'Added' : 'Reduced', deltaShares: d, deltaValue: d * px, pct: (d / p.shares) * 100, avgPrice: px });
    }
  }
  if (prev)
    for (const p of prev.holdings)
      if (!currMap[p.cusip]) {
        const px = p.shares ? p.value / p.shares : 0;
        changes.push({ ...p, type: 'Exited', shares: 0, value: 0, deltaShares: -p.shares, deltaValue: -p.value, pct: -100, avgPrice: px });
      }
  return changes;
}

async function fundData(fund) {
  const filings = await listFilings(fund.cik);
  if (!filings.length) return null;
  const [curr, prev] = await Promise.all(filings.slice(0, 2).map((f) => loadHoldings(fund.cik, f)));
  const aum = curr.holdings.reduce((a, h) => a + h.value, 0);
  const prevAum = prev ? prev.holdings.reduce((a, h) => a + h.value, 0) : null;
  const top = [...curr.holdings].sort((a, b) => b.value - a.value);
  return {
    ...fund,
    period: curr.period,
    filed: curr.filed,
    source: curr.folder,
    aum,
    prevAum,
    positions: curr.holdings.length,
    top: top.slice(0, 25).map((h) => ({ ...h, weight: h.value / aum })),
    changes: diff(curr, prev),
  };
}

export async function superOverview() {
  return cached('super:overview', 6 * 3600e3, async () => {
    const funds = (
      await pool(FUNDS, 2, async (f) => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await fundData(f);
          } catch (e) {
            if (attempt === 2) console.warn(`[13F] ${f.name}: ${e.message}`);
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          }
        }
      })
    ).filter(Boolean);
    // Map the CUSIPs we will actually display to tickers
    const want = new Map();
    for (const f of funds) {
      f.top.slice(0, 15).forEach((h) => want.set(h.cusip, h.name));
      [...f.changes].sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue)).slice(0, 25).forEach((h) => want.set(h.cusip, h.name));
    }
    const latestPeriod = funds.map((f) => f.period).sort().at(-1);
    const conviction = { New: {}, Added: {}, Reduced: {}, Exited: {} };
    for (const f of funds) {
      if (f.period !== latestPeriod) continue;
      for (const c of f.changes) {
        const g = (conviction[c.type][c.cusip] ||= { cusip: c.cusip, name: c.name, funds: [], value: 0 });
        g.funds.push(f.name);
        g.value += Math.abs(c.deltaValue);
      }
    }
    const conv = {};
    for (const [t, m] of Object.entries(conviction)) {
      conv[t] = Object.values(m).sort((a, b) => b.funds.length - a.funds.length || b.value - a.value).slice(0, 10);
      conv[t].forEach((g) => want.set(g.cusip, g.name));
    }
    const tick = await cusipsToTickers([...want.keys()], Object.fromEntries(want));
    const withT = (h) => ({ ...h, ticker: tick[h.cusip] || null });

    const trades = [];
    for (const f of funds)
      for (const c of f.changes) trades.push({ ...c, fund: f.name, manager: f.manager, cik: f.cik, filed: f.filed, period: f.period, source: f.source });
    trades.sort((a, b) => b.filed.localeCompare(a.filed) || Math.abs(b.deltaValue) - Math.abs(a.deltaValue));

    // Sector mix per fund (top holdings covering most of AUM)
    const sectorMix = await pool(funds, 2, async (f) => {
      const mix = Object.fromEntries(SECTORS.map((s) => [s, 0]));
      let other = 0;
      for (const h of f.top) {
        const t = tick[h.cusip];
        const s = t ? await sectorFor(t) : null;
        if (s) mix[s] += h.weight;
        else other += h.weight;
      }
      const covered = f.top.reduce((a, h) => a + h.weight, 0);
      return { fund: f.name, mix, other: other + (1 - covered) };
    });

    return {
      period: latestPeriod,
      funds: funds.map((f) => ({ ...f, top: f.top.map(withT), changes: undefined, changeCount: f.changes.length })),
      conviction: Object.fromEntries(Object.entries(conv).map(([k, v]) => [k, v.map(withT)])),
      trades: trades.slice(0, 300).map(withT),
      sectorMix,
      sectors: SECTORS,
    };
  });
}

export async function fundDetail(cik) {
  const all = await superOverview();
  const f = all.funds.find((x) => String(x.cik) === String(cik));
  if (!f) return null;
  return { ...f, trades: all.trades.filter((t) => String(t.cik) === String(cik)) };
}

// Sector mix of tracked funds over the last 8 quarters (top 25 holdings of each fund, equal-weighted across funds)
const qLabel = (p) => `${p.slice(0, 4)} Q${Math.ceil(Number(p.slice(5, 7)) / 3)}`;
export async function sectorHistory() {
  return cached('super:sectors', 24 * 3600e3, async () => {
    const perFund = await pool(FUNDS, 2, async (fund) => {
      const filings = (await listFilings(fund.cik)).slice(0, 8);
      const out = [];
      for (let i = 0; i < filings.length; i++) {
        try {
          const r = await loadHoldings(fund.cik, filings[i], { trim: i >= 2 });
          const total = r.total || r.holdings.reduce((a, h) => a + h.value, 0);
          out.push({ period: r.period, total, top: [...r.holdings].sort((a, b) => b.value - a.value).slice(0, 25) });
        } catch {
          /* skip a quarter we cannot read */
        }
      }
      return out;
    });
    const names = {};
    for (const f of perFund) for (const q of f || []) for (const h of q.top) names[h.cusip] = h.name;
    const tick = await cusipsToTickers(Object.keys(names), names);
    const periods = {};
    for (const f of perFund) {
      for (const q of f || []) {
        const mix = Object.fromEntries([...SECTORS, 'Other'].map((s) => [s, 0]));
        let covered = 0;
        for (const h of q.top) {
          const w = h.value / (q.total || 1);
          covered += w;
          const t = tick[h.cusip];
          const sec = t ? await sectorFor(t) : null;
          mix[sec || 'Other'] += w;
        }
        // normalise to the part of the portfolio we can see (top 25 positions)
        for (const k of Object.keys(mix)) mix[k] = covered ? mix[k] / covered : 0;
        (periods[q.period] ||= []).push(mix);
      }
    }
    const fundCount = perFund.filter((f) => f?.length).length;
    const list = Object.entries(periods)
      .filter(([, mixes]) => mixes.length >= Math.max(3, fundCount * 0.6))
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([period, mixes]) => {
        const avg = {};
        for (const k of [...SECTORS, 'Other']) avg[k] = mixes.reduce((a, m) => a + m[k], 0) / mixes.length;
        return { period, label: qLabel(period), funds: mixes.length, mix: avg };
      });
    return { periods: list, sectors: [...SECTORS, 'Other'] };
  });
}
