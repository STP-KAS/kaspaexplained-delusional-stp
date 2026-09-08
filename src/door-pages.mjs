import {doors, demos, kaspaFilm, doorVisual, doorKgi, peopleChips} from './doors.mjs';

const routes = items => `<nav class="topic-list" aria-label="Next reading">${items.map(([title, text, url]) =>
  `<a href="${url}"><div><strong>${title}</strong><p>${text}</p></div><span aria-hidden="true">↗</span></a>`
).join('')}</nav>`;

function pageBody(door) {
  return `<div class="page-intro intro-door">
      <p class="eyebrow">${door.label}</p>
      <h1>${door.title}</h1>
      <p class="lead">Knowledge first. The film is the same. The reading order is not.</p>
    </div>
    <p class="door-as" data-door-as hidden></p>
    ${doorVisual(door.id)}
    ${kaspaFilm()}
    ${doorKgi()}
    <p class="door-intel">${door.intel}</p>
    <div class="door-intel-body">${door.body}</div>
    ${peopleChips(door.id)}
    <section class="chapter">
      <div class="section-title"><h2>Read this first</h2><p>Text, one modest diagram, the film, and the live DAG.</p></div>
      ${routes(door.reads)}
    </section>
    <section class="chapter">
      <div class="section-title"><h2>Demos</h2><p>The same for every door.</p></div>
      ${routes(demos)}
    </section>
    <p class="small"><a href="/">Back to the four doors</a></p>`;
}

export const doorPages = Object.values(doors).map(door => ({
  file: `door-${door.id}.html`,
  title: `${door.label} · ${door.title}`,
  description: door.intel,
  body: pageBody(door),
}));
