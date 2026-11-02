// Server-side user state so the PC and phone see the same watchlist, saved reports, etc.
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './net.js';

const FILE = path.join(DATA_DIR, 'state.json');
const DEFAULTS = { watchlist: ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN'], saved: [], reports: [], prefs: {} };

let state;
try {
  state = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
} catch {
  state = structuredClone(DEFAULTS);
}
let version = Date.now();

function persist() {
  version = Date.now();
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(state, null, 1));
  fs.renameSync(FILE + '.tmp', FILE);
}

export const getState = () => ({ watchlist: state.watchlist, saved: state.saved, prefs: state.prefs, version });
export function setWatchlist(list) {
  state.watchlist = [...new Set(list.map((s) => String(s).toUpperCase().trim()).filter((s) => /^[A-Z0-9.\-^=]{1,12}$/.test(s)))].slice(0, 100);
  persist();
  return state.watchlist;
}
export function toggleSaved(id) {
  state.saved = state.saved.includes(id) ? state.saved.filter((x) => x !== id) : [id, ...state.saved];
  persist();
  return state.saved;
}
export function setPrefs(p) {
  state.prefs = { ...state.prefs, ...p };
  persist();
  return state.prefs;
}
export const listReports = () => state.reports.map(({ body, ...r }) => r);
export const getReport = (id) => state.reports.find((r) => r.id === id);
export function upsertReport(r) {
  const i = state.reports.findIndex((x) => x.id === r.id);
  if (i >= 0) state.reports[i] = { ...state.reports[i], ...r };
  else state.reports.unshift(r);
  state.reports = state.reports.slice(0, 200);
  persist();
  return getReport(r.id);
}
export function deleteReport(id) {
  state.reports = state.reports.filter((r) => r.id !== id);
  state.saved = state.saved.filter((x) => x !== id);
  persist();
}
