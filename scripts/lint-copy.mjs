import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [...readdirSync(path.join(root,'src')).filter(name=>name.endsWith('.mjs')).map(name=>'src/'+name),'content/x-posts.md'];

const phraseChecks = [
  [/\bdelve(?:s|d)?\b/i, 'delve'],
  [/\bnavigat(?:e|es|ing) the (?:complex|ever-changing|evolving) landscape\b/i, 'landscape filler'],
  [/\b(?:game[- ]changer|paradigm shift|revolutionary|groundbreaking)\b/i, 'unsupported hype'],
  [/\b(?:it is|it's) (?:important|worth) (?:noting|remembering)\b/i, 'importance signpost'],
  [/^\s*(?:in conclusion|to summarize|all in all)\b/i, 'summary signpost'],
  [/\b(?:seamless|cutting-edge|holistic)\b/i, 'generic marketing adjective'],
  [/\b(?:as an ai|language model|llm|agent pass|owner instruction|ux-audit|token audit|model output|assistant output)\b/i, 'generation or process residue'],
];

const errors = [];
for (const file of files) {
  const text = readFileSync(path.join(root, file), 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.includes('—')) errors.push(`${file}:${index + 1}: em dash`);
    for (const [pattern, label] of phraseChecks) {
      if (pattern.test(line)) errors.push(`${file}:${index + 1}: ${label}`);
    }
  });
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Copy checks passed. files=${files.length}`);
