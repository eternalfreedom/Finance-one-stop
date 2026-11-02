// Insider trades from SEC Form 4 filings (live EDGAR "current filings" feed).
import { cached, getText, getJSON, xmlBlocks, xmlVal, decodeEntities, diskLoad, diskSave, pool } from './net.js';
import { history, peakBefore } from './quotes.js';

const store = diskLoad('insider.json', { filings: {} });
const KEEP_DAYS = 60;

function roleOf(owner) {
  const t = (owner.title || '').toLowerCase();
  if (/chief executive|\bceo\b/.test(t)) return 'CEO';
  if (/chief financial|\bcfo\b/.test(t)) return 'CFO';
  if (/chief operating|\bcoo\b/.test(t)) return 'COO';
  if (/president/.test(t)) return 'President';
  if (/chair/.test(t)) return 'Chair';
  if (owner.isOfficer) return 'Officer';
  if (owner.isDirector) return 'Director';
  if (owner.isTen) return '10% Owner';
  return 'Insider';
}

function prettyName(n = '') {
  // EDGAR stores "LAST FIRST M" in caps; title-case it for display
  return n
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\b(Ii|Iii|Iv|Jr|Sr)\b/g, (s) => s.toUpperCase().replace('JR', 'Jr').replace('SR', 'Sr'))
    .replace(/\bLlc\b/g, 'LLC')
    .replace(/\bLp\b/g, 'LP');
}

export function parseForm4(xml) {
  const issuer = {
    name: xmlVal(xml, 'issuerName'),
    ticker: xmlVal(xml, 'issuerTradingSymbol').toUpperCase().split(/[\s,;]/)[0],
    cik: xmlVal(xml, 'issuerCik'),
  };
  const ownerBlock = xmlBlocks(xml, 'reportingOwner')[0] || '';
  const owner = {
    name: prettyName(xmlVal(ownerBlock, 'rptOwnerName')),
    title: xmlVal(ownerBlock, 'officerTitle'),
    isDirector: /^(1|true)$/i.test(xmlVal(ownerBlock, 'isDirector')),
    isOfficer: /^(1|true)$/i.test(xmlVal(ownerBlock, 'isOfficer')),
    isTen: /^(1|true)$/i.test(xmlVal(ownerBlock, 'isTenPercentOwner')),
  };
  owner.role = roleOf(owner);
  const txs = xmlBlocks(xml, 'nonDerivativeTransaction').map((b) => {
    const shares = parseFloat(xmlVal(b, 'transactionShares')) || 0;
    const price = parseFloat(xmlVal(b, 'transactionPricePerShare')) || 0;
    return {
      code: xmlVal(b, 'transactionCode'),
      date: xmlVal(b, 'transactionDate').slice(0, 10),
      shares,
      price,
      ad: xmlVal(b, 'transactionAcquiredDisposedCode'),
      after: parseFloat(xmlVal(b, 'sharesOwnedFollowingTransaction')) || null,
    };
  });
  return { issuer, owner, txs };
}

async function feedPage(start) {
  const xml = await getText(
    `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=include&start=${start}&count=100&output=atom`,
  );
  return xmlBlocks(xml, 'entry').map((e) => {
    const href = (/href="([^"]+)"/.exec(e) || [])[1] || '';
    const title = decodeEntities(xmlVal(e, 'title'));
    const acc = (/accession-number=([\d-]+)/.exec(e) || [])[1];
    const updated = xmlVal(e, 'updated');
    return { href, title, acc, updated, form: (/term="([^"]+)"/.exec(e) || [])[1] };
  });
}

// One request per filing: the complete submission .txt embeds the Form 4 XML.
async function loadFiling({ acc, cik, filed }) {
  const folder = `https://www.sec.gov/Archives/edgar/data/${cik}/${acc.replace(/-/g, '')}/`;
  const txt = await getText(folder + acc + '.txt');
  const m = /<ownershipDocument>[\s\S]*<\/ownershipDocument>/.exec(txt);
  if (!m) return null;
  return { acc, filed, url: folder + acc + '-index.htm', ...parseForm4(m[0]) };
}

// Backfill the last ~10 days from EDGAR's daily form indexes so clusters work from day one.
async function queueBackfill() {
  if (store.backfilledAt && Date.now() - store.backfilledAt < 6 * 3600e3) return;
  const queue = new Map((store.queue || []).map((q) => [q.acc, q]));
  for (let d = 0; d < 10; d++) {
    const dt = new Date(Date.now() - d * 864e5);
    if ([0, 6].includes(dt.getUTCDay())) continue;
    const ymd = dt.toISOString().slice(0, 10).replace(/-/g, '');
    const qtr = Math.floor(dt.getUTCMonth() / 3) + 1;
    try {
      const idx = await getText(`https://www.sec.gov/Archives/edgar/daily-index/${dt.getUTCFullYear()}/QTR${qtr}/form.${ymd}.idx`);
      for (const line of idx.split('\n')) {
        if (!/^4\s/.test(line)) continue;
        const m = /edgar\/data\/(\d+)\/([\d-]+)\.txt/.exec(line);
        if (m && !store.filings[m[2]] && !queue.has(m[2])) {
          queue.set(m[2], { acc: m[2], cik: m[1], filed: `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6)}T16:00:00-05:00` });
        }
      }
    } catch {
      /* index not published yet (today / holiday) */
    }
  }
  store.queue = [...queue.values()].sort((a, b) => b.filed.localeCompare(a.filed));
  store.backfilledAt = Date.now();
}

export async function refreshInsider() {
  const pages = (await pool([0, 100, 200, 300], 2, feedPage)).flat().filter(Boolean);
  const seen = new Set();
  const fresh = pages
    .filter((e) => e.form === '4' && e.acc && !store.filings[e.acc] && !seen.has(e.acc) && seen.add(e.acc))
    .map((e) => ({ acc: e.acc, cik: (/edgar\/data\/(\d+)\//.exec(e.href) || [])[1], filed: e.updated }))
    .filter((e) => e.cik);
  await queueBackfill().catch(() => {});
  const backlog = (store.queue || []).filter((q) => !store.filings[q.acc]);
  const batch = [...fresh, ...backlog.slice(0, Math.max(0, 400 - fresh.length))];
  const loaded = await pool(batch, 4, loadFiling);
  batch.forEach((b, i) => {
    store.filings[b.acc] = loaded[i] || { acc: b.acc, filed: b.filed, issuer: {}, owner: {}, txs: [] };
  });
  store.queue = backlog.filter((q) => !store.filings[q.acc]);
  const cutoff = Date.now() - KEEP_DAYS * 864e5;
  for (const [k, f] of Object.entries(store.filings)) if (Date.parse(f.filed) < cutoff) delete store.filings[k];
  diskSave('insider.json', store);
  return { added: batch.length, total: Object.keys(store.filings).length, queued: store.queue.length };
}

// One row per filing & direction (open-market P = buy, S = sell)
export function trades() {
  const rows = [];
  for (const f of Object.values(store.filings)) {
    if (!f.txs?.length) continue;
    for (const code of ['P', 'S']) {
      const tx = f.txs.filter((t) => t.code === code && t.shares > 0);
      if (!tx.length) continue;
      const shares = tx.reduce((a, t) => a + t.shares, 0);
      const value = tx.reduce((a, t) => a + t.shares * t.price, 0);
      if (!f.issuer.ticker || f.issuer.ticker === 'NONE' || value <= 0) continue;
      rows.push({
        id: f.acc + code,
        ticker: f.issuer.ticker,
        company: f.issuer.name,
        insider: f.owner.name,
        role: f.owner.role,
        title: f.owner.title,
        type: code === 'P' ? 'BUY' : 'SELL',
        shares,
        avgPrice: value / shares,
        value,
        date: tx.map((t) => t.date).sort().at(-1),
        filed: f.filed,
        url: f.url,
      });
    }
  }
  return rows.sort((a, b) => (b.date + b.filed).localeCompare(a.date + a.filed));
}

export async function insiderOverview() {
  return cached('insider:overview', 60e3, async () => {
    const all = trades();
    const since30 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const buys = all.filter((t) => t.type === 'BUY');
    // Cluster buys: >= 2 distinct insiders buying the same ticker within 30 days
    const groups = {};
    for (const b of buys.filter((b) => b.date >= since30)) {
      const g = (groups[b.ticker] ||= { ticker: b.ticker, company: b.company, insiders: new Set(), value: 0, trades: [] });
      g.insiders.add(b.insider);
      g.value += b.value;
      g.trades.push(b);
    }
    const clusters = Object.values(groups)
      .filter((g) => g.insiders.size >= 2)
      .map((g) => ({ ...g, insiders: [...g.insiders], count: g.insiders.size }))
      .sort((a, b) => b.count - a.count || b.value - a.value);

    // Buy-the-dip: large buys made well below the 90-day peak
    const candidates = buys.filter((b) => b.value >= 50e3).sort((a, b) => b.value - a.value).slice(0, 30);
    const dips = (
      await pool(candidates, 4, async (b) => {
        const h = await history(b.ticker).catch(() => null);
        const peak = peakBefore(h, Date.parse(b.date), 90);
        if (!peak) return null;
        const below = (peak - b.avgPrice) / peak;
        return below >= 0.15 ? { ...b, peak, belowPeak: below } : null;
      })
    )
      .filter(Boolean)
      .sort((a, b) => b.belowPeak * Math.log10(b.value) - a.belowPeak * Math.log10(a.value));

    return { trades: all.slice(0, 400), clusters: clusters.slice(0, 20), dips: dips.slice(0, 20), filings: Object.keys(store.filings).length, backlog: (store.queue || []).length };
  });
}
