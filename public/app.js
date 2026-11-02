// Finance One-Stop front end: hash-routed views, live updates over SSE, no build step.

// ---------------- icons (stroke icons drawn for this app) ----------------
const ICONS = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>',
  starO: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  markets: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  watch: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  ideas: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  news: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
  award: '<circle cx="12" cy="8" r="5"/><path d="M8.5 12.5L7 21l5-3 5 3-1.5-8.5"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pie: '<path d="M12 3v9h9a9 9 0 1 1-9-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16l3-4 3 2 5-7"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  trendUp: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  trendDown: '<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
  exit: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="M14 8l4 4-4 4M18 12H9"/>',
  fire: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1.5 2 2 3 2-1-2-.5-5 0-7z"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 5v3M3.5 12h1.5l-1.5 2H5M3.5 17H5v2H3.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  bank: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z"/><path d="M12 8v5M9.5 10.5h5"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  dip: '<path d="M3 6l7 7 4-4 7 7"/><path d="M15 16h6v-6"/>',
};
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

// ---------------- helpers ----------------
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = (v, d = 1) => {
  if (v == null || isNaN(v)) return '—';
  const a = Math.abs(v), s = v < 0 ? '−' : '';
  if (a >= 1e12) return `${s}$${(a / 1e12).toFixed(d)}T`;
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(d)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(d)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(a >= 1e5 ? 0 : d)}K`;
  return `${s}$${a.toFixed(2)}`;
};
const price = (v) => (v == null || isNaN(v) ? '—' : v >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toFixed(2));
const pct = (v, d = 1) => (v == null || isNaN(v) ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(d)}%`);
const cls = (v) => (v == null || isNaN(v) ? 'muted' : v >= 0 ? 'up' : 'down');
// "$50,001 - $100,000" -> "$50K - $100K" (filers use x,001 lower bounds)
const amountRange = (a = '') =>
  String(a).replace(/\$([\d,]+)/g, (_, n) => {
    let v = Number(n.replace(/,/g, ''));
    if (v > 1000 && v % 1000 === 1) v -= 1;
    return money(v, 0);
  });
const trimDot = (s) => String(s || '').replace(/\.+$/, '');
const num = (v) => (v == null ? '—' : Number(v).toLocaleString());
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dateFmt = (d, year = true) => {
  if (!d) return '—';
  const x = typeof d === 'number' ? new Date(d) : new Date(String(d).length === 10 ? d + 'T12:00:00' : d);
  if (isNaN(x)) return String(d);
  return `${MONTHS[x.getMonth()]} ${x.getDate()}${year ? ', ' + x.getFullYear() : ''}`;
};
const ago = (t) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
const hue = (s) => Math.abs(hash(s)) % 360;
const SECTOR_COLORS = {
  Technology: '#22a6c9', 'Financial Services': '#e5c400', Healthcare: '#b8e986', 'Consumer Cyclical': '#c2185b', Industrials: '#34c759',
  'Communication Services': '#e8735a', 'Consumer Defensive': '#d0021b', Energy: '#5e35b1', 'Basic Materials': '#d48fd8', 'Real Estate': '#56627a', Utilities: '#26a69a', Other: '#3a3b40',
};

function logo(ticker, size = '', src) {
  const t = esc(ticker || '?');
  const letters = esc(String(ticker || '?').replace(/[^A-Z0-9]/gi, '').slice(0, 4));
  const bg = `hsl(${hue(ticker)},45%,32%)`;
  const url = src !== undefined ? src : (ticker && /^[A-Z.\-]{1,6}$/.test(ticker) ? `https://logos.stocktwits-cdn.com/${ticker}.png` : null);
  return `<span class="logo ${size}" style="background:${bg}" title="${t}">${letters}${
    url ? `<img src="${esc(url)}" alt="" loading="lazy" style="position:absolute;inset:0" onerror="this.remove()">` : ''
  }</span>`;
}
function avatar(name, bioguide, size = '') {
  const initials = esc(String(name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join(''));
  const img = bioguide ? `<img src="https://unitedstates.github.io/images/congress/225x275/${esc(bioguide)}.jpg" alt="" loading="lazy" onerror="this.remove()">` : '';
  return `<span class="avatar ${size}" style="background:hsl(${hue(name)},30%,28%)">${img || initials}</span>`;
}
function art(seed) {
  // Procedural cover art for AI reports (no external images)
  const h = hue(seed), h2 = (h + 40) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 140'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h},55%,78%)'/><stop offset='1' stop-color='hsl(${h2},60%,38%)'/></linearGradient></defs><rect width='200' height='140' fill='url(%23g)'/>${Array.from({ length: 9 }, (_, i) => {
    const x = 10 + i * 21, hh = 30 + ((Math.abs(hash(seed + i)) % 70));
    return `<rect x='${x}' y='${140 - hh}' width='14' height='${hh}' fill='hsl(${h2},40%,${18 + (i % 3) * 6}%)' opacity='.85'/>`;
  }).join('')}<circle cx='${40 + (Math.abs(hash(seed)) % 120)}' cy='38' r='18' fill='hsl(${h},90%,92%)' opacity='.7'/></svg>`;
  return `background-image:url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, '%23')}")`;
}

// ---------------- API ----------------
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  if (res.status === 401) {
    showLogin();
    throw new Error('auth');
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}
const cache = new Map(); // path -> {at, data}
async function load(path, { force = false } = {}) {
  const c = cache.get(path);
  if (!force && c && Date.now() - c.at < 30e3) return c.data;
  const data = await api(path);
  cache.set(path, { at: Date.now(), data });
  return data;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.hidden = true), 2600);
}

// ---------------- global state ----------------
const S = {
  watchlist: [],
  saved: [],
  quotes: {},
  indexes: [],
  ui: JSON.parse(localStorage.getItem('fos-ui') || '{}'),
};
const saveUI = () => {
  try {
    localStorage.setItem('fos-ui', JSON.stringify(S.ui));
  } catch {}
};
const ui = (k, d) => S.ui[k] ?? d;
const setUI = (k, v) => {
  S.ui[k] = v;
  saveUI();
  render();
};

async function setWatchlist(list) {
  S.watchlist = list;
  const r = await api('/api/watchlist', { method: 'PUT', body: { watchlist: list } });
  S.watchlist = r.watchlist;
}
async function toggleWatch(t) {
  t = t.toUpperCase();
  const on = S.watchlist.includes(t);
  await setWatchlist(on ? S.watchlist.filter((x) => x !== t) : [...S.watchlist, t]);
  toast(on ? `Removed ${t} from watchlist` : `Added ${t} to watchlist`);
  render(true);
}

// ---------------- nav ----------------
const NAV = [
  { id: 'markets', label: 'Markets', icon: 'markets' },
  { id: 'watchlist', label: 'Watchlist', icon: 'watch' },
  { id: 'explore', label: 'Explore', icon: 'explore' },
  { id: 'ideas', label: 'Ideas', icon: 'ideas' },
  { id: 'headlines', label: 'Headlines', icon: 'news' },
];
const EXPLORE_TABS = [
  { id: 'super', label: 'Super-Investors' },
  { id: 'congress', label: 'Congress' },
  { id: 'social', label: 'Socials' },
  { id: 'insider', label: 'Insider' },
];

function drawChrome(route) {
  const top = route[0] || 'markets';
  $('#menuBtn').innerHTML = icon('menu');
  $('#searchBtn').innerHTML = icon('search');
  $('.icon-btn.star').innerHTML = icon('star');
  $('#bottomNav').innerHTML = NAV.map(
    (n) => `<a href="#/${n.id}" class="${top === n.id ? 'on' : ''}">${icon(n.icon, 'lg')}<span>${n.label}</span>${n.id === 'ideas' && S.newReports ? '<i class="badge-dot"></i>' : ''}</a>`,
  ).join('');
  $('#rail').innerHTML = `<div class="brand"><img src="/icons/icon.svg" alt="">Finance One-Stop</div>${NAV.map(
    (n) => `<a href="#/${n.id}" class="${top === n.id ? 'on' : ''}">${icon(n.icon)}${n.label}${n.id === 'ideas' && S.newReports ? '<i class="badge-dot" style="right:12px;top:18px"></i>' : ''}</a>`,
  ).join('')}<div class="rail-foot">Data: SEC EDGAR, House Clerk, StockTwits, ApeWisdom, Yahoo Finance, news RSS.<br>Not investment advice.</div>`;
}

function setTabs(tabs, active, base) {
  $('#tabs').innerHTML = tabs.map((t) => `<a href="#/${base}/${t.id}" class="${t.id === active ? 'on' : ''}">${esc(t.label)}</a>`).join('');
  const on = $('#tabs a.on');
  if (on) on.scrollIntoView({ inline: 'nearest', block: 'nearest' });
}

// ---------------- router ----------------
let renderSeq = 0;
let lastRouteKey = '';
async function render(soft = false) {
  const route = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent).filter(Boolean);
  if (!route.length) route.push('markets');
  const key = route.join('/');
  const changed = key !== lastRouteKey;
  lastRouteKey = key;
  drawChrome(route);
  const seq = ++renderSeq;
  const view = $('#view');
  const fn = VIEWS[route[0]] || VIEWS.markets;
  $('#tabs').innerHTML = '';
  if (changed && !soft) {
    view.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
    window.scrollTo(0, 0);
  }
  try {
    const html = await fn(route.slice(1), { soft, force: soft });
    if (seq !== renderSeq) return;
    if (html != null) view.innerHTML = html;
    afterRender();
  } catch (e) {
    if (seq !== renderSeq || e.message === 'auth') return;
    view.innerHTML = `<div class="empty">Couldn't load this view: ${esc(e.message)}<br><br><button class="btn" onclick="location.reload()">${icon('refresh', 'sm')} Retry</button></div>`;
  }
}
window.addEventListener('hashchange', () => render());

// delegated interactions: elements with data-act="name" data-*
const ACTIONS = {};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  e.preventDefault();
  e.stopPropagation();
  ACTIONS[el.dataset.act]?.(el.dataset, el);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el) ACTIONS[el.dataset.change]?.({ ...el.dataset, value: el.value }, el);
});
ACTIONS.ui = (d) => setUI(d.key, d.val);
ACTIONS.uiSelect = (d) => setUI(d.key, d.value);
ACTIONS.watch = (d) => toggleWatch(d.t);
ACTIONS.go = (d) => (location.hash = d.href);
ACTIONS.expand = (d) => setUI(d.key, !ui(d.key, false));

function afterRender() {
  // live price spans
  document.querySelectorAll('[data-q]').forEach((el) => paintQuote(el));
}
function paintQuote(el) {
  const q = S.quotes[el.dataset.q];
  if (!q) return;
  if (el.dataset.f === 'price') el.textContent = price(q.price);
  if (el.dataset.f === 'chg') {
    el.textContent = pct(q.changePct, 2);
    el.className = cls(q.changePct) + ' num';
  }
}

// ---------------- shared bits ----------------
const secHead = (ic, title, more, desc, extra = '') =>
  `<div class="sec-head"><h2>${icon(ic)}${esc(title)}${extra}</h2>${more ? `<a class="more" href="${more.href}" ${more.act ? `data-act="${more.act}" data-key="${more.key}"` : ''}>${esc(more.label || 'See all')} ${icon('chevron', 'sm')}</a>` : ''}</div>${desc ? `<p class="sec-desc">${esc(desc)}</p>` : ''}`;
const seeAll = (key) => ({ href: '#', act: 'expand', key, label: ui(key, false) ? 'Show less' : 'See all' });
const selectBox = (key, value, options) =>
  `<label class="select"><span>${esc(options.find((o) => o[0] === value)?.[1] || value)}</span>${icon('filter', 'sm')}<select data-change="uiSelect" data-key="${key}">${options
    .map(([v, l]) => `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(l)}</option>`)
    .join('')}</select></label>`;
const dropdown = (key, value, options) =>
  `<label class="select"><span>${esc(options.find((o) => o[0] === value)?.[1] || value)}</span>${icon('down', 'sm')}<select data-change="uiSelect" data-key="${key}">${options
    .map(([v, l]) => `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(l)}</option>`)
    .join('')}</select></label>`;
const seg = (key, value, options) =>
  `<div class="seg">${options.map(([v, l, ic]) => `<button class="${v === value ? 'on' : ''}" data-act="ui" data-key="${key}" data-val="${esc(v)}">${ic ? icon(ic, 'sm') : ''}${esc(l)}</button>`).join('')}</div>`;
const sbar = (b, r, mini) => {
  if (b == null) return `<div class="sbar ${mini ? 'mini' : ''}" style="background:var(--card-2)"></div>`;
  const n = Math.max(0, 1 - b - r);
  return `<div class="sbar ${mini ? 'mini' : ''}"><i class="b" style="width:${b * 100}%"></i><i class="n" style="width:${n * 100}%"></i><i class="r" style="width:${r * 100}%"></i></div>`;
};
const tickerLink = (t) => `#/ticker/${encodeURIComponent(t)}`;
const sparkline = (pts, up) => {
  if (!pts || pts.length < 2) return '';
  const min = Math.min(...pts), max = Math.max(...pts), w = 90, h = 32;
  const d = pts.map((p, i) => `${((i / (pts.length - 1)) * w).toFixed(1)},${(h - 2 - ((p - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`).join(' L');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}"><path d="M${d}" fill="none" stroke="${up ? 'var(--green)' : 'var(--red)'}" stroke-width="1.6"/></svg>`;
};

// ---------------- views ----------------
const VIEWS = {};

// Markets home
VIEWS.markets = async (_, o) => {
  $('#pageTitle').textContent = 'Markets';
  const [m, st, ins, cong] = await Promise.all([
    load('/api/market', o),
    load('/api/social/stocktwits', o).catch(() => null),
    load('/api/insider', o).catch(() => null),
    load('/api/congress', o).catch(() => null),
  ]);
  S.indexes = m.indexes;
  Object.assign(S.quotes, m.quotes);
  paintTape();
  const idx = m.indexes.filter((i) => i.price != null);
  return `
  <div class="grid two">
    <div class="section">
      ${secHead('chart', 'Market Pulse', null, 'Major indexes, rates and commodities — refreshes live while the app is open.')}
      <div class="list-card">${
        idx.length
          ? idx
              .map(
                (i) => `<a class="row" href="${tickerLink(i.symbol)}"><div class="main"><div class="t1">${esc(i.label)}</div><div class="t3">${esc(i.symbol)}</div></div>${sparkline(i.spark, i.changePct >= 0)}<div class="right"><div class="num big" style="font-size:18px" data-q="${esc(i.symbol)}" data-f="price">${price(i.price)}</div><div class="${cls(i.changePct)} num" data-q="${esc(i.symbol)}" data-f="chg">${pct(i.changePct, 2)}</div></div></a>`,
              )
              .join('')
          : '<div class="empty">Price feed unavailable right now. It will retry automatically.</div>'
      }</div>
    </div>
    <div class="section">
      ${secHead('star', 'Your Watchlist', { href: '#/watchlist', label: 'Edit' }, 'Synced between all your devices.')}
      ${watchRows()}
    </div>
  </div>
  <div class="grid three">
    <div class="section">${secHead('fire', 'Trending on StockTwits', { href: '#/explore/social' })}
      <div class="list-card">${(st?.trending || []).slice(0, 5).map((s) => `<a class="row" href="${tickerLink(s.symbol)}">${logo(s.symbol, 'sm', s.logo)}<div class="main"><div class="t1">${esc(s.symbol)}</div><div class="t3">${esc(s.title)}</div></div>${sbar(s.bullish, s.bearish, true)}</a>`).join('') || '<div class="empty">Loading…</div>'}</div></div>
    <div class="section">${secHead('users', 'Insider Cluster Buys', { href: '#/explore/insider' })}
      <div class="list-card">${(ins?.clusters || []).slice(0, 5).map((c) => `<a class="row" href="${tickerLink(c.ticker)}">${logo(c.ticker, 'sm')}<div class="main"><div class="t1">${esc(c.ticker)}</div><div class="t3">${esc(c.company)}</div></div><div class="right"><div class="up" style="font-weight:700">${c.count} insiders</div><div class="t3">${money(c.value)}</div></div></a>`).join('') || '<div class="empty">Collecting Form 4 filings…</div>'}</div></div>
    <div class="section">${secHead('bank', 'Congress Is Buying', { href: '#/explore/congress' })}
      <div class="list-card">${(cong?.windows?.['90d']?.buying || []).slice(0, 5).map((c) => `<a class="row" href="${tickerLink(c.ticker)}">${logo(c.ticker, 'sm')}<div class="main"><div class="t1">${esc(c.ticker)}</div><div class="t3">${esc(c.company)}</div></div><div class="right up" style="font-weight:700">${c.count} member${c.count > 1 ? 's' : ''}</div></a>`).join('') || '<div class="empty">Parsing disclosures…</div>'}</div></div>
  </div>
  <p class="foot">Prices may be delayed. Disclosures lag the actual trades (Form 4: 2 business days, Congress: up to 45 days, 13F: up to 45 days after quarter end). Not investment advice.</p>`;
};

function watchRows(editable = false) {
  if (!S.watchlist.length) return '<div class="list-card"><div class="empty">Your watchlist is empty. Tap ☆ on any stock to add it.</div></div>';
  return `<div class="list-card">${S.watchlist
    .map((t) => {
      const q = S.quotes[t] || {};
      return `<div class="row watch-row"><a href="${tickerLink(t)}" style="display:contents">${logo(t)}<div class="main"><div class="t1">${esc(t)}</div><div class="t3">${esc(q.name || '')}</div></div>${sparkline(q.spark, q.changePct >= 0)}<div class="right"><div class="num" style="font-weight:700;font-size:17px" data-q="${esc(t)}" data-f="price">${price(q.price)}</div><div class="${cls(q.changePct)} num" data-q="${esc(t)}" data-f="chg">${pct(q.changePct, 2)}</div></div></a>${
        editable ? `<button class="rm" data-act="watch" data-t="${esc(t)}" aria-label="Remove ${esc(t)}">${icon('x', 'sm')}</button>` : ''
      }</div>`;
    })
    .join('')}</div>`;
}

VIEWS.watchlist = async (_, o) => {
  $('#pageTitle').textContent = 'Watchlist';
  const q = await load('/api/quotes?symbols=' + encodeURIComponent(S.watchlist.join(',')), o).catch(() => ({}));
  Object.assign(S.quotes, q);
  return `<div class="section">
    <form class="search" id="addForm" onsubmit="return false">${icon('plus')}<input id="addInput" placeholder="Add a ticker, e.g. TSLA" autocapitalize="characters" autocomplete="off"><button class="btn primary" data-act="addWatch">Add</button></form>
    ${watchRows(true)}
    <p class="foot">Your watchlist lives on your server, so it is the same on your PC and phone. It also personalises the Headlines "For You" feed.</p>
  </div>`;
};
ACTIONS.addWatch = async () => {
  const v = $('#addInput').value.trim().toUpperCase();
  if (!v) return;
  if (!S.watchlist.includes(v)) await setWatchlist([...S.watchlist, v]);
  cache.clear();
  render(true);
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'addInput') ACTIONS.addWatch();
  if (e.key === 'Escape') closeSheet();
  if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
    e.preventDefault();
    openSearch();
  }
});

// Explore
VIEWS.explore = async (r, o) => {
  $('#pageTitle').textContent = 'Explore';
  const tab = EXPLORE_TABS.find((t) => t.id === r[0]) ? r[0] : ui('exploreTab', 'super');
  if (r[0] !== tab) history.replaceState(null, '', `#/explore/${tab}`);
  S.ui.exploreTab = tab;
  saveUI();
  const html = await EXPLORE[tab](o);
  setTabs(EXPLORE_TABS, tab, 'explore');
  return html;
};
const EXPLORE = {};

// --- Super-investors
EXPLORE.super = async (o) => {
  const d = await load('/api/super', o);
  const q = (ui('superQ', '') || '').toLowerCase();
  const funds = d.funds.filter((f) => !q || (f.name + ' ' + f.manager).toLowerCase().includes(q));
  const popular = ui('superAll', false) ? funds : funds.filter((f) => f.popular || q).slice(0, 6);
  const convType = ui('convType', 'New');
  const conv = d.conviction[convType] || [];
  const tradeType = ui('superTrade', 'all');
  const trades = d.trades.filter((t) => tradeType === 'all' || t.type === tradeType).filter((t) => Math.abs(t.deltaValue) > 0);
  const topTrades = [...trades].sort((a, b) => b.filed.localeCompare(a.filed) || Math.abs(b.deltaValue) - Math.abs(a.deltaValue)).slice(0, ui('superTradesAll', false) ? 40 : 3);
  const qLabel = (p) => (p ? `${p.slice(0, 4)} Q${Math.ceil(Number(p.slice(5, 7)) / 3)}` : '');
  const topAum = [...d.funds].sort((a, b) => b.aum - a.aum);
  return `
  <label class="search">${icon('search')}<input value="${esc(ui('superQ', ''))}" placeholder="Search super investors…" data-change="uiSelect" data-key="superQ"></label>
  <div class="grid two">
  <div class="section">
    ${secHead('users', 'Popular Investors', seeAll('superAll'), 'Well-known managers and funds tracked through their quarterly 13F filings.')}
    <div class="list-card">${popular
      .map(
        (f) => `<a class="row" href="#/fund/${f.cik}">${logo(f.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase(), 'lg', '')}<div class="main"><div class="t1">${esc(f.name)}</div><div class="t2">${esc(f.manager)}</div><div class="t3">${money(f.aum)} reported · ${f.positions} positions · ${qLabel(f.period)}</div></div><div class="right"><div class="${cls(f.prevAum ? f.aum / f.prevAum - 1 : null)} big num" style="font-size:19px">${f.prevAum ? pct((f.aum / f.prevAum - 1) * 100) : '—'}</div><div class="t3">13F value QoQ</div></div></a>`,
      )
      .join('') || '<div class="empty">No matches.</div>'}</div>
  </div>
  <div class="section">
    ${secHead('award', 'Top Conviction Plays', null, 'Stocks the most tracked funds moved on in the same quarter. Ranked by number of funds making the same type of trade.')}
    ${seg('convType', convType, [['New', 'New', 'sparkle'], ['Added', 'Added', 'trendUp'], ['Reduced', 'Reduced', 'trendDown'], ['Exited', 'Exited', 'exit']])}
    <div class="select"><span>${qLabel(d.period)}</span>${icon('filter', 'sm')}</div>
    ${conv
      .slice(0, ui('convAll', false) ? 10 : 3)
      .map(
        (c) => `<a class="row plain" href="${c.ticker ? tickerLink(c.ticker) : '#'}" title="${esc(c.funds.join(', '))}">${logo(c.ticker || c.name.slice(0, 3).toUpperCase())}<div class="main"><div class="t1">${esc(c.ticker || c.name)}</div><div class="t3">${esc(c.name)}</div></div><div class="right ${convType === 'New' || convType === 'Added' ? 'up' : 'down'}" style="font-weight:800;font-size:19px">${c.funds.length} investor${c.funds.length > 1 ? 's' : ''}</div></a>`,
      )
      .join('') || '<div class="empty">No overlapping moves this quarter.</div>'}
    ${conv.length > 3 ? `<button class="btn block" data-act="expand" data-key="convAll">${ui('convAll', false) ? 'Show less' : 'Show top 10'}</button>` : ''}
  </div>
  </div>
  <div class="grid two">
  <div class="section">
    ${secHead('trophy', 'Largest Funds', null, 'Ranked by total reported 13F market value in the latest filing.')}
    <div class="podium">${topAum
      .slice(0, 3)
      .map(
        (f, i) => `<a class="pod ${i === 0 ? 'first' : ''}" href="#/fund/${f.cik}"><span class="rank r${i + 1}">${i + 1}</span>${logo(f.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase(), '', '')}<div class="tk" style="font-size:16px">${esc(f.name)}</div><div class="nm">${esc(f.manager)}</div><div class="val">${money(f.aum)}</div><div class="sub">${f.positions} positions</div></a>`,
      )
      .join('')}</div>
  </div>
  <div class="section">
    ${secHead('clock', 'Latest Notable Trades', seeAll('superTradesAll'), 'The newest buys and sells reported by big funds.')}
    ${selectBox('superTrade', tradeType, [['all', 'All Trade Types'], ['New', 'New positions'], ['Added', 'Added'], ['Reduced', 'Reduced'], ['Exited', 'Exited']])}
    <div class="label" style="margin:6px 0 12px">Top ${topTrades.length} Trades</div>
    <div class="card">${topTrades.map(fundTradeCard).join('') || '<div class="empty">No trades.</div>'}</div>
  </div>
  </div>
  <div class="section">
    ${secHead('pie', 'Sector Capital Concentration', null, `How each tracked fund allocates its top 25 holdings across sectors (${qLabel(d.period)}).`)}
    ${sectorStacks(d)}
  </div>
  <p class="foot">Source: SEC EDGAR Form 13F-HR. 13F filings are due 45 days after quarter end and only include US-listed long positions.</p>`;
};
function fundTradeCard(t) {
  const tk = t.ticker || t.name.slice(0, 4).toUpperCase();
  const typeCls = t.type.toLowerCase();
  const ic = { New: 'sparkle', Added: 'trendUp', Reduced: 'trendDown', Exited: 'exit' }[t.type];
  return `<div class="trade"><a class="trade-head" href="${t.ticker ? tickerLink(t.ticker) : '#/fund/' + t.cik}">${logo(tk)}<div class="main"><div class="tk">${esc(tk)} <span class="pill ${typeCls}">${icon(ic, 'sm')}${t.type}</span></div><div class="nm">${esc(t.name)}</div></div>${icon('chevron', 'sm')}</a>
  <div class="kv"><div><div class="label">Investor</div><div class="v"><a href="#/fund/${t.cik}">${esc(t.fund)}</a></div></div><div><div class="label">Est. value</div><div class="v big ${t.deltaValue >= 0 ? 'up' : 'down'}">${money(Math.abs(t.deltaValue))}</div></div>
  <div><div class="label">Avg price</div><div class="v">$${price(t.avgPrice)}</div></div><div><div class="label">Disclosed</div><div class="v">${dateFmt(t.filed)}</div></div></div></div>`;
}
function sectorStacks(d) {
  const legendSectors = [...d.sectors, 'Other'];
  const rows = d.sectorMix
    .map(
      (m) => `<div class="stackrow"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.fund)}</div><div class="bar">${legendSectors
        .map((s) => {
          const v = s === 'Other' ? m.other : m.mix[s];
          return v > 0.002 ? `<i style="width:${v * 100}%;background:${SECTOR_COLORS[s]}" title="${esc(s)} ${(v * 100).toFixed(1)}%"></i>` : '';
        })
        .join('')}</div></div>`,
    )
    .join('');
  const total = {};
  d.sectorMix.forEach((m) => legendSectors.forEach((s) => (total[s] = (total[s] || 0) + (s === 'Other' ? m.other : m.mix[s]) / d.sectorMix.length)));
  return `<div class="card pad">${rows}<div class="legend">${legendSectors
    .map((s) => `<div><span class="sw" style="background:${SECTOR_COLORS[s]}"></span>${esc(s)}</div><div class="num">${(total[s] * 100).toFixed(2)}%</div>`)
    .join('')}</div><div class="updated">Legend shows the average weight across tracked funds.</div></div>`;
}

// --- Congress
EXPLORE.congress = async (o) => {
  const d = await load('/api/congress', o);
  const q = (ui('congQ', '') || '').toLowerCase();
  const filt = (arr) => arr.filter((t) => !q || t.member.toLowerCase().includes(q) || t.ticker.toLowerCase().includes(q));
  const sus = filt(d.suspicious);
  const win = ui('congWin', '90d');
  const flowWin = ui('flowWin', '30d');
  const buying = d.windows[win]?.buying || [];
  const flows = d.windows[flowWin]?.flows || [];
  const recent = filt(d.trades);
  return `
  <label class="search">${icon('search')}<input value="${esc(ui('congQ', ''))}" placeholder="Search a member or ticker" data-change="uiSelect" data-key="congQ"></label>
  ${q ? `<div class="section">${secHead('list', `Trades matching “${ui('congQ', '')}”`)}<div class="card">${recent.slice(0, 30).map(congressCard).join('') || '<div class="empty">No matches.</div>'}</div></div>` : ''}
  <div class="grid two">
  <div class="section">
    ${secHead('alert', 'Recent Suspicious Trades', seeAll('susAll'), 'Trades in sectors overseen by a committee the member sits on. They may know more from that work.')}
    <div class="card">${sus.slice(0, ui('susAll', false) ? 25 : 1).map(congressCard).join('') || '<div class="empty">No committee-conflict trades in the tracked filings.</div>'}</div>
  </div>
  <div class="section">
    ${secHead('trophy', 'Who Beats The Market?', seeAll('leadAll'), 'Members ranked by average return of their disclosed trades since the trade date, minus the S&P 500 over the same period (sales count as wins if the stock fell).')}
    <div class="podium">${d.leaders
      .slice(0, 3)
      .map(
        (l, i) => `<a class="pod ${i === 0 ? 'first' : ''}" href="#/member/${encodeURIComponent(l.member)}"><span class="rank r${i + 1}">${i + 1}</span>${avatar(l.member, l.bioguide)}<div class="tk" style="font-size:16px">${esc(l.member)}</div><div class="nm">${esc(l.party || '')} · ${esc(l.stateDst)} · ${l.n} trades</div><div class="val ${cls(l.excess)}">${pct(l.excess)}</div><div class="sub">vs S&amp;P 500</div></a>`,
      )
      .join('') || '<div class="empty" style="grid-column:1/-1">Needs price history; check back shortly.</div>'}</div>
    ${ui('leadAll', false) ? `<div class="list-card" style="margin-top:12px">${d.leaders.map((l, i) => `<a class="row" href="#/member/${encodeURIComponent(l.member)}"><span class="muted num" style="width:22px">${i + 1}</span>${avatar(l.member, l.bioguide)}<div class="main"><div class="t1" style="font-size:16px">${esc(l.member)}</div><div class="t3">${l.n} trades · avg ${pct(l.ret)}</div></div><div class="right ${cls(l.excess)}" style="font-weight:800">${pct(l.excess)}</div></a>`).join('')}</div>` : ''}
  </div>
  </div>
  <div class="grid two">
  <div class="section">
    ${secHead('chart', 'What Is Congress Buying?', seeAll('buyAll'), 'Tickers with the most overlapping congressional buys, ranked by member count.')}
    ${selectBox('congWin', win, [['30d', '30d'], ['90d', '90d'], ['365d', '1y']])}
    ${buying
      .slice(0, ui('buyAll', false) ? 15 : 3)
      .map((b) => `<a class="row plain" href="${tickerLink(b.ticker)}" title="${esc(b.members.join(', '))}">${logo(b.ticker)}<div class="main"><div class="t1">${esc(b.ticker)}</div><div class="t3">${esc(b.company)}</div></div><div class="right up" style="font-weight:800;font-size:19px">${b.count} member${b.count > 1 ? 's' : ''}</div></a>`)
      .join('') || '<div class="empty">No buys in this window yet.</div>'}
  </div>
  <div class="section">
    ${secHead('grid', 'Top Congress Trading Sectors', null, 'Where disclosed congressional money is flowing by sector. Sized by estimated trade amounts (range midpoints).')}
    ${selectBox('flowWin', flowWin, [['30d', '30d'], ['90d', '90d'], ['365d', '1y']])}
    ${treemap(flows)}
  </div>
  </div>
  <div class="grid two">
  <div class="section">
    ${secHead('sparkle', 'First-Time Buys', seeAll('firstAll'), 'Stocks bought by a member with no other congressional trade in the tracked filings.')}
    <div class="card">${d.firstBuys.slice(0, ui('firstAll', false) ? 15 : 1).map(firstBuyCard).join('') || '<div class="empty">None yet.</div>'}</div>
  </div>
  <div class="section">
    ${secHead('clock', 'Latest Disclosures', seeAll('congAll'), 'The newest periodic transaction reports, as filed.')}
    <div class="list-card">${d.trades
      .slice(0, ui('congAll', false) ? 60 : 6)
      .map((t) => `<a class="row" href="${tickerLink(t.ticker)}">${avatar(t.member, t.bioguide)}<div class="main"><div class="t1" style="font-size:16px">${esc(t.member)}</div><div class="t3">${esc(t.ticker)} · ${esc(amountRange(t.amount))} · traded ${dateFmt(t.date, false)}</div></div><span class="pill ${t.type.toLowerCase()}">${t.type}</span></a>`)
      .join('')}</div>
  </div>
  </div>
  <p class="foot">Source: U.S. House Clerk periodic transaction reports (${d.filings} most recent electronic filings). Disclosed up to 45 days after the trade. Committee data: unitedstates/congress-legislators. Not investment advice.</p>`;
};
function congressCard(t) {
  return `<div class="trade"><div class="trade-head"><a href="#/member/${encodeURIComponent(t.member)}">${avatar(t.member, t.bioguide)}</a><div class="main"><a href="#/member/${encodeURIComponent(t.member)}" class="t1" style="font-size:20px;font-weight:650">${esc(t.member)}</a><div class="nm">Traded ${dateFmt(t.date)}${t.party ? ` · <span class="pill party-${esc(t.party[0])}" style="font-size:11px;padding:2px 6px">${esc(t.party[0])}-${esc(t.stateDst)}</span>` : ''}</div></div><a class="btn" href="${esc(t.url)}" target="_blank" rel="noopener">${icon('ext', 'sm')} Source</a></div>
  <a class="card" href="${tickerLink(t.ticker)}" style="display:flex;align-items:center;gap:14px;padding:14px;margin-top:14px;background:var(--card-2)">${logo(t.ticker)}<div class="main" style="flex:1;min-width:0"><div class="tk" style="font-size:20px;font-weight:800;display:flex;gap:10px;align-items:center">${esc(t.ticker)} <span class="pill ${t.type.toLowerCase()}">${icon(t.type === 'BUY' ? 'trendUp' : 'trendDown', 'sm')}${t.type}</span></div><div class="muted" style="margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.company)}</div></div><div style="text-align:right"><div class="${cls(t.since)} big num">${pct(t.since)}</div><div class="label">since ${t.type === 'BUY' ? 'bought' : 'sold'}</div></div></a>
  <div class="kv">${t.conflict ? `<div><div class="label accent">House Committee</div><div class="v">${esc(t.conflict.name)}</div></div>` : `<div><div class="label">Owner</div><div class="v">${esc(t.owner)}</div></div>`}<div><div class="label">Disclosed amount</div><div class="v">${esc(amountRange(t.amount))}</div></div></div>
  <p class="note"><b>${esc(t.member)}</b> ${t.conflict ? `sits on the House Committee on ${esc(t.conflict.name)}, which oversees ${esc(t.sector)}, and ` : ''}${t.type === 'BUY' ? 'bought' : 'sold'} ${esc(t.amount)} of ${esc(trimDot(t.company))}${t.owner !== 'Self' ? ` (${esc(t.owner.toLowerCase())})` : ''}.</p></div>`;
}
function firstBuyCard(t) {
  return `<div class="trade"><div class="trade-head">${avatar(t.member, t.bioguide, 'lg')}<div class="main"><a href="#/member/${encodeURIComponent(t.member)}" style="font-size:20px;font-weight:650">${esc(t.member)}</a><a href="${tickerLink(t.ticker)}" style="display:flex;align-items:center;gap:10px;margin-top:8px">${logo(t.ticker, 'sm')}<span style="font-size:20px;font-weight:800">${esc(t.ticker)}</span><span class="pill buy">${icon('trendUp', 'sm')}BUY</span></a><div class="muted" style="margin-top:4px">${esc(t.company)}</div></div><a class="icon-btn" href="${esc(t.url)}" target="_blank" rel="noopener" aria-label="Source">${icon('ext', 'sm')}</a></div>
  <div class="kv"><div><div class="label">Stock since bought</div><div class="v">${dateFmt(t.date)}</div></div><div><div class="v big ${cls(t.since)}">${pct(t.since)}</div></div><div><div class="label">Price at trade</div><div class="v">${t.priceAtTrade ? '$' + price(t.priceAtTrade) : '—'}</div></div><div><div class="label">Disclosed amount</div><div class="v">${esc(amountRange(t.amount))}</div></div></div></div>`;
}
function treemap(items) {
  const data = items.filter((i) => Math.abs(i.net) > 0).map((i) => ({ ...i, w: Math.abs(i.net) }));
  if (!data.length) return '<div class="empty">No trades in this window.</div>';
  const total = data.reduce((a, b) => a + b.w, 0);
  const max = Math.max(...data.map((d) => d.w));
  const out = [];
  // slice-and-dice binary split for a balanced layout
  (function layout(arr, x, y, w, h) {
    if (!arr.length) return;
    if (arr.length === 1) return out.push({ ...arr[0], x, y, bw: w, bh: h });
    const sum = arr.reduce((a, b) => a + b.w, 0);
    let acc = 0, k = 0;
    while (k < arr.length - 1 && acc + arr[k].w < sum / 2) acc += arr[k++].w;
    if (k === 0) acc = arr[k++].w;
    const f = acc / sum;
    if (w >= h) {
      layout(arr.slice(0, k), x, y, w * f, h);
      layout(arr.slice(k), x + w * f, y, w * (1 - f), h);
    } else {
      layout(arr.slice(0, k), x, y, w, h * f);
      layout(arr.slice(k), x, y + h * f, w, h * (1 - f));
    }
  })(data.sort((a, b) => b.w - a.w), 0, 0, 100, 100);
  return `<div class="treemap">${out
    .map((r) => {
      const intensity = 0.35 + 0.65 * (r.w / max);
      const bg = r.net >= 0 ? `rgba(52,199,89,${intensity})` : `rgba(255,77,61,${intensity})`;
      const area = r.w / total;
      const fs = area > 0.15 ? 16 : area > 0.05 ? 13 : 10;
      return `<div style="left:${r.x}%;top:${r.y}%;width:${r.bw}%;height:${r.bh}%;background:${bg};font-size:${fs}px" title="${esc(r.sector)} ${money(r.net, 0)}">${area > 0.015 ? `${esc(r.sector)}<br>${r.net >= 0 ? '+' : ''}${money(r.net, 0)}` : ''}</div>`;
    })
    .join('')}</div>`;
}

// --- Socials
EXPLORE.social = async (o) => {
  const src = ui('socialSrc', 'stocktwits');
  const head = seg('socialSrc', src, [['stocktwits', 'StockTwits'], ['reddit', 'Reddit']]);
  if (src === 'stocktwits') {
    const d = await load('/api/social/stocktwits', o);
    const q = (ui('stQ', '') || '').toUpperCase();
    const list = d.trending.filter((s) => !q || s.symbol.includes(q) || (s.title || '').toUpperCase().includes(q));
    return `${head}
    <label class="search">${icon('search')}<input value="${esc(ui('stQ', ''))}" placeholder="Search tickers" data-change="uiSelect" data-key="stQ"></label>
    <div class="section">
      ${secHead('fire', 'Top Trending on StockTwits', seeAll('stAll'), 'The biggest movers on the StockTwits trending board, with why they’re trending.')}
      <div class="grid two" style="gap:14px">${list
        .slice(0, ui('stAll', false) ? 20 : 6)
        .map(
          (s) => `<div class="card pad"><a class="trade-head" href="${tickerLink(s.symbol)}">${logo(s.symbol, '', s.logo)}<div class="main"><div class="tk">${esc(s.symbol)}</div><div class="nm">${esc(s.title)}</div></div><div style="text-align:right"><div class="up big">#${s.rank || '—'}</div><div class="label" style="letter-spacing:.04em;text-transform:none;font-weight:500">trending · ${num(s.watchers)} watchers</div></div></a>
          <p class="note" style="color:var(--text);opacity:.85">${esc(s.summary || 'No summary yet.')}</p>
          ${sbar(s.bullish, s.bearish)}
          <div class="slegend"><span class="up">${s.bullish != null ? Math.round(s.bullish * 100) + '% bullish' : 'sentiment n/a'}</span><span class="muted">${s.sample ? s.sample + ' recent posts' : ''}</span><span class="down">${s.bearish != null ? Math.round(s.bearish * 100) + '% bearish' : ''}</span></div>
          <div style="display:flex;gap:10px;margin-top:14px"><a class="btn block" href="${tickerLink(s.symbol)}">Details ${icon('chevron', 'sm')}</a><button class="btn block primary" data-act="analyze" data-t="${esc(s.symbol)}">${icon('sparkle', 'sm')} Full analysis</button></div></div>`,
        )
        .join('') || '<div class="empty">No trending symbols.</div>'}</div>
    </div>
    <p class="foot">Source: StockTwits public API. Sentiment = share of recent posts tagged bullish/bearish by their authors; untagged posts count as neutral.</p>`;
  }
  const filter = ui('redditFilter', 'all-stocks');
  const d = await load('/api/social/reddit?filter=' + filter, o);
  return `${head}
  ${selectBox('redditFilter', filter, d.filters.map((f) => [f, f === 'all-stocks' ? 'All stock subreddits' : 'r/' + f]))}
  <div class="section">
    ${secHead('trendUp', 'Fastest Risers on Reddit', null, 'Largest jump in mentions vs. the prior 24 hours (min. 10 mentions).')}
    <div class="podium">${d.risers
      .slice(0, 3)
      .map((r, i) => `<a class="pod ${i === 0 ? 'first' : ''}" href="${tickerLink(r.ticker)}"><span class="rank r${i + 1}">${i + 1}</span>${logo(r.ticker)}<div class="tk">${esc(r.ticker)}</div><div class="nm">${esc(r.name)}</div><div class="val up">${pct(r.delta, 0)}</div><div class="sub">mentions · 24h</div></a>`)
      .join('')}</div>
  </div>
  <div class="section">
    ${secHead('list', 'Reddit Mention Leaderboard', seeAll('redAll'), 'Tickers with the most mentions in the last 24 hours.')}
    <div class="list-card"><table class="table"><thead><tr><th>#</th><th>Ticker</th><th class="r">Upvotes</th><th class="r">Mentions Δ</th></tr></thead><tbody>${d.leaderboard
      .slice(0, ui('redAll', false) ? 50 : 10)
      .map((r) => {
        const mv = r.prevRank ? r.prevRank - r.rank : 0;
        return `<tr class="clickable" data-act="go" data-href="/ticker/${esc(r.ticker)}"><td class="num"><b>${r.rank}</b> <span class="${mv > 0 ? 'up' : mv < 0 ? 'down' : 'muted'}">${mv > 0 ? '↑' : mv < 0 ? '↓' : '–'}</span></td><td><div style="display:flex;gap:10px;align-items:center">${logo(r.ticker, 'sm')}<div><div style="font-weight:800;font-size:17px">${esc(r.ticker)}</div><div class="muted" style="font-size:13px">${num(r.mentions)} mentions</div></div></div></td><td class="r num muted">${num(r.upvotes)}</td><td class="r num ${cls(r.delta)}" style="font-weight:700">${pct(r.delta, 0)}</td></tr>`;
      })
      .join('')}</tbody></table></div>
  </div>
  <p class="foot">Source: ApeWisdom (aggregated Reddit mentions). Mentions are not recommendations.</p>`;
};

// --- Insider
EXPLORE.insider = async (o) => {
  const d = await load('/api/insider', o);
  const f = { sort: ui('insSort', 'recent'), type: ui('insType', 'BUY'), role: ui('insRole', 'any'), min: ui('insMin', '0') };
  let rows = d.trades.filter((t) => (f.type === 'all' || t.type === f.type) && (f.role === 'any' || t.role === f.role) && t.value >= Number(f.min));
  if (f.sort === 'value') rows = [...rows].sort((a, b) => b.value - a.value);
  return `
  <div class="section">
    ${secHead('users', 'Cluster Buys', seeAll('clAll'), 'Multiple insiders buying the same stock within 30 days.')}
    <div class="podium">${d.clusters
      .slice(0, ui('clAll', false) ? 12 : 3)
      .map((c) => `<a class="pod cluster" href="${tickerLink(c.ticker)}" title="${esc(c.insiders.join(', '))}"><div class="head">${logo(c.ticker, 'sm')}${esc(c.ticker)}</div><div class="up" style="font-weight:800;font-size:19px">${c.count} insiders</div><div class="val" style="margin-top:8px">${money(c.value)}</div><div class="sub">in 30 days</div></a>`)
      .join('') || `<div class="empty" style="grid-column:1/-1">No clusters yet — the app has indexed ${d.filings} Form 4 filings so far and builds history as it runs.</div>`}</div>
  </div>
  <div class="grid two">
  <div class="section">
    ${secHead('dip', 'Notable Buy-The-Dip Trades', seeAll('dipAll'), 'Insiders buying at least 15% below the stock’s 90-day peak.')}
    ${d.dips
      .slice(0, ui('dipAll', false) ? 20 : 4)
      .map(
        (t) => `<a class="row plain" href="${tickerLink(t.ticker)}" style="border-bottom:1px solid var(--line);padding:16px 0;align-items:flex-start"><div class="main"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span style="font-weight:700;font-size:18px">${esc(t.insider)}</span><span class="pill role">${esc(t.role)}</span></div><div style="display:flex;gap:10px;align-items:center;margin-top:10px">${logo(t.ticker, 'sm')}<b style="font-size:18px">${esc(t.ticker)}</b><span class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.company)}</span></div><div style="margin-top:10px;font-size:17px"><b class="down">${Math.round(t.belowPeak * 100)}%</b> <span class="muted">below 90-day peak when bought</span></div></div><div class="right"><div class="up big">${money(t.value)}</div><div class="t3">${dateFmt(t.date, false)}</div></div></a>`,
      )
      .join('') || '<div class="empty">No qualifying dip buys right now (needs price history).</div>'}
  </div>
  <div class="section">
    ${secHead('chart', 'Most Recent Insider Trades', seeAll('insAll'), 'Recent open-market Form 4 filings, straight from SEC EDGAR.')}
    <div class="filters">
      ${dropdown('insSort', f.sort, [['recent', 'Recent'], ['value', 'Largest']])}
      ${dropdown('insType', f.type, [['BUY', 'Buys'], ['SELL', 'Sells'], ['all', 'All']])}
      ${dropdown('insRole', f.role, [['any', 'Any role'], ['CEO', 'CEO'], ['CFO', 'CFO'], ['President', 'President'], ['Chair', 'Chair'], ['Director', 'Director'], ['10% Owner', '10% Owner']])}
      ${dropdown('insMin', f.min, [['0', 'Any size'], ['100000', '$100K+'], ['1000000', '$1M+'], ['10000000', '$10M+']])}
    </div>
    <div class="label" style="margin:6px 0 12px">Top ${Math.min(rows.length, ui('insAll', false) ? 30 : 3)} Trades</div>
    <div class="card">${rows.slice(0, ui('insAll', false) ? 30 : 3).map(insiderCard).join('') || '<div class="empty">No trades match these filters yet.</div>'}</div>
  </div>
  </div>
  <p class="foot">Source: SEC EDGAR Form 4 (open-market purchases "P" and sales "S"). ${d.filings} filings indexed${d.backlog ? `, ${d.backlog} more being backfilled (about 400 every 5 minutes)` : ''}.</p>`;
};
function insiderCard(t) {
  return `<div class="trade"><div class="trade-head"><a href="${tickerLink(t.ticker)}">${logo(t.ticker)}</a><div class="main"><div class="tk"><a href="${tickerLink(t.ticker)}">${esc(t.ticker)}</a> <span class="pill ${t.type.toLowerCase()}">${icon(t.type === 'BUY' ? 'trendUp' : 'trendDown', 'sm')}${t.type}</span><a class="icon-btn" style="width:32px;height:32px" href="${esc(t.url)}" target="_blank" rel="noopener" aria-label="SEC filing">${icon('ext', 'sm')}</a></div><div class="nm">${esc(t.company)}</div></div><a href="${tickerLink(t.ticker)}">${icon('chevron', 'sm')}</a></div>
  <div class="kv"><div><div class="label">Insider</div><div class="v">${esc(t.insider)} <span class="pill role">${esc(t.role)}</span></div></div><div><div class="label">Disclosed value</div><div class="v big ${t.type === 'BUY' ? 'up' : 'down'}">${money(t.value)}</div></div><div><div class="label">Avg price</div><div class="v">$${price(t.avgPrice)}</div></div><div><div class="label">Traded</div><div class="v">${dateFmt(t.date)}</div></div></div></div>`;
}

// Ideas / AI reports
VIEWS.ideas = async (r, o) => {
  $('#pageTitle').textContent = 'Ideas';
  const tab = r[0] === 'saved' ? 'saved' : 'reports';
  S.newReports = false;
  const d = await load('/api/reports', { force: true });
  S.saved = d.saved;
  setTabs([{ id: 'reports', label: 'Reports' }, { id: 'saved', label: 'Saved' }], tab, 'ideas');
  $('#tabs').insertAdjacentHTML('beforeend', `<button class="btn light" style="margin:6px 0 6px auto;flex:none" data-act="requestReport">${icon('msg', 'sm')} Request</button>`);
  let list = d.reports;
  if (tab === 'saved') list = list.filter((x) => d.saved.includes(x.id));
  const setup = !d.ai
    ? `<div class="card pad" style="margin-bottom:18px"><b>AI reports are off.</b><p class="muted" style="margin:8px 0 0;line-height:1.5">Add <code>ANTHROPIC_API_KEY</code> to the server's environment to let Claude write research notes from the app's live data (with web search). Everything else works without it.</p></div>`
    : '';
  if (!list.length)
    return `${setup}<div class="empty">${tab === 'saved' ? 'No saved reports yet.' : 'No reports yet. Tap <b>Request</b> to have Claude research a topic or ticker using the live data in this app.'}</div>`;
  const [first, ...rest] = list;
  const statusTag = (x) => (x.status === 'pending' ? '<span class="status-pill"><span class="spin"></span> Writing…</span>' : x.status === 'error' ? `<span class="status-pill" style="color:var(--red)">Failed</span>` : '');
  const groups = {};
  rest.forEach((x) => {
    const dt = new Date(x.createdAt);
    (groups[`${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][dt.getMonth()]} ${dt.getFullYear()}`] ||= []).push(x);
  });
  return `${setup}
  <div class="grid two">
  <div>
  <a class="card hero" href="#/report/${first.id}" style="display:block"><div class="art" style="${art(first.title)}"></div><div class="body"><div class="label accent">${Date.now() - first.createdAt < 7 * 864e5 ? 'This week' : dateFmt(first.createdAt)}</div><h3>${esc(first.title)}</h3><p>${esc(first.dek || first.topic || '')}</p><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span class="muted">${dateFmt(first.createdAt, false)}${first.readMins ? ` · ${first.readMins} min read` : ''} ${statusTag(first)}</span><span class="btn primary">Read</span></div></div></a>
  </div>
  <div>
  ${Object.entries(groups)
    .map(
      ([g, xs]) => `<div class="day" style="font-size:24px">${esc(g)}</div>${xs
        .map(
          (x) => `<a class="idea" href="#/report/${x.id}"><div class="main"><h4>${esc(x.title)}</h4><div class="muted">${dateFmt(x.createdAt, false)}${x.readMins ? ` · ${x.readMins} min read` : ''} ${statusTag(x)}</div></div><div class="art" style="${art(x.title)}"></div></a>`,
        )
        .join('')}`,
    )
    .join('')}
  </div></div>`;
};
ACTIONS.requestReport = () => {
  openSheet(`<h3>Request a research report</h3>
  <p class="muted" style="margin-top:-6px">Claude writes it from this app's live data plus web search. It appears in Ideas when done (usually 1–3 minutes), on all your devices.</p>
  <textarea id="reqTopic" rows="4" placeholder="e.g. Why are insiders buying regional banks? or a ticker like NVDA"></textarea>
  <div class="suggest">${['Weekly market briefing', 'What are insiders and Congress both buying?', 'Which sectors are funds rotating into?', 'Biggest risks to AI stocks right now']
    .map((s) => `<button class="chip" data-act="fillReq" data-v="${esc(s)}">${esc(s)}</button>`)
    .join('')}</div>
  <button class="btn primary block" data-act="submitReq">${icon('sparkle', 'sm')} Generate report</button>`);
  setTimeout(() => $('#reqTopic')?.focus(), 50);
};
ACTIONS.fillReq = (d) => ($('#reqTopic').value = d.v);
ACTIONS.submitReq = async () => {
  const v = $('#reqTopic').value.trim();
  const isTicker = /^\$?[A-Za-z.\-]{1,6}$/.test(v);
  closeSheet();
  toast('Report requested — Claude is on it');
  await api('/api/reports', { method: 'POST', body: isTicker ? { ticker: v.replace('$', '') } : { topic: v || null } });
  location.hash = '#/ideas';
  render(true);
};
ACTIONS.analyze = async (d) => {
  toast(`Full analysis of ${d.t} requested`);
  const r = await api('/api/reports', { method: 'POST', body: { ticker: d.t } });
  location.hash = `#/report/${r.id}`;
};

VIEWS.report = async (r) => {
  $('#pageTitle').textContent = 'Ideas';
  const x = await api('/api/reports/' + r[0]);
  const saved = S.saved.includes(x.id);
  const tools = `<div class="actions"><a class="btn" href="#/ideas">${icon('back', 'sm')} Ideas</a><button class="btn" data-act="saveReport" data-id="${x.id}">${icon(saved ? 'star' : 'starO', 'sm')} ${saved ? 'Saved' : 'Save'}</button>${x.ticker ? `<a class="btn" href="${tickerLink(x.ticker)}">${esc(x.ticker)} ${icon('chevron', 'sm')}</a>` : ''}<button class="btn" data-act="delReport" data-id="${x.id}">${icon('trash', 'sm')}</button></div>`;
  if (x.status === 'pending')
    return `${tools}<div class="article"><h1>${esc(x.title)}</h1><p class="dek"><span class="spin"></span> Claude is researching and writing this report. This page updates automatically.</p></div>`;
  if (x.status === 'error') return `${tools}<div class="article"><h1>${esc(x.title)}</h1><p class="dek" style="color:var(--red)">${esc(x.error)}</p></div>`;
  return `${tools}<article class="article"><div class="art" style="${art(x.title)};height:200px;border-radius:18px;margin:10px 0 18px"></div><div class="label accent">${dateFmt(x.createdAt)} · ${x.readMins} min read · Written by Claude</div><h1>${esc(x.title)}</h1>${x.dek ? `<p class="dek">${md(x.dek, true)}</p>` : ''}${md(x.body)}<p class="foot">AI-generated from live data in this app and web sources. May contain errors. Not investment advice.</p></article>`;
};
ACTIONS.saveReport = async (d) => {
  const r = await api(`/api/reports/${d.id}/save`, { method: 'POST' });
  S.saved = r.saved;
  render(true);
};
ACTIONS.delReport = async (d) => {
  if (!confirm('Delete this report?')) return;
  await api(`/api/reports/${d.id}`, { method: 'DELETE' });
  location.hash = '#/ideas';
};

// Tiny markdown renderer (headings, lists, tables, quotes, links, emphasis, code)
function md(src, inline = false) {
  const inl = (s) =>
    esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_, t, u) => `<a href="${u.replace(/&amp;/g, '&').replace(/"/g, '%22')}" target="_blank" rel="noopener">${t}</a>`);
  if (inline) return inl(src);
  const lines = String(src || '').split('\n');
  let html = '', i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { i++; continue; }
    let m;
    if ((m = /^(#{1,4})\s+(.*)/.exec(l))) { const n = Math.min(4, m[1].length + 1); html += `<h${n}>${inl(m[2])}</h${n}>`; i++; continue; }
    if (/^\s*\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r));
      html += `<table><thead><tr>${cells(body[0]).map((c) => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map((r) => `<tr>${cells(r).map((c) => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      continue;
    }
    if (/^\s*>/.test(l)) {
      const q = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ''));
      html += `<blockquote>${inl(q.join(' '))}</blockquote>`;
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''));
      html += `<${ordered ? 'ol' : 'ul'}>${items.map((x) => `<li>${inl(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
      continue;
    }
    if (/^-{3,}$/.test(l.trim())) { html += '<hr style="border:0;border-top:1px solid var(--line)">'; i++; continue; }
    const p = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||\s*>|\s*([-*]|\d+\.)\s)/.test(lines[i])) p.push(lines[i++]);
    html += `<p>${inl(p.join(' '))}</p>`;
  }
  return html;
}

// Headlines
const REGION_TABS = [
  { id: 'for-you', label: 'For You' },
  { id: 'us', label: 'United States' },
  { id: 'china', label: 'China' },
  { id: 'japan', label: 'Japan' },
  { id: 'europe', label: 'Europe' },
  { id: 'crypto', label: 'Crypto' },
];
VIEWS.headlines = async (r, o) => {
  $('#pageTitle').textContent = 'Top Headlines';
  const region = REGION_TABS.find((t) => t.id === r[0]) ? r[0] : 'for-you';
  const d = await load('/api/news?region=' + region, o);
  setTabs(REGION_TABS, region, 'headlines');
  const chip = ui('newsChip', 'all');
  let items = d.items;
  if (chip === 'watchlist') items = items.filter((i) => i.watchlist || i.tickers?.length);
  if (chip === 'important') items = items.filter((i) => i.important);
  const groups = {};
  const today = new Date().toDateString(), yest = new Date(Date.now() - 864e5).toDateString();
  for (const it of items) {
    const ds = new Date(it.at).toDateString();
    const g = ds === today ? 'Today' : ds === yest ? 'Yesterday' : new Date(it.at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    (groups[g] ||= []).push(it);
  }
  const chips = [['all', 'All'], ['watchlist', 'Watchlist'], ['important', 'Important']];
  return `<div class="chips">${chips.map(([v, l]) => `<button class="chip ${chip === v ? 'on' : ''}" data-act="ui" data-key="newsChip" data-val="${v}">${l}</button>`).join('')}</div>
  <div style="max-width:860px">${Object.entries(groups)
    .map(
      ([g, xs]) => `<div class="day">${esc(g)}</div>${xs
        .map((it) => {
          const tag = it.watchlist ? '<span class="dot" style="background:var(--green)"></span><span class="up">Watchlist</span>' : it.important ? '<span class="dot" style="background:var(--yellow)"></span><span style="color:var(--yellow)">Important</span>' : '';
          return `<div class="news"><div class="main"><div class="meta">${tag}${tag ? '<span class="dim">·</span>' : ''}<span class="muted" style="letter-spacing:0;text-transform:none;font-weight:500">${esc(it.source)} · ${new Date(it.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div><a href="${esc(it.link)}" target="_blank" rel="noopener"><h3>${esc(it.title)}</h3></a>${it.summary ? `<div class="src">${esc(it.summary)}</div>` : ''}${(it.tickers || []).length ? `<div style="display:flex;gap:10px;margin-top:10px">${it.tickers.map((t) => `<a href="${tickerLink(t)}" style="display:flex;gap:8px;align-items:center;font-weight:800">${logo(t, 'sm')}${esc(t)}</a>`).join('')}</div>` : ''}</div>${it.image ? `<img class="thumb" src="${esc(it.image)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`;
        })
        .join('')}`,
    )
    .join('') || '<div class="empty">No headlines match.</div>'}</div>`;
};

// Ticker detail
VIEWS.ticker = async (r, o) => {
  const sym = (r[0] || '').toUpperCase();
  const range = ui('range', '6mo');
  $('#pageTitle').textContent = sym;
  const d = await load(`/api/ticker/${encodeURIComponent(sym)}?range=${range}`, o);
  if (d.quote) S.quotes[sym] = d.quote;
  const q = d.quote || {};
  const on = S.watchlist.includes(sym);
  const first = d.history[0]?.c, last = d.history.at(-1)?.c;
  const rangeChg = first && last ? ((last - first) / first) * 100 : null;
  return `
  <div class="quote-head">${logo(sym, 'lg', d.social?.logo)}<div style="flex:1;min-width:0"><h2>${esc(sym)}</h2><div class="muted">${esc(d.name)}${d.sector ? ' · ' + esc(d.sector) : ''}</div></div><button class="icon-btn star" data-act="watch" data-t="${esc(sym)}" aria-label="Toggle watchlist" style="color:${on ? 'var(--yellow)' : 'var(--muted)'}">${icon(on ? 'star' : 'starO', 'lg')}</button></div>
  <div class="grid two">
  <div class="section">
    <div class="price num" data-q="${esc(sym)}" data-f="price">${price(q.price)}</div>
    <div><span class="${cls(q.changePct)} num" data-q="${esc(sym)}" data-f="chg" style="font-weight:700">${pct(q.changePct, 2)}</span> <span class="muted">today</span> · <span class="${cls(rangeChg)}">${pct(rangeChg)}</span> <span class="muted">${range}</span></div>
    <div class="ranges">${['5d', '1mo', '6mo', '1y', '5y'].map((x) => `<button class="${x === range ? 'on' : ''}" data-act="ui" data-key="range" data-val="${x}">${x.toUpperCase()}</button>`).join('')}</div>
    ${lineChart(d.history)}
    <div class="actions"><button class="btn primary" data-act="analyze" data-t="${esc(sym)}">${icon('sparkle', 'sm')} AI full analysis</button><a class="btn" href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=&CIK=${esc(sym)}&type=&dateb=&owner=include&count=40" target="_blank" rel="noopener">${icon('ext', 'sm')} SEC filings</a></div>
  </div>
  <div class="section">
    ${secHead('fire', 'Social Sentiment', null, d.social ? `${num(d.social.watchers)} StockTwits watchers · last ${d.social.sample} posts` : 'No social data.')}
    ${d.social ? `${sbar(d.social.bullish, d.social.bearish)}<div class="slegend"><span class="up">${Math.round(d.social.bullish * 100)}% bullish</span><span class="down">${Math.round(d.social.bearish * 100)}% bearish</span></div>
    <div style="max-height:320px;overflow:auto;margin-top:10px">${d.social.messages.slice(0, 10).map((m) => `<div class="msg"><div class="who">@${esc(m.user)} · ${ago(Date.parse(m.at))} ${m.sentiment ? `<span class="pill ${m.sentiment === 'Bullish' ? 'buy' : 'sell'}" style="font-size:11px;padding:2px 6px">${m.sentiment}</span>` : ''}</div>${esc(m.body)}</div>`).join('')}</div>` : ''}
  </div>
  </div>
  <div class="grid three">
    <div class="section">${secHead('users', 'Insider Trades')}<div class="list-card">${d.insider.map((t) => `<a class="row" href="${esc(t.url)}" target="_blank" rel="noopener"><div class="main"><div class="t1" style="font-size:16px">${esc(t.insider)}</div><div class="t3">${esc(t.role)} · ${dateFmt(t.date)} · $${price(t.avgPrice)}</div></div><div class="right"><span class="pill ${t.type.toLowerCase()}">${t.type}</span><div class="t3">${money(t.value)}</div></div></a>`).join('') || '<div class="empty">No recent open-market Form 4 trades.</div>'}</div></div>
    <div class="section">${secHead('bank', 'Congress Trades')}<div class="list-card">${d.congress.map((t) => `<a class="row" href="#/member/${encodeURIComponent(t.member)}">${avatar(t.member, t.bioguide)}<div class="main"><div class="t1" style="font-size:16px">${esc(t.member)}</div><div class="t3">${dateFmt(t.date)} · ${esc(amountRange(t.amount))}</div></div><span class="pill ${t.type.toLowerCase()}">${t.type}</span></a>`).join('') || '<div class="empty">No disclosed House trades in tracked filings.</div>'}</div></div>
    <div class="section">${secHead('award', 'Tracked Funds')}<div class="list-card">${d.holders.map((h) => `<a class="row" href="#/fund/${h.cik}"><div class="main"><div class="t1" style="font-size:16px">${esc(h.fund)}</div><div class="t3">${(h.weight * 100).toFixed(1)}% of portfolio · ${num(h.shares)} sh</div></div><div class="right">${money(h.value)}</div></a>`).join('')}${d.fundTrades.map((t) => `<a class="row" href="#/fund/${t.cik}"><div class="main"><div class="t1" style="font-size:16px">${esc(t.fund)}</div><div class="t3">${esc(t.period)} · ${t.pct != null ? pct(t.pct, 0) + ' shares' : ''}</div></div><span class="pill ${t.type.toLowerCase()}">${t.type}</span></a>`).join('') || (d.holders.length ? '' : '<div class="empty">Not a top holding of tracked funds.</div>')}</div></div>
  </div>
  <div class="section">${secHead('news', 'News')}<div style="max-width:860px">${d.news.map((it) => `<div class="news"><div class="main"><div class="src">${esc(it.source)} · ${ago(it.at)}</div><a href="${esc(it.link)}" target="_blank" rel="noopener"><h3>${esc(it.title)}</h3></a></div></div>`).join('') || '<div class="empty">No news.</div>'}</div></div>`;
};
function lineChart(pts) {
  if (!pts?.length) return '<div class="empty">No price history available.</div>';
  const W = 640, H = 220, P = 6;
  const vals = pts.map((p) => p.c);
  const min = Math.min(...vals), max = Math.max(...vals);
  const x = (i) => P + (i / (pts.length - 1 || 1)) * (W - 2 * P);
  const y = (v) => P + (1 - (v - min) / (max - min || 1)) * (H - 2 * P - 18);
  const up = vals.at(-1) >= vals[0];
  const col = up ? 'var(--green)' : 'var(--red)';
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.c).toFixed(1)}`).join('');
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" data-chart='${JSON.stringify({ n: pts.length, W, P })}' onmousemove="window.__chartHover(event,this)" ontouchmove="window.__chartHover(event,this)" onmouseleave="window.__chartLeave(this)">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${up ? '#34c759' : '#ff4d3d'}" stop-opacity=".28"/><stop offset="1" stop-color="${up ? '#34c759' : '#ff4d3d'}" stop-opacity="0"/></linearGradient></defs>
    <path d="${d}L${x(pts.length - 1)},${H - 18}L${x(0)},${H - 18}Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2"/>
    <text x="${P}" y="${H - 3}">${dateFmt(pts[0].t)}</text><text x="${W - P}" y="${H - 3}" text-anchor="end">${dateFmt(pts.at(-1).t)}</text>
    <g class="hover" style="display:none"><line y1="0" y2="${H - 18}" stroke="#666" stroke-dasharray="3 3"/><circle r="4" fill="${col}"/><text class="hl" y="14" fill="#fff" style="fill:#f3f3f4;font-size:13px;font-weight:700"></text></g>
    <script type="application/json">${JSON.stringify(pts.map((p) => [p.t, +p.c.toFixed(2), +y(p.c).toFixed(1)]))}</script></svg>`;
}
window.__chartHover = (e, svg) => {
  const meta = JSON.parse(svg.dataset.chart);
  const pts = (svg.__pts ||= JSON.parse(svg.querySelector('script').textContent));
  const rect = svg.getBoundingClientRect();
  const cx = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (meta.W / rect.width);
  const i = Math.max(0, Math.min(pts.length - 1, Math.round(((cx - meta.P) / (meta.W - 2 * meta.P)) * (pts.length - 1))));
  const [t, c, yy] = pts[i];
  const xx = meta.P + (i / (pts.length - 1 || 1)) * (meta.W - 2 * meta.P);
  const g = svg.querySelector('.hover');
  g.style.display = '';
  g.querySelector('line').setAttribute('x1', xx);
  g.querySelector('line').setAttribute('x2', xx);
  g.querySelector('circle').setAttribute('cx', xx);
  g.querySelector('circle').setAttribute('cy', yy);
  const tx = g.querySelector('.hl');
  tx.textContent = `${price(c)} · ${dateFmt(t)}`;
  tx.setAttribute('x', Math.min(Math.max(xx, 80), meta.W - 80));
  tx.setAttribute('text-anchor', 'middle');
};
window.__chartLeave = (svg) => (svg.querySelector('.hover').style.display = 'none');

// Fund detail
VIEWS.fund = async (r, o) => {
  const f = await load('/api/super/fund/' + r[0], o);
  $('#pageTitle').textContent = f.name;
  const byType = (t) => f.trades.filter((x) => x.type === t).sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue));
  const tbl = (rows) =>
    `<div class="list-card">${rows
      .slice(0, 12)
      .map((t) => `<a class="row" href="${t.ticker ? tickerLink(t.ticker) : '#'}">${logo(t.ticker || t.name.slice(0, 3).toUpperCase(), 'sm')}<div class="main"><div class="t1" style="font-size:16px">${esc(t.ticker || t.name)}</div><div class="t3">${esc(t.name)}${t.pct != null ? ' · ' + pct(t.pct, 0) + ' shares' : ''}</div></div><div class="right ${t.deltaValue >= 0 ? 'up' : 'down'}" style="font-weight:700">${money(t.deltaValue)}</div></a>`)
      .join('') || '<div class="empty">None.</div>'}</div>`;
  return `<div class="actions"><a class="btn" href="#/explore/super">${icon('back', 'sm')} Super-Investors</a><a class="btn" href="${esc(f.source)}" target="_blank" rel="noopener">${icon('ext', 'sm')} 13F filing</a></div>
  <div class="quote-head">${logo(f.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase(), 'lg', '')}<div><h2>${esc(f.name)}</h2><div class="muted">${esc(f.manager)} · period ${esc(f.period)} · filed ${dateFmt(f.filed)}</div></div></div>
  <div class="kv" style="margin-bottom:24px"><div><div class="label">Reported value</div><div class="v big">${money(f.aum)}</div></div><div><div class="label">Positions</div><div class="v big">${f.positions}</div></div><div><div class="label">Value QoQ</div><div class="v ${cls(f.prevAum ? f.aum / f.prevAum - 1 : null)}">${f.prevAum ? pct((f.aum / f.prevAum - 1) * 100) : '—'}</div></div><div><div class="label">Changes</div><div class="v">${f.changeCount}</div></div></div>
  <div class="grid two">
    <div class="section">${secHead('pie', 'Top Holdings')}<div class="list-card">${f.top
      .map((h) => `<a class="row" href="${h.ticker ? tickerLink(h.ticker) : '#'}">${logo(h.ticker || h.name.slice(0, 3).toUpperCase(), 'sm')}<div class="main"><div class="t1" style="font-size:16px">${esc(h.ticker || h.name)}</div><div class="t3">${esc(h.name)} · ${num(Math.round(h.shares))} sh</div></div><div class="right"><div style="font-weight:700">${(h.weight * 100).toFixed(1)}%</div><div class="t3">${money(h.value)}</div></div></a>`)
      .join('')}</div></div>
    <div>
      <div class="section">${secHead('sparkle', 'New Positions')}${tbl(byType('New'))}</div>
      <div class="section">${secHead('trendUp', 'Added')}${tbl(byType('Added'))}</div>
      <div class="section">${secHead('trendDown', 'Reduced')}${tbl(byType('Reduced'))}</div>
      <div class="section">${secHead('exit', 'Exited')}${tbl(byType('Exited'))}</div>
    </div>
  </div>`;
};

// Member detail
VIEWS.member = async (r, o) => {
  const name = r[0];
  $('#pageTitle').textContent = 'Congress';
  const d = await load('/api/congress', o);
  const trades = d.trades.filter((t) => t.member === name);
  const m = trades[0] || {};
  const lead = d.leaders.find((l) => l.member === name);
  return `<div class="actions"><a class="btn" href="#/explore/congress">${icon('back', 'sm')} Congress</a></div>
  <div class="quote-head">${avatar(name, m.bioguide, 'lg')}<div><h2>${esc(name)}</h2><div class="muted">${m.party ? esc(m.party) + ' · ' : ''}${esc(m.stateDst || '')}${m.committees?.length ? ' · Committees: ' + m.committees.map((c) => esc(c)).join(', ') : ''}</div>${lead ? `<div style="margin-top:6px">Avg trade vs S&amp;P 500: <b class="${cls(lead.excess)}">${pct(lead.excess)}</b></div>` : ''}</div></div>
  <div class="card">${trades.map(congressCard).join('') || '<div class="empty">No trades in tracked filings.</div>'}</div>`;
};

// ---------------- tape ----------------
function paintTape() {
  $('#tape').innerHTML = S.indexes
    .filter((i) => i.price != null)
    .map((i) => `<a class="tape-item" href="${tickerLink(i.symbol)}"><b>${esc(i.label)}</b><span class="num">${price(i.price)}</span><span class="${cls(i.changePct)} num">${pct(i.changePct, 2)}</span></a>`)
    .join('');
}

// ---------------- search / sheet ----------------
function openSheet(html) {
  $('#sheet').innerHTML = html;
  $('#sheet').hidden = false;
  $('#sheetBackdrop').hidden = false;
}
function closeSheet() {
  $('#sheet').hidden = true;
  $('#sheetBackdrop').hidden = true;
}
$('#sheetBackdrop').addEventListener('click', closeSheet);
function openSearch() {
  openSheet(`<label class="search" style="margin-bottom:12px">${icon('search')}<input id="sq" placeholder="Ticker, company, fund or member of Congress" autocomplete="off"></label><div id="sres" class="list-card"><div class="empty">Type to search. Tip: press / anywhere.</div></div>`);
  const inp = $('#sq');
  inp.focus();
  let t;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const v = inp.value.trim();
      if (!v) return;
      const { results } = await api('/api/search?q=' + encodeURIComponent(v));
      const href = (x) => (x.kind === 'fund' ? `#/fund/${x.id}` : x.kind === 'member' ? `#/member/${encodeURIComponent(x.id)}` : tickerLink(x.id));
      $('#sres').innerHTML =
        results.map((x) => `<a class="row" href="${href(x)}" onclick="document.getElementById('sheetBackdrop').click()">${x.kind === 'member' ? avatar(x.label) : logo(x.kind === 'fund' ? x.label.slice(0, 2).toUpperCase() : x.label, 'sm', x.kind === 'fund' ? '' : undefined)}<div class="main"><div class="t1" style="font-size:16px">${esc(x.label)}</div><div class="t3">${esc(x.sub)}</div></div><span class="pill ghost">${x.kind}</span></a>`).join('') ||
        `<a class="row" href="${tickerLink(v.toUpperCase())}" onclick="document.getElementById('sheetBackdrop').click()"><div class="main">Open ${esc(v.toUpperCase())}</div></a>`;
    }, 180);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = $('#sres a.row');
      if (first) first.click();
      else {
        location.hash = tickerLink(inp.value.trim().toUpperCase());
        closeSheet();
      }
    }
  });
}
$('#searchBtn').addEventListener('click', openSearch);
$('#menuBtn').addEventListener('click', () =>
  openSheet(`<h3>Finance One-Stop</h3><div class="list-card">${[...NAV.map((n) => [n.id, n.label, n.icon]), ['explore/super', 'Super-Investors', 'award'], ['explore/congress', 'Congress', 'bank'], ['explore/social', 'Socials', 'fire'], ['explore/insider', 'Insider', 'users']]
    .map(([h, l, ic]) => `<a class="row" href="#/${h}" onclick="document.getElementById('sheetBackdrop').click()">${icon(ic)}<div class="main">${l}</div>${icon('chevron', 'sm')}</a>`)
    .join('')}</div><p class="foot" id="statusLine">Checking data sources…</p>`) ||
  api('/api/health').then((h) => {
    const s = Object.values(h.sources);
    const bad = s.filter((x) => !x.ok).length;
    const el = $('#statusLine');
    if (el) el.innerHTML = `${s.length - bad}/${s.length} data feeds healthy · AI reports ${h.ai ? 'on' : 'off'} · live ${$('#liveDot').classList.contains('on') ? 'connected' : 'offline'}`;
  }),
);

// ---------------- login ----------------
function showLogin() {
  if ($('#loginForm')) return;
  $('#tabs').innerHTML = '';
  $('#view').innerHTML = `<div class="login"><img src="/icons/icon.svg" width="72" alt=""><h2>Finance One-Stop</h2><p class="muted">Enter your passcode to sync this device.</p><form id="loginForm"><input type="password" id="pc" autocomplete="current-password" placeholder="Passcode"><button class="btn primary block">Unlock</button></form></div>`;
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/login', { method: 'POST', body: { passcode: $('#pc').value } });
      location.reload();
    } catch {
      toast('Wrong passcode');
    }
  });
}

// ---------------- live updates ----------------
const SECTION_VIEWS = { insider: ['explore/insider', 'markets'], congress: ['explore/congress', 'markets'], super: ['explore/super'], social: ['explore/social', 'markets'], news: ['headlines'] };
let es;
function connectLive() {
  try {
    es?.close();
  } catch {}
  es = new EventSource('/api/events');
  es.addEventListener('hello', () => $('#liveDot').classList.add('on'));
  es.onerror = () => $('#liveDot').classList.remove('on');
  es.addEventListener('quotes', (e) => {
    const d = JSON.parse(e.data);
    S.indexes = d.indexes;
    Object.assign(S.quotes, d.quotes);
    paintTape();
    document.querySelectorAll('[data-q]').forEach(paintQuote);
  });
  es.addEventListener('update', (e) => {
    const { section } = JSON.parse(e.data);
    cache.clear();
    const here = location.hash.replace(/^#\//, '');
    if ((SECTION_VIEWS[section] || []).some((v) => here.startsWith(v)) && !document.querySelector('.sheet:not([hidden])') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) render(true);
  });
  es.addEventListener('state', (e) => {
    const s = JSON.parse(e.data);
    S.watchlist = s.watchlist;
    S.saved = s.saved;
    if (/watchlist|markets/.test(location.hash)) render(true);
  });
  es.addEventListener('report', (e) => {
    const r = JSON.parse(e.data);
    if (r.status === 'done') {
      S.newReports = !location.hash.startsWith('#/ideas');
      toast('A new research report is ready');
    }
    if (location.hash.startsWith('#/ideas') || location.hash.includes(r.id)) render(true);
    else drawChrome(location.hash.replace(/^#\/?/, '').split('/'));
  });
}

// Refresh when the app comes back to the foreground (phone unlock, tab switch)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    cache.clear();
    if (!es || es.readyState === 2) connectLive();
    refreshState().then(() => render(true));
  }
});

async function refreshState() {
  const s = await api('/api/state');
  S.watchlist = s.watchlist;
  S.saved = s.saved;
}

// ---------------- boot ----------------
(async function boot() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  try {
    await refreshState();
  } catch (e) {
    if (e.message === 'auth') return;
  }
  connectLive();
  render();
  api('/api/market').then((m) => {
    S.indexes = m.indexes;
    Object.assign(S.quotes, m.quotes);
    paintTape();
  }).catch(() => {});
})();
