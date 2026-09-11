import {readFile} from 'node:fs/promises';

const MODEL = process.env.XAI_MODEL || 'grok-4.5';
const PRICE = /\b(price|moon|target|resistance|ath|pump|dump|lambo)\b/i;
const SEED = /\b([a-z]{3,8}\s+){11,}[a-z]{3,8}\b/i;

function strip(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function loadIntel(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function localAnswer(intel, doorId, question) {
  const door = (intel.doors || []).find(item => item.id === doorId) || intel.doors?.[0];
  const q = question.toLowerCase();
  const hits = (intel.claims || []).filter(claim =>
    q.split(/\W+/).filter(w => w.length > 3).some(w => `${claim.name} ${claim.summary}`.toLowerCase().includes(w))
  ).slice(0, 4);
  const lines = [
    door ? `Door ${door.id}: ${door.intel}` : '',
    hits.length ? hits.map(c => `${c.name}: ${c.summary}`).join('\n') : 'No matching master-file claim. Stay with this door, Help, or Explore.',
    'Price is not a source. A ticker is not a job.',
  ].filter(Boolean);
  return lines.join('\n\n');
}

function systemPrompt(intel, doorId) {
  const door = (intel.doors || []).find(item => item.id === doorId);
  const claims = (intel.claims || []).map(c => `- ${c.name} [${c.status}]: ${c.summary}`).join('\n');
  return `You are the Kaspa Explained STP door assistant. Local site. No login.
Answer at the level of Door ${door?.id || '?'}: ${door?.title || ''}.
Door intel: ${door?.intel || ''}
Door overview: ${door?.overview || ''}
Master file claims:
${claims}
Rules:
- Short. Direct. Factual. Unbiased.
- Do not invent KIPs, dates, or live features.
- Label live, prototype, research, proposed.
- No price predictions. No seed handling.
- A tweet is not a spec.
- Economic questions: wages, cash buffer, and skills that sell without a token sit outside crypto. A chart is not a plan.
- If you do not know, say so and point to Help or Explore.`;
}

export async function answerQuestion(intel, {door, question, history = []}) {
  const doorId = Number(door) || 1;
  const q = String(question || '').trim().slice(0, 800);
  if (!q) throw new Error('Ask a question.');
  if (SEED.test(q)) throw new Error('Do not paste a recovery phrase.');
  if (PRICE.test(q)) {
    return {answer: 'Price talk is not a source. A chart cannot pay rent. Wages, a cash buffer, and a skill that sells without a token sit outside crypto. If you still want Kaspa, ask about the machine, not the candle.', source: 'local-intel'};
  }
  const key = process.env.XAI_API_KEY;
  if (!key) return {answer: localAnswer(intel, doorId, q), source: 'local-intel'};
  const messages = [
    {role: 'system', content: systemPrompt(intel, doorId)},
    ...history.slice(-6).map(item => ({role: item.role === 'assistant' ? 'assistant' : 'user', content: String(item.content || '').slice(0, 800)})),
    {role: 'user', content: q},
  ];
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({model: MODEL, temperature: 0.2, max_tokens: 400, messages}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.error?.message || `Grok HTTP ${res.status}`;
    return {answer: `${localAnswer(intel, doorId, q)}\n\nGrok was not reached (${detail}).`, source: 'local-intel'};
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return {answer: localAnswer(intel, doorId, q), source: 'local-intel'};
  return {answer: text, source: 'grok'};
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new Error('Bad JSON.')); }
    });
    req.on('error', reject);
  });
}
