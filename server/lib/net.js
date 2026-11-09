// Shared networking: honest User-Agent, per-host throttling, in-memory TTL cache
// with stale-while-revalidate, and a tiny on-disk JSON cache for slow-changing data.
import fs from 'node:fs';
import path from 'node:path';

export const DATA_DIR = process.env.DATA_DIR || path.resolve('data');
fs.mkdirSync(path.join(DATA_DIR, 'cache'), { recursive: true });

// SEC asks automated clients to identify themselves with a contact address.
// Set SEC_USER_AGENT="YourApp you@example.com" in your environment.
export const UA = process.env.SEC_USER_AGENT || 'FinanceOneStop/1.0 (personal dashboard; set SEC_USER_AGENT)';
// Every other site gets a generic name, so the contact address in SEC_USER_AGENT only goes to the SEC.
const GENERIC_UA = 'FinanceOneStop/1.0 (personal dashboard)';
const uaFor = (host) => (/(^|\.)sec\.gov$/.test(host) ? UA : GENERIC_UA);

const hostGates = new Map();
const HOST_RPS = { 'www.sec.gov': 6, 'data.sec.gov': 6, 'api.openfigi.com': 0.4, 'api.stocktwits.com': 2 };

async function gate(host) {
  const rps = HOST_RPS[host] || 8;
  const gap = 1000 / rps;
  const prev = hostGates.get(host) || 0;
  const now = Date.now();
  const at = Math.max(now, prev + gap);
  hostGates.set(host, at);
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

export async function fetchRaw(url, opts = {}) {
  const u = new URL(url);
  await gate(u.host);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 20000);
  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      body: opts.body,
      headers: { 'User-Agent': uaFor(u.host), 'Accept-Encoding': 'gzip, deflate', ...(opts.headers || {}) },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} for ${u.host}${u.pathname}`);
      err.status = res.status;
      throw err;
    }
    return res;
  } finally {
    clearTimeout(t);
  }
}

export const getText = async (url, opts) => (await fetchRaw(url, opts)).text();
export const getJSON = async (url, opts) => (await fetchRaw(url, opts)).json();
export const getBuffer = async (url, opts) => Buffer.from(await (await fetchRaw(url, opts)).arrayBuffer());

// ---- memo cache (stale-while-revalidate) ----
const memo = new Map();
export const health = {}; // key -> { ok, at, error }

export async function cached(key, ttlMs, loader, { staleOk = true } = {}) {
  const hit = memo.get(key);
  const now = Date.now();
  if (hit && hit.value !== undefined && now - hit.at < ttlMs) return hit.value;
  if (hit && hit.pending) {
    if (staleOk && hit.value !== undefined) return hit.value;
    return hit.pending;
  }
  const entry = hit || {};
  entry.pending = (async () => {
    try {
      const v = await loader();
      entry.value = v;
      entry.at = Date.now();
      health[key] = { ok: true, at: entry.at };
      return v;
    } catch (e) {
      health[key] = { ok: false, at: Date.now(), error: String(e.message || e) };
      if (entry.value !== undefined) return entry.value;
      throw e;
    } finally {
      entry.pending = null;
    }
  })();
  memo.set(key, entry);
  if (staleOk && hit && hit.value !== undefined) return hit.value;
  return entry.pending;
}

export function invalidate(prefix) {
  for (const k of memo.keys()) if (k.startsWith(prefix)) memo.get(k).at = 0;
}

// ---- disk JSON store ----
export function diskLoad(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cache', name), 'utf8'));
  } catch {
    return fallback;
  }
}
const pendingWrites = new Map();
export function diskSave(name, value) {
  clearTimeout(pendingWrites.get(name));
  pendingWrites.set(
    name,
    setTimeout(() => {
      const file = path.join(DATA_DIR, 'cache', name);
      fs.writeFileSync(file + '.tmp', JSON.stringify(value));
      fs.renameSync(file + '.tmp', file);
    }, 500),
  );
}

// ---- small helpers ----
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function pool(items, size, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        try {
          out[idx] = await fn(items[idx], idx);
        } catch (e) {
          out[idx] = undefined;
        }
      }
    }),
  );
  return out;
}
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
const decodeOnce = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
export const decodeEntities = (s = '') => decodeOnce(decodeOnce(String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')));

// Minimal XML helpers good enough for SEC/RSS documents.
export function xmlBlocks(xml, tag) {
  const re = new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}
export function xmlVal(xml, tag) {
  const re = new RegExp(`<(?:\\w+:)?${tag}\\b[^>]*>\\s*(?:<(?:\\w+:)?value>)?([\\s\\S]*?)(?:</(?:\\w+:)?value>\\s*)?</(?:\\w+:)?${tag}>`);
  const m = re.exec(xml);
  return m ? decodeEntities(m[1].trim()) : '';
}
