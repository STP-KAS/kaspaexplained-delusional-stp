import {doors, people, demos, kaspaFilm} from './doors.mjs';

const routes = items => `<nav class="topic-list" aria-label="Next reading">${items.map(([title, text, url]) =>
  `<a href="${url}"><div><strong>${title}</strong><p>${text}</p></div><span aria-hidden="true">↗</span></a>`
).join('')}</nav>`;

function pageBody({eyebrow, title, lead, intel, reads}) {
  return `<div class="page-intro intro-door">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p class="lead">${lead}</p>
    </div>
    ${kaspaFilm()}
    <p class="door-intel">${intel}</p>
    <section class="chapter">
      <div class="section-title"><h2>Read this first</h2><p>Text and this film. No extra demo on this page.</p></div>
      ${routes(reads)}
    </section>
    <section class="chapter">
      <div class="section-title"><h2>Demos</h2><p>The same for every door and every person.</p></div>
      ${routes(demos)}
    </section>
    <p class="small"><a href="/">Back to the four doors</a></p>`;
}

export const doorPages = [
  ...Object.values(doors).map(door => ({
    file: `door-${door.id}.html`,
    title: `${door.label} · ${door.title}`,
    description: door.intel,
    body: pageBody({
      eyebrow: door.label,
      title: door.title,
      lead: 'Knowledge first. The film is the same. The reading order is not.',
      intel: door.intel,
      reads: door.reads,
    }),
  })),
  ...people.map(person => {
    const door = doors[person.door];
    return {
      file: `who/${person.id}.html`,
      title: `${person.label} · ${door.label}`,
      description: person.intel || door.intel,
      body: pageBody({
        eyebrow: `${door.label} · ${person.label}`,
        title: person.label,
        lead: 'This entry is for your starting point. The film and the demos do not change.',
        intel: person.intel || door.intel,
        reads: door.reads,
      }),
    };
  }),
];
