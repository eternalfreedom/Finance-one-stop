// Finance One-Stop server: data engines + JSON API + live updates (SSE) + static PWA.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { health, invalidate } from './lib/net.js';
import { indexes, quotes, history } from './lib/quotes.js';
import { refreshInsider, insiderOverview, trades as insiderTrades } from './lib/insider.js';
import { superOverview, fundDetail, FUNDS } from './lib/superinvestors.js';
import { refreshCongress, congressOverview } from './lib/congress.js';
import { stocktwitsTrending, stocktwitsSymbol, reddit, REDDIT_FILTERS } from './lib/social.js';
import { headlines, tickerNews, REGIONS } from './lib/news.js';
import { tickerMap, sectorFor, companyName } from './lib/sec.js';
import * as store from './lib/store.js';
import { requestReport, aiEnabled, onReportUpdate } from './lib/ai.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(here, '..', 'public');
const PORT = Number(process.env.PORT || 8080);
const PASSCODE = process.env.APP_PASSCODE || '';
const authToken = PASSCODE ? crypto.createHmac('sha256', PASSCODE).update('fos-v1').digest('hex') : '';

// ---------------- live updates ----------------
const clients = new Set();
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients) c.write(msg);
}
onReportUpdate((r) => broadcast('report', { id: r.id, status: r.status }));

async function job(name, fn, sections) {
  try {
    await fn();
    sections.forEach((s) => invalidate(s));
    broadcast('update', { section: name, at: Date.now() });
  } catch (e) {
    health[`job:${name}`] = { ok: false, at: Date.now(), error: String(e.message || e) };
    console.warn(`[${name}]`, e.message);
  }
}
function every(ms, name, fn, sections = []) {
  const run = () => job(name, fn, sections);
  setTimeout(run, 1000 + Math.random() * 3000);
  setInterval(run, ms);
}
every(5 * 60e3, 'insider', refreshInsider, ['insider:']);
every(60 * 60e3, 'congress', refreshCongress, ['congress:overview']);
every(6 * 3600e3, 'super', () => superOverview(), []);
every(5 * 60e3, 'social', () => Promise.all([stocktwitsTrending(), reddit('all-stocks')]), []);
every(5 * 60e3, 'news', () => headlines('for-you', store.getState().watchlist), []);

// push prices every 15s while someone has the app open
setInterval(async () => {
  if (!clients.size) return;
  try {
    const syms = [...store.getState().watchlist];
    const [idx, q] = await Promise.all([indexes(), quotes(syms)]);
    broadcast('quotes', { indexes: idx, quotes: q, at: Date.now() });
  } catch {}
}, 15e3);

// ---------------- helpers ----------------
const send = (res, code, body, headers = {}) => {
  const json = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(json);
};
const readBody = (req) =>
  new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => (b += c).length > 1e6 && req.destroy());
    req.on('end', () => {
      try {
        resolve(b ? JSON.parse(b) : {});
      } catch {
        resolve({});
      }
    });
  });
const cookie = (req, name) => (req.headers.cookie || '').split(/;\s*/).map((c) => c.split('=')).find(([k]) => k === name)?.[1];
const authed = (req) => !PASSCODE || cookie(req, 'fos_auth') === authToken || req.headers['x-passcode'] === PASSCODE;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
function serveStatic(req, res, pathname) {
  let p = path.normalize(path.join(PUBLIC, pathname === '/' ? 'index.html' : pathname));
  if (!p.startsWith(PUBLIC)) return send(res, 403, { error: 'forbidden' });
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(PUBLIC, 'index.html');
  const ext = path.extname(p);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' || p.endsWith('sw.js') ? 'no-cache' : 'public, max-age=300',
  });
  fs.createReadStream(p).pipe(res);
}

// ---------------- API ----------------
const routes = [];
const route = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });

route('GET', '/api/health', async () => ({
  ok: true,
  ai: aiEnabled(),
  auth: Boolean(PASSCODE),
  sources: health,
  now: Date.now(),
}));
route('POST', '/api/login', async (req, res, p, body) => {
  if (!PASSCODE || body.passcode === PASSCODE) {
    const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `fos_auth=${authToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`);
    return { ok: true };
  }
  return [401, { error: 'Wrong passcode' }];
});

route('GET', '/api/state', async () => store.getState());
route('PUT', '/api/watchlist', async (req, res, p, body) => {
  const wl = store.setWatchlist(body.watchlist || []);
  broadcast('state', store.getState());
  return { watchlist: wl };
});
route('PUT', '/api/prefs', async (req, res, p, body) => {
  store.setPrefs(body || {});
  broadcast('state', store.getState());
  return store.getState();
});

route('GET', '/api/market', async () => ({ indexes: await indexes(), quotes: await quotes(store.getState().watchlist) }));
route('GET', '/api/quotes', async (req, res, p, b, q) => quotes((q.get('symbols') || '').split(',').filter(Boolean)));

route('GET', '/api/super', async () => superOverview());
route('GET', '/api/super/fund/:cik', async (req, res, p) => (await fundDetail(p.cik)) || [404, { error: 'not found' }]);
route('GET', '/api/congress', async () => congressOverview());
route('GET', '/api/insider', async () => insiderOverview());
route('GET', '/api/social/stocktwits', async () => ({ trending: await stocktwitsTrending() }));
route('GET', '/api/social/reddit', async (req, res, p, b, q) => ({ ...(await reddit(q.get('filter') || 'all-stocks')), filters: REDDIT_FILTERS }));
route('GET', '/api/social/symbol/:sym', async (req, res, p) => stocktwitsSymbol(p.sym));
route('GET', '/api/news', async (req, res, p, b, q) => ({
  regions: Object.fromEntries(Object.entries(REGIONS).map(([k, v]) => [k, v.label])),
  items: await headlines(q.get('region') || 'for-you', store.getState().watchlist),
}));

route('GET', '/api/ticker/:sym', async (req, res, p, b, q) => {
  const sym = decodeURIComponent(p.sym).toUpperCase();
  const range = q.get('range') || '6mo';
  const [qt, hist, news, social, sector, name, sup, cong] = await Promise.all([
    quotes([sym]).then((x) => x[sym] || null),
    history(sym, range).catch(() => []),
    tickerNews(sym).catch(() => []),
    stocktwitsSymbol(sym).catch(() => null),
    sectorFor(sym),
    companyName(sym),
    superOverview().catch(() => null),
    congressOverview().catch(() => null),
  ]);
  const holders = [];
  for (const f of sup?.funds || []) {
    const h = f.top.find((x) => x.ticker === sym);
    if (h) holders.push({ fund: f.name, manager: f.manager, cik: f.cik, value: h.value, weight: h.weight, shares: h.shares, period: f.period });
  }
  return {
    symbol: sym,
    name: name || qt?.name || social?.title || sym,
    sector,
    quote: qt,
    history: hist,
    news: news.slice(0, 15),
    social,
    insider: insiderTrades().filter((t) => t.ticker === sym).slice(0, 30),
    congress: (cong?.trades || []).filter((t) => t.ticker === sym).slice(0, 30),
    fundTrades: (sup?.trades || []).filter((t) => t.ticker === sym).slice(0, 30),
    holders,
  };
});

route('GET', '/api/search', async (req, res, p, b, q) => {
  const term = (q.get('q') || '').trim();
  if (!term) return { results: [] };
  const up = term.toUpperCase();
  const lo = term.toLowerCase();
  const m = await tickerMap().catch(() => ({ byTicker: {} }));
  const results = [];
  if (m.byTicker[up]) results.push({ kind: 'ticker', id: up, label: up, sub: m.byTicker[up].title });
  for (const [t, v] of Object.entries(m.byTicker)) {
    if (results.length >= 12) break;
    if (t !== up && (t.startsWith(up) || v.title.toLowerCase().includes(lo))) results.push({ kind: 'ticker', id: t, label: t, sub: v.title });
  }
  for (const f of FUNDS) if ((f.name + ' ' + f.manager).toLowerCase().includes(lo)) results.unshift({ kind: 'fund', id: f.cik, label: f.name, sub: f.manager });
  const cong = await congressOverview().catch(() => null);
  const members = new Set();
  for (const t of cong?.trades || []) if (t.member.toLowerCase().includes(lo)) members.add(t.member);
  for (const mm of [...members].slice(0, 5)) results.unshift({ kind: 'member', id: mm, label: mm, sub: 'Member of Congress' });
  return { results: results.slice(0, 15) };
});

route('GET', '/api/reports', async () => ({ ai: aiEnabled(), reports: store.listReports(), saved: store.getState().saved }));
route('GET', '/api/reports/:id', async (req, res, p) => store.getReport(p.id) || [404, { error: 'not found' }]);
route('DELETE', '/api/reports/:id', async (req, res, p) => {
  store.deleteReport(p.id);
  broadcast('report', { id: p.id, status: 'deleted' });
  return { ok: true };
});
route('POST', '/api/reports/:id/save', async (req, res, p) => {
  const saved = store.toggleSaved(p.id);
  broadcast('state', store.getState());
  return { saved };
});
route('POST', '/api/reports', async (req, res, p, body) => {
  const ticker = body.ticker ? String(body.ticker).toUpperCase().slice(0, 12) : null;
  const topic = body.topic ? String(body.topic).slice(0, 500) : null;
  // gather live context for the model
  const settle = async (pr) => pr.then((v) => v, () => null);
  let context;
  if (ticker) {
    const [qt, social, news, cong, sup] = await Promise.all([
      settle(quotes([ticker])),
      settle(stocktwitsSymbol(ticker)),
      settle(tickerNews(ticker)),
      settle(congressOverview()),
      settle(superOverview()),
    ]);
    context = {
      quote: qt?.[ticker],
      socialSentiment: social && { bullish: social.bullish, bearish: social.bearish, sample: social.sample, messages: social.messages.slice(0, 12).map((m) => m.body) },
      headlines: (news || []).slice(0, 12).map((n) => ({ title: n.title, source: n.source, at: new Date(n.at).toISOString() })),
      insiderTrades: insiderTrades().filter((t) => t.ticker === ticker).slice(0, 20),
      congressTrades: (cong?.trades || []).filter((t) => t.ticker === ticker).slice(0, 20),
      fundMoves: (sup?.trades || []).filter((t) => t.ticker === ticker).slice(0, 20),
    };
  } else {
    const [idx, st, rd, ins, cong, sup, news] = await Promise.all([
      settle(indexes()),
      settle(stocktwitsTrending()),
      settle(reddit('all-stocks')),
      settle(insiderOverview()),
      settle(congressOverview()),
      settle(superOverview()),
      settle(headlines('for-you', store.getState().watchlist)),
    ]);
    context = {
      indexes: idx?.map((i) => ({ name: i.label, price: i.price, changePct: i.changePct })),
      watchlist: store.getState().watchlist,
      socialTrending: st?.slice(0, 8).map(({ symbol, title, summary, bullish, bearish }) => ({ symbol, title, summary, bullish, bearish })),
      redditRisers: rd?.risers?.slice(0, 8),
      insiderClusterBuys: ins?.clusters?.slice(0, 8).map(({ trades, ...c }) => c),
      congressBuying90d: cong?.windows?.['90d']?.buying?.slice(0, 8),
      fundConvictionNew: sup?.conviction?.New?.slice(0, 6),
      headlines: news?.slice(0, 25).map((n) => ({ title: n.title, source: n.source })),
    };
  }
  const r = requestReport({ topic, ticker, context });
  broadcast('report', { id: r.id, status: r.status });
  return r;
});

route('GET', '/api/events', async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write(`event: hello\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`);
  clients.add(res);
  const ka = setInterval(() => res.write(': ka\n\n'), 25e3);
  req.on('close', () => {
    clearInterval(ka);
    clients.delete(res);
  });
  return undefined; // keep open
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname);
  if (url.pathname !== '/api/login' && url.pathname !== '/api/health' && !authed(req)) return send(res, 401, { error: 'auth required' });
  const r = routes.find((r) => r.method === req.method && r.re.test(url.pathname));
  if (!r) return send(res, 404, { error: 'not found' });
  try {
    const params = r.re.exec(url.pathname).groups || {};
    const body = ['POST', 'PUT'].includes(req.method) ? await readBody(req) : {};
    const out = await r.fn(req, res, params, body, url.searchParams);
    if (out === undefined) return;
    if (Array.isArray(out)) return send(res, out[0], out[1]);
    send(res, 200, out);
  } catch (e) {
    console.error(url.pathname, e);
    if (!res.headersSent) send(res, 502, { error: String(e.message || e) });
  }
});
server.listen(PORT, () => console.log(`Finance One-Stop running on http://localhost:${PORT}${PASSCODE ? ' (passcode required)' : ''}`));
