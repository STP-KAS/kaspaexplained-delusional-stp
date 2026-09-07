import { readFileSync } from 'node:fs';

const file = 'content/x-posts.md';
const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const headingPattern = /^## (.+)$/gm;
const headings = [...text.matchAll(headingPattern)];
const expectedDates = Array.from({ length: 25 }, (_, index) => `September ${index + 6}`);
const actualDates = headings.map((heading) => heading[1]);
const failures = [];

if (actualDates.length !== expectedDates.length || actualDates.some((date, index) => date !== expectedDates[index])) {
  failures.push(`Expected dated posts ${expectedDates.join(', ')}; found ${actualDates.join(', ') || 'none'}`);
}

for (let index = 0; index < headings.length; index += 1) {
  const heading = headings[index];
  const start = heading.index + heading[0].length;
  const end = index + 1 < headings.length ? headings[index + 1].index : text.length;
  const lines = text.slice(start, end).split('\n');

  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  const sourceIndexes = lines
    .map((line, lineIndex) => (/^(?:(?:Protocol|Schedule) source|Sources?):\s+https:\/\//.test(line) ? lineIndex : -1))
    .filter((lineIndex) => lineIndex >= 0);

  if (sourceIndexes.length !== 1) {
    failures.push(`${heading[1]}: expected one stored source line, found ${sourceIndexes.length}`);
    continue;
  }

  const sourceIndex = sourceIndexes[0];
  if (lines.slice(sourceIndex + 1).some((line) => line.trim() !== '')) {
    failures.push(`${heading[1]}: stored source line must follow the post body`);
  }

  const bodyLines = lines.slice(0, sourceIndex);
  while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop();
  if (bodyLines.shift() !== '```text' || bodyLines.pop() !== '```' || bodyLines.some((line) => line.startsWith('```'))) {
    failures.push(`${heading[1]}: expected one copyable text block, with sources outside it`);
  }
  if (!bodyLines.some((line) => line.trim() && line.trim() !== '$KAS')) {
    failures.push(`${heading[1]}: post body is empty`);
  }
  if (bodyLines.at(-1)?.trim() !== '$KAS') {
    failures.push(`${heading[1]}: post body must end with a standalone $KAS line`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('X post structure checks passed. posts=25 dates=September 6-30');
