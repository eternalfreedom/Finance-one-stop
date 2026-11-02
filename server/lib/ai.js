// AI research reports written by Claude from the app's live data (+ optional web search).
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'node:crypto';
import { upsertReport } from './store.js';

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
let client;

const SYSTEM = `You are the research desk for a personal markets dashboard. You write clear, skeptical, well-sourced research notes for an individual investor.

Rules:
- Ground every claim in the JSON data provided or in sources you find with web search; cite web sources inline as markdown links.
- Separate facts from interpretation. Note data limits (e.g. 13F filings lag by up to 45 days, congressional disclosures by up to 45 days, social sentiment is noisy).
- No personalised financial advice and no price targets of your own. End with a short "What would change the view" section.
- Format: markdown. First line "# <headline>" (max 90 chars), second line "> <one-sentence dek>", then the body with "##" section headings, short paragraphs, and tables where useful. Aim for 600-1200 words.`;

let onUpdate = () => {};
export const onReportUpdate = (fn) => (onUpdate = fn);

export function requestReport({ topic, ticker, context }) {
  const id = crypto.randomUUID();
  const r = upsertReport({
    id,
    status: aiEnabled() ? 'pending' : 'error',
    error: aiEnabled() ? null : 'Set ANTHROPIC_API_KEY on the server to enable AI reports.',
    topic: topic || (ticker ? `Full analysis: ${ticker}` : 'Market briefing'),
    ticker: ticker || null,
    createdAt: Date.now(),
    title: topic || (ticker ? `${ticker}: what's driving it` : 'Market briefing'),
  });
  if (aiEnabled()) run(id, topic, ticker, context).catch(() => {});
  return r;
}

async function run(id, topic, ticker, context) {
  client ||= new Anthropic();
  const today = new Date().toISOString().slice(0, 10);
  const user = `Today is ${today}.
Request: ${topic || (ticker ? `A full analysis of ${ticker}: why it is moving / being discussed, what insiders, members of Congress and tracked funds are doing, the bull and bear case.` : 'A briefing on what matters in markets this week.')}

Live data from the dashboard (JSON):
${JSON.stringify(context).slice(0, 120000)}`;

  const messages = [{ role: 'user', content: user }];
  try {
    let msg;
    for (let turn = 0; turn < 4; turn++) {
      const stream = client.beta.messages.stream({
        model: MODEL,
        max_tokens: 32000,
        system: SYSTEM,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }],
        messages,
      });
      msg = await stream.finalMessage();
      if (msg.stop_reason !== 'pause_turn') break;
      messages.push({ role: 'assistant', content: msg.content }); // server tool paused; let it continue
    }
    if (msg.stop_reason === 'refusal') throw new Error('The model declined this request.');
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const title = (/^#\s+(.+)$/m.exec(text) || [])[1] || topic || ticker || 'Research note';
    const dek = (/^>\s+(.+)$/m.exec(text) || [])[1] || '';
    const body = text.replace(/^#\s+.+$/m, '').replace(/^>\s+.+$/m, '').trim();
    const words = body.split(/\s+/).length;
    onUpdate(upsertReport({ id, status: 'done', title, dek, body, readMins: Math.max(2, Math.round(words / 220)), doneAt: Date.now() }));
  } catch (e) {
    onUpdate(upsertReport({ id, status: 'error', error: String(e.message || e) }));
  }
}
