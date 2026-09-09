import {doors, demos, doorKgi, peopleChips} from './doors.mjs';
import {localFilm} from './community.mjs';

const routes = items => `<nav class="topic-list" aria-label="Next reading">${items.map(([title, text, url]) =>
  `<a href="${url}"><div><strong>${title}</strong><p>${text}</p></div><span aria-hidden="true">↗</span></a>`
).join('')}</nav>`;

function pageBody(door) {
  const film = localFilm('/media/kaspa-silver.mp4', 'Kaspa Silver: what Kaspa is.', {preload: 'metadata'});
  return `${film}
    <div class="page-intro intro-door">
      <p class="eyebrow">${door.label}</p>
      <h1>${door.title}</h1>
      <p class="lead">${door.intel}</p>
    </div>
    <p class="door-as" data-door-as hidden></p>
    <div class="door-intel-body">${door.body}</div>
    ${doorKgi()}
    ${peopleChips(door.id)}
    <section class="chapter">
      <div class="section-title"><h2>Continue</h2><p>Help is questions. Explore is the live ledger. The playground is the mechanics.</p></div>
      ${routes(door.reads)}
    </section>
    <section class="chapter">
      <div class="section-title"><h2>Try it</h2><p>Same for every door.</p></div>
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
