// Congressional stock trades from official House Clerk Periodic Transaction Reports (PTRs).
// Committee assignments + photos come from the public-domain unitedstates/congress-legislators project.
import { createRequire } from 'node:module';
import { cached, getBuffer, getJSON, diskLoad, diskSave, pool, xmlBlocks, xmlVal } from './net.js';
import { unzip } from './unzip.js';
import { sectorFor, companyName, isBroadSic } from './sec.js';
import { history, priceAt } from './quotes.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const PARSER_VERSION = 3;
let store = diskLoad('congress.json', { docs: {} }); // DocID -> { member..., trades: [] }
if (store.v !== PARSER_VERSION) store = { v: PARSER_VERSION, docs: {} };
const MAX_DOCS = Number(process.env.CONGRESS_MAX_FILINGS || 120);

// Which sectors each House committee oversees (used for "committee conflict" flags)
export const COMMITTEE_SECTORS = {
  HSIF: { name: 'Energy & Commerce', sectors: ['Healthcare', 'Energy', 'Communication Services', 'Technology', 'Utilities', 'Consumer Cyclical'] },
  HSBA: { name: 'Financial Services', sectors: ['Financial Services', 'Real Estate'] },
  HSAS: { name: 'Armed Services', sectors: ['Industrials', 'Technology'] },
  HSAG: { name: 'Agriculture', sectors: ['Consumer Defensive'] },
  HSPW: { name: 'Transportation & Infrastructure', sectors: ['Industrials'] },
  HSSY: { name: 'Science, Space & Technology', sectors: ['Technology', 'Industrials', 'Communication Services'] },
  HSWM: { name: 'Ways & Means', sectors: ['Healthcare', 'Financial Services'] },
  HSII: { name: 'Natural Resources', sectors: ['Energy', 'Basic Materials', 'Utilities'] },
  HSHM: { name: 'Homeland Security', sectors: ['Technology', 'Industrials'] },
  HSVR: { name: "Veterans' Affairs", sectors: ['Healthcare'] },
  HSFA: { name: 'Foreign Affairs', sectors: ['Industrials', 'Energy'] },
  HLIG: { name: 'Intelligence', sectors: ['Technology', 'Industrials', 'Communication Services'] },
  HSAP: { name: 'Appropriations', sectors: ['Industrials', 'Healthcare'] },
};

async function legislators() {
  return cached('congress:legislators', 24 * 3600e3, async () => {
    const [people, membership] = await Promise.all([
      getJSON('https://unitedstates.github.io/congress-legislators/legislators-current.json'),
      getJSON('https://unitedstates.github.io/congress-legislators/committee-membership-current.json'),
    ]);
    const committeesOf = {};
    for (const [cid, members] of Object.entries(membership)) {
      if (!COMMITTEE_SECTORS[cid]) continue; // top-level committees we map
      for (const m of members) (committeesOf[m.bioguide] ||= []).push(cid);
    }
    const house = people
      .map((p) => {
        const term = p.terms.at(-1);
        return {
          bioguide: p.id.bioguide,
          first: p.name.first,
          last: p.name.last,
          nick: p.name.nickname,
          full: p.name.official_full || `${p.name.first} ${p.name.last}`,
          chamber: term.type,
          state: term.state,
          district: term.district,
          party: term.party,
          committees: committeesOf[p.id.bioguide] || [],
        };
      })
      .filter((p) => p.chamber === 'rep');
    return house;
  });
}

function matchMember(list, last, first, stateDst) {
  const st = stateDst.slice(0, 2);
  const dst = parseInt(stateDst.slice(2), 10);
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z]/g, '');
  const cands = list.filter((p) => p.state === st && (norm(p.last) === norm(last) || norm(last).includes(norm(p.last))));
  return cands.find((p) => p.district === dst) || cands[0] || null;
}

const AMOUNT_MID = (a = '') => {
  const nums = (a.match(/\$[\d,]+/g) || []).map((x) => Number(x.replace(/[$,]/g, '')));
  if (!nums.length) return 0;
  if (/over/i.test(a)) return nums[0] * 1.5;
  return nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0];
};

export function parsePtrText(text) {
  // Join wrapped asset names onto their "[ST]" line, but never pull in label lines ("S O: owner") or amounts.
  const lines = text.replace(/\u0000/g, '').split('\n');
  const merged = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (/\[(?:ST|OP|AB)\]/.test(line) && prev != null && !/:|\$|\d{2}\/\d{2}\/\d{4}|^\s*$|Gains|Type|Date/.test(prev) && !/\[(?:ST|OP|AB)\]|\(partial\)/.test(prev)) {
      merged[merged.length - 1] = prev + ' ' + line;
    } else merged.push(line);
  }
  const flat = merged.join('\n').replace(/[ \t]+/g, ' ');
  const re = /([^\n]*?)\(([A-Z][A-Z0-9.\-]{0,6})\)\s*\[(ST|OP|AB)\]\s*\n?\s*(P|S \(partial\)|S|E)\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}\/\d{2}\/\d{4})\s*((?:\$[\d,]+\s*-\s*\n?\s*\$[\d,]+)|(?:Over \$[\d,]+)|(?:Spouse\/DC Over \$[\d,]+))/g;
  const out = [];
  let m;
  while ((m = re.exec(flat))) {
    let asset = m[1].trim();
    let owner = 'Self';
    const om = /^SPDR/.test(asset) ? null : /^(SP|JT|DC)\s*(?=[A-Z0-9])/.exec(asset);
    if (om) {
      owner = { SP: 'Spouse', JT: 'Joint', DC: 'Dependent' }[om[1]];
      asset = asset.slice(om[0].length);
    }
    const [mm, dd, yy] = m[5].split('/');
    const [nm, nd, ny] = m[6].split('/');
    out.push({
      ticker: m[2].replace(/\.$/, ''),
      asset: asset.replace(/\s*-\s*$/, '').trim(),
      assetType: m[3],
      type: m[4].startsWith('P') ? 'BUY' : m[4].startsWith('S') ? 'SELL' : 'EXCHANGE',
      partial: m[4].includes('partial'),
      date: `${yy}-${mm}-${dd}`,
      notified: `${ny}-${nm}-${nd}`,
      amount: m[7].replace(/\s+/g, ' ').replace(/- \$/, '- $'),
      owner,
    });
  }
  return out;
}

async function filingIndex(year) {
  return cached(`congress:index:${year}`, 3 * 3600e3, async () => {
    const zip = unzip(await getBuffer(`https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${year}FD.zip`));
    const xml = Object.entries(zip).find(([n]) => n.endsWith('.xml'))[1].toString('utf8');
    return xmlBlocks(xml, 'Member')
      .filter((m) => xmlVal(m, 'FilingType') === 'P')
      .map((m) => {
        const [mo, d, y] = xmlVal(m, 'FilingDate').split('/');
        return {
          docId: xmlVal(m, 'DocID'),
          first: xmlVal(m, 'First'),
          last: xmlVal(m, 'Last'),
          stateDst: xmlVal(m, 'StateDst'),
          year,
          filed: `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`,
        };
      });
  });
}

export async function refreshCongress() {
  const y = new Date().getUTCFullYear();
  const idx = [...(await filingIndex(y)), ...(new Date().getUTCMonth() < 2 ? await filingIndex(y - 1).catch(() => []) : [])];
  idx.sort((a, b) => b.filed.localeCompare(a.filed));
  const recent = idx.slice(0, MAX_DOCS);
  const todo = recent.filter((f) => !store.docs[f.docId]);
  await pool(todo, 3, async (f) => {
    const url = `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${f.year}/${f.docId}.pdf`;
    try {
      const text = (await pdfParse(await getBuffer(url))).text;
      store.docs[f.docId] = { ...f, url, trades: parsePtrText(text), scanned: text.length < 400 };
    } catch (e) {
      store.docs[f.docId] = { ...f, url, trades: [], error: String(e.message) };
    }
  });
  const keep = new Set(recent.map((f) => f.docId));
  for (const k of Object.keys(store.docs)) if (!keep.has(k)) delete store.docs[k];
  diskSave('congress.json', store);
  return { parsed: todo.length, filings: Object.keys(store.docs).length };
}

export async function congressOverview() {
  return cached('congress:overview', 5 * 60e3, async () => {
    const reps = await legislators().catch(() => []);
    const trades = [];
    for (const d of Object.values(store.docs)) {
      const m = matchMember(reps, d.last, d.first, d.stateDst);
      for (const t of d.trades) {
        trades.push({
          ...t,
          id: `${d.docId}-${trades.length}`,
          member: m ? m.full : `${d.first} ${d.last}`.replace(/\s+(Mr|Mrs|Ms|Hon)\b\.?/g, ''),
          bioguide: m?.bioguide || null,
          party: m?.party || null,
          stateDst: d.stateDst,
          committees: m?.committees || [],
          filed: d.filed,
          url: d.url,
          mid: AMOUNT_MID(t.amount),
        });
      }
    }
    trades.sort((a, b) => b.date.localeCompare(a.date) || b.filed.localeCompare(a.filed));
    const stocks = trades.filter((t) => t.assetType === 'ST' && t.type !== 'EXCHANGE');

    // enrich: sector, company name
    const tickers = [...new Set(stocks.map((t) => t.ticker))];
    const sectors = {};
    await pool(tickers.slice(0, 250), 4, async (tk) => (sectors[tk] = await sectorFor(tk)));
    for (const t of stocks) {
      t.sector = sectors[t.ticker] || null;
      t.company = (await companyName(t.ticker)) || t.asset;
      const conflicts = isBroadSic(t.ticker) ? [] : t.committees.filter((c) => COMMITTEE_SECTORS[c]?.sectors.includes(t.sector));
      t.conflict = conflicts.length ? { committee: conflicts[0], name: COMMITTEE_SECTORS[conflicts[0]].name } : null;
    }

    // prices since trade for the most recent ~60 tickers
    const recentT = [...new Set(stocks.slice(0, 120).map((t) => t.ticker))].slice(0, 60);
    const hist = {};
    await pool(['SPY', ...recentT], 4, async (tk) => (hist[tk] = await history(tk).catch(() => null)));
    for (const t of stocks) {
      const h = hist[t.ticker];
      if (!h?.length) continue;
      const p0 = priceAt(h, Date.parse(t.date));
      const p1 = h.at(-1).c;
      if (p0) {
        t.priceAtTrade = p0;
        t.since = ((p1 - p0) / p0) * 100;
        const s = hist.SPY;
        const s0 = s && priceAt(s, Date.parse(t.date));
        if (s0) t.spySince = ((s.at(-1).c - s0) / s0) * 100;
      }
    }

    const windowAgg = (days) => {
      const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
      const w = stocks.filter((t) => t.date >= since);
      const buying = {};
      const flows = {};
      for (const t of w) {
        if (t.type === 'BUY') {
          const g = (buying[t.ticker] ||= { ticker: t.ticker, company: t.company, members: new Set(), trades: 0 });
          g.members.add(t.member);
          g.trades++;
        }
        const s = t.sector || 'Other';
        flows[s] = (flows[s] || 0) + (t.type === 'BUY' ? t.mid : -t.mid);
      }
      return {
        buying: Object.values(buying)
          .map((g) => ({ ...g, members: [...g.members], count: g.members.size }))
          .sort((a, b) => b.count - a.count || b.trades - a.trades)
          .slice(0, 15),
        flows: Object.entries(flows)
          .map(([sector, net]) => ({ sector, net }))
          .sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
      };
    };

    // "First buys": tickers bought once in the tracked window, with no earlier congressional trade in it
    const seen = {};
    for (const t of [...stocks].reverse()) {
      (seen[t.ticker] ||= []).push(t);
    }
    const firstBuys = Object.values(seen)
      .filter((arr) => arr[0].type === 'BUY' && arr.length === 1)
      .map((arr) => arr[0])
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 15);

    // Leaderboard: average excess return vs S&P 500 of each member's buys
    const perf = {};
    for (const t of stocks) {
      if (t.since == null || t.spySince == null) continue;
      const p = (perf[t.member] ||= { member: t.member, bioguide: t.bioguide, party: t.party, stateDst: t.stateDst, n: 0, ret: 0, excess: 0 });
      const sign = t.type === 'BUY' ? 1 : -1; // a sale "wins" if the stock later falls
      p.n++;
      p.ret += sign * t.since;
      p.excess += sign * (t.since - t.spySince);
    }
    const leaders = Object.values(perf)
      .filter((p) => p.n >= 2)
      .map((p) => ({ ...p, ret: p.ret / p.n, excess: p.excess / p.n }))
      .sort((a, b) => b.excess - a.excess);

    return {
      trades: stocks.slice(0, 500),
      suspicious: stocks.filter((t) => t.conflict).slice(0, 40),
      windows: { '30d': windowAgg(30), '90d': windowAgg(90), '365d': windowAgg(365) },
      firstBuys,
      leaders: leaders.slice(0, 25),
      filings: Object.keys(store.docs).length,
      coverage: 'House of Representatives periodic transaction reports (electronic filings).',
    };
  });
}
