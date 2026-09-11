import {readFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const MODEL = process.env.XAI_MODEL || 'grok-4.5';
const PRICE = /\b(price|moon|target|resistance|ath|pump|dump|lambo)\b/i;
const SEED = /\b([a-z]{3,8}\s+){11,}[a-z]{3,8}\b/i;
const HERE = dirname(fileURLToPath(import.meta.url));
const CAP = 50;

export async function loadIntel(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function loadText(name) {
  return readFile(resolve(HERE, name), 'utf8');
}

function localAnswer(intel, doorId, question) {
  const door = (intel.doors || []).find(item => item.id === doorId) || intel.doors?.[0];
  const q = question.toLowerCase();
  const hits = (intel.claims || []).filter(claim =>
    q.split(/\W+/).filter(w => w.length > 3).some(w => `${claim.name} ${claim.summary}`.toLowerCase().includes(w))
  ).slice(0, 3);
  const notes = String(intel.notes || '');
  const lines = [
    door && doorId === 1 ? 'Simple version: you hold keys. A wallet is not a bank. A miner spends energy. A node checks the list. Sending is not settling. Do not paste a recovery phrase.' : '',
    hits.length ? hits.map(c => `${c.name}: ${c.summary}`).join('\n') : (notes ? notes.split('\n').slice(0, 8).join('\n') : 'Stay with this door, Help, or Explore.'),
    'Price is not a source. A ticker is not a job.',
  ].filter(Boolean);
  return lines.join('\n\n');
}

function hostPreamble(intel, doorId, count) {
  const door = (intel.doors || []).find(item => item.id === doorId);
  return [
    `DOOR_ID: ${door?.id || doorId}`,
    `DOOR_TITLE: ${door?.title || ''}`,
    `DOOR_LEVEL: ${door?.title || ''}`,
    `DOOR_QUESTION_COUNT: ${count}`,
    'DOOR_CANONICAL_TEXT:',
    door?.overview || door?.intel || '',
    '',
    'LOCAL_MASTER_NOTES:',
    intel.notes || '',
  ].join('\n');
}

export async function answerQuestion(intel, {door, question, history = [], count = 1}) {
  const doorId = Number(door) || 1;
  const q = String(question || '').trim().slice(0, 800);
  const n = Number(count) || 1;
  if (!q) throw new Error('Ask a question.');
  if (n > CAP) throw new Error('Session cap reached. Refresh the door or open another door.');
  if (SEED.test(q)) throw new Error('Do not paste a recovery phrase. Wipe it. Treat it as burned.');
  if (PRICE.test(q)) {
    return {answer: 'Price is not a source. Check a live ticker if you want a number. That ticker is not the protocol. A chart cannot pay rent. Wages, a cash buffer, and a skill that sells without a token sit outside crypto.', source: 'local-intel'};
  }
  const key = process.env.XAI_API_KEY;
  if (!key) return {answer: localAnswer(intel, doorId, q), source: 'local-intel'};
  const system = await loadText('door-ask-system.txt');
  const messages = [
    {role: 'system', content: system},
    {role: 'user', content: hostPreamble(intel, doorId, n)},
    {role: 'assistant', content: 'Door text is already on the page. I will deepen from the question, not dump the door again.'},
    ...history.slice(-8).map(item => ({role: item.role === 'assistant' ? 'assistant' : 'user', content: String(item.content || '').slice(0, 1200)})),
    {role: 'user', content: q},
  ];
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({model: MODEL, temperature: 0.2, max_tokens: 1200, messages}),
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
