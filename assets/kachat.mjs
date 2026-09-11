import {CATALOG, current, detected, isMobile, savedDomain, saveDomain} from './installed-wallets.mjs';
import {loadHoldings, shortAddress} from './wallet-holdings.mjs';

const APP = '/kachat/app/';

function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function nameOf(id) {
  return CATALOG.find(item => item.id === id)?.name || id;
}

function appUrl({session, domain, fresh, create} = {}) {
  const params = new URLSearchParams();
  if (session?.address) {
    params.set('from', 'explained');
    params.set('address', session.address);
    if (session.id) params.set('wallet', session.id);
    if (domain) params.set('domain', domain);
  } else {
    params.set('skip', '1');
  }
  if (create) params.set('create', '1');
  return `${APP}?${params}`;
}

function injectButtons() {
  const found = detected();
  return CATALOG.filter(item => item.kind === 'inject').map(item => {
    const foundMark = found.includes(item.id) ? ' · detected' : '';
    return `<button class="primary-button" type="button" data-wallet-id="${item.id}">
      <strong>${escape(item.name)}</strong>
      <small>Connect in this tab · ${escape(item.where)}${foundMark}</small>
    </button>`;
  }).join('');
}

function otherWallets() {
  return `<details class="kachat-others"><summary>Other wallets</summary>
    <div class="wallet-choice">${CATALOG.filter(item => item.kind !== 'inject').map(item =>
      `<button class="quiet-button" type="button" data-wallet-id="${item.id}">
        <strong>${escape(item.name)}</strong>
        <small>Open app · ${escape(item.where)}</small>
      </button>`
    ).join('')}</div>
    <p class="small">Those apps do not inject here. Use them inside KaChat after you open it.</p>
  </details>`;
}

function domainPicker(holdings, chosen) {
  const domains = holdings?.domains || [];
  const primary = holdings?.primary || '';
  const selected = domains.some(item => item.name === chosen) ? chosen : (primary || domains[0]?.name || '');
  if (holdings?.domainsError) return `<p class="small">${escape(holdings.domainsError)}</p>`;
  if (!domains.length) {
    return `<p class="small">No KNS domains on this address. Chat will use the address.</p>`;
  }
  return `<div class="kachat-domains">
    <p class="kachat-domain-label">Default name for Chat</p>
    <p class="small">${domains.length} domains. Pick one. This is a local default, not an on-chain change.${primary ? ` On-chain primary: ${escape(primary)}.` : ''}</p>
    <label class="kachat-domain-search"><span class="sr-only">Search domains</span>
      <input type="search" data-kachat-domain-filter placeholder="Search domains" autocomplete="off">
    </label>
    <div class="kachat-domain-list" role="listbox" aria-label="KNS domains">
      <button type="button" class="kachat-domain-item${!selected ? ' is-picked' : ''}" data-kachat-domain="" role="option" aria-selected="${selected ? 'false' : 'true'}">Use address only</button>
      ${domains.map(item => {
        const picked = item.name === selected;
        return `<button type="button" class="kachat-domain-item${picked ? ' is-picked' : ''}" data-kachat-domain="${escape(item.name)}" role="option" aria-selected="${picked}">
          <strong>${escape(item.name)}</strong>
          <small>${item.verified ? 'verified' : escape(item.status || 'listed')}${item.name === primary ? ' · primary' : ''}</small>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

function idle(phone) {
  return `<p>Connect Kasware or Kastle, or skip and open KaChat not logged in.</p>
    <div class="wallet-actions kachat-inject">${injectButtons()}</div>
    ${otherWallets()}
    <div class="wallet-actions">
      <a class="primary-button" href="${appUrl({fresh: true})}">Continue without connecting</a>
      <a class="quiet-button" href="${appUrl({fresh: true, create: true})}">Create a new wallet</a>
    </div>
    <p class="small">${phone ? 'On a phone, Kastle injects. Kasware is a computer extension.' : 'Kasware or Kastle connect in this tab. Never paste a recovery phrase here.'}</p>`;
}

function connected(session, holdings, phone) {
  const domain = savedDomain();
  const label = domain || shortAddress(session.address);
  return `<p class="small">${escape(nameOf(session.id))} · connected</p>
    <p class="wallet-address"><code>${escape(session.address)}</code></p>
    ${holdings ? domainPicker(holdings, domain) : '<p class="small">Reading domains…</p>'}
    <p>Continue opens KaChat on the sign-in screen. Pick the matching saved account, or create/import. This site does not hold keys.</p>
    <div class="wallet-actions">
      <a class="primary-button" href="${appUrl({session, domain})}">Continue as ${escape(label)}</a>
      <a class="quiet-button" href="${appUrl({fresh: true, create: true})}">Create a new wallet</a>
      <button class="quiet-button" type="button" data-wallet-logout>Disconnect</button>
    </div>
    ${phone ? `<p class="small"><a href="https://github.com/KaspaSilver/KaChat-Android/releases/tag/4.1" target="_blank" rel="noopener noreferrer">KaChat Android APK ↗</a></p>` : ''}`;
}

function paint(root, status, holdings) {
  const login = root.querySelector('[data-kachat-login]');
  if (!login) return;
  const session = current();
  const phone = isMobile();
  const body = session.address ? connected(session, holdings, phone) : idle(phone);
  login.innerHTML = status ? `<p class="small" role="status">${escape(status)}</p>${body}` : body;
}

function pickDefault(holdings) {
  const names = (holdings?.domains || []).map(item => item.name);
  const currentPick = savedDomain();
  if (currentPick && names.includes(currentPick)) return currentPick;
  if (holdings?.primary && names.includes(holdings.primary)) return holdings.primary;
  return names[0] || '';
}

export function mountKachat() {
  const root = document.querySelector('[data-kachat]');
  if (!root) return;
  let holdings = null;
  const draw = status => paint(root, status, holdings);
  const load = async () => {
    const session = current();
    if (!session.address) {
      holdings = null;
      draw();
      return;
    }
    draw('Reading KNS domains…');
    try {
      holdings = await loadHoldings(session.address);
      saveDomain(pickDefault(holdings));
      draw();
    } catch (error) {
      holdings = null;
      draw(error.message || 'Domains could not be loaded.');
    }
  };
  draw();
  if (current().address) load();
  document.addEventListener('kaspa-wallet-changed', () => load());
  document.addEventListener('kaspa-wallet-status', event => draw(event.detail || ''));
  document.addEventListener('kaspa-domain-changed', () => {
    const link = root.querySelector('.kachat-login .primary-button[href*="kachat/app"]');
    if (link) link.href = appUrl({session: current(), domain: savedDomain()});
    root.querySelectorAll('[data-kachat-domain]').forEach(button => {
      const on = button.dataset.kachatDomain === savedDomain();
      button.classList.toggle('is-picked', on);
      button.setAttribute('aria-selected', String(on));
    });
  });
  root.addEventListener('click', event => {
    const pick = event.target.closest('[data-kachat-domain]');
    if (!pick) return;
    event.preventDefault();
    saveDomain(pick.dataset.kachatDomain || '');
  });
  root.addEventListener('input', event => {
    const filter = event.target.closest('[data-kachat-domain-filter]');
    if (!filter) return;
    const q = filter.value.trim().toLowerCase();
    root.querySelectorAll('.kachat-domain-item').forEach(item => {
      const name = (item.dataset.kachatDomain || 'address').toLowerCase();
      item.hidden = Boolean(q) && !name.includes(q) && !item.textContent.toLowerCase().includes(q);
    });
  });
}
