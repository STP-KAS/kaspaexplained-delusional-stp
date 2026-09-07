import {pages,searchPage} from './pages.mjs';
import {moneyPage} from './money-page.mjs';
import {v4Page} from './v4-page.mjs';
import {publicAppsPage} from './public-apps-page.mjs';
import {wrapPage} from './wrap-page.mjs';

export const standalone=process.env.KASPA_RELEASE==='v1';
const contentPages=[...pages,moneyPage,...(standalone?[]:[{...publicAppsPage,body:'<nav class="reading-next" aria-label="Town adventure"><p>Prefer one connected adventure?</p><a href="/covenants">Play a KAS economy: build, work, trade and deliver →</a></nav>'+publicAppsPage.body},v4Page,wrapPage])];
export const documents=[...contentPages,searchPage(contentPages)];
