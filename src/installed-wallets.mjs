import {loadHoldings, shortAddress} from './wallet-holdings.mjs';

const STORE_DOMAIN = 'kaspa-explained-default-domain';

const STORE_ID = 'kaspa-explained-wallet-id';
const STORE_ADDR = 'kaspa-explained-wallet-address';

export const CATALOG = [
  {id: 'kasware', name: 'Kasware', url: 'https://www.kasware.xyz', kind: 'inject', where: 'Computer extension'},
  {id: 'kastle', name: 'Kastle', url: 'https://kastle.cc', kind: 'inject', where: 'Computer or phone'},
  {id: 'kasvault', name: 'KasVault / Ledger', url: 'https://kasvault.io', kind: 'open', where: 'Computer, hardware'},
  {id: 'kaspium', name: 'Kaspium', url: 'https://kaspium.io', kind: 'install', where: 'Phone'},
  {id: 'kaspa-ng', name: 'Kaspa NG', url: 'https://kaspa-ng.org', kind: 'open', where: 'Computer'},
  {id: 'tangem', name: 'Tangem', url: 'https://tangem.com', kind: 'install', where: 'Phone card'},
  {id: 'onekey', name: 'OneKey', url: 'https://onekey.so', kind: 'install', where: 'Computer or phone'},
  {id: 'kaskeeper', name: 'KasKeeper', url: 'https://chromewebstore.google.com/detail/kaskeeper/bicbpicnddlclhekbmgafcbkemdikdem', kind: 'install', where: 'Computer extension'},
  {id: 'kurncy', name: 'Kurncy', url: 'https://www.kurncy.com', kind: 'install', where: 'Phone'},
  {id: 'zelcore', name: 'Zelcore', url: 'https://zelcore.io', kind: 'install', where: 'Computer or phone'},
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  sleep(ms).then(() => { throw new Error(label); }),
]);

function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function savedDomain() {
  try { return sessionStorage.getItem(STORE_DOMAIN) || ''; } catch { return ''; }
}

export function saveDomain(name) {
  try {
    if (name) sessionStorage.setItem(STORE_DOMAIN, name);
    else sessionStorage.removeItem(STORE_DOMAIN);
  } catch {}
  document.dispatchEvent(new CustomEvent('kaspa-domain-changed', {detail: name || ''}));
}

export function current() {
  try {
    return {
      id: sessionStorage.getItem(STORE_ID) || '',
      address: sessionStorage.getItem(STORE_ADDR) || '',
    };
  } catch {
    return {id: '', address: ''};
  }
}

function persist(id, address) {
  try {
    sessionStorage.setItem(STORE_ID, id);
    sessionStorage.setItem(STORE_ADDR, address);
  } catch {}
  announce();
}

function clearSession() {
  try {
    sessionStorage.removeItem(STORE_ID);
    sessionStorage.removeItem(STORE_ADDR);
  } catch {}
  announce();
}

function announce() {
  document.dispatchEvent(new CustomEvent('kaspa-wallet-changed', {detail: current()}));
}

export function isMobile() {
  return matchMedia('(pointer:coarse)').matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');
}

export function detected() {
  const found = [];
  if (typeof window.kasware !== 'undefined') found.push('kasware');
  if (typeof window.kastle !== 'undefined') found.push('kastle');
  return found;
}

function catalogItem(id) {
  return CATALOG.find(item => item.id === id);
}

async function waitForKasware() {
  if (window.kasware) return window.kasware;
  for (let i = 0; i < 10; i++) {
    await sleep(100 * (i + 1));
    if (window.kasware) return window.kasware;
  }
  return null;
}

async function kaswareAccountsQuiet() {
  const wallet = window.kasware;
  if (!wallet?.getAccounts) return [];
  try {
    const accounts = await withTimeout(wallet.getAccounts(), 2500, 'Kasware getAccounts timed out');
    return accounts?.length ? accounts : [];
  } catch {
    return [];
  }
}

async function connectKasware() {
  const wallet = window.kasware;
  if (!wallet?.requestAccounts) {
    window.open('https://www.kasware.xyz', '_blank', 'noopener');
    throw new Error('Kasware is not in this tab. Install the extension, unlock it, then log in again.');
  }
  const accounts = await withTimeout(wallet.requestAccounts(), 120000, 'Kasware approval timed out. Open Kasware, unlock it, pick an account, and approve.');
  const address = String(accounts?.[0]?.address || accounts?.[0] || '');
  if (!address) throw new Error('Kasware returned no account. Approve Log in in the Kasware popup.');
  return {id: 'kasware', address};
}

async function connectKastle() {
  const wallet = window.kastle;
  if (!wallet?.connect) {
    window.open('https://kastle.cc', '_blank', 'noopener');
    throw new Error('Kastle is not in this tab. Install it, unlock it, then pick Kastle again.');
  }
  const ok = await withTimeout(wallet.connect(), 45000, 'Kastle connect timed out');
  if (!ok) throw new Error('Kastle connect was declined.');
  const account = await wallet.getAccount();
  const address = account?.address || account;
  if (!address) throw new Error('Kastle returned no account.');
  return {id: 'kastle', address: String(address)};
}

export async function connectById(id) {
  const item = catalogItem(id);
  if (!item) throw new Error('Unknown wallet.');
  if (item.kind === 'inject') {
    return id === 'kastle' ? connectKastle() : connectKasware();
  }
  window.open(item.url, '_blank', 'noopener');
  throw new Error(`${item.name} stays in its own app. It does not inject here. Open KaChat Desktop or the KaChat phone app and log in with that wallet. This site never asks for a recovery phrase.`);
}

async function walletNetwork(id) {
  try {
    if (id === 'kasware' && window.kasware?.getNetwork) return await window.kasware.getNetwork();
    if (id === 'kastle' && window.kastle?.getNetwork) return await window.kastle.getNetwork();
  } catch {}
  return 'mainnet';
}

export async function disconnectWallet() {
  const {id} = current();
  try {
    if (id === 'kasware' && window.kasware?.disconnect) await window.kasware.disconnect(location.origin);
  } catch {}
  try {
    if (id === 'kastle' && window.kastle?.disconnect) await window.kastle.disconnect();
  } catch {}
  clearSession();
}

function rows(title, items, empty, error) {
  if (error) return `<section class="wallet-section"><h3>${title}</h3><p class="small">${escape(error)}</p></section>`;
  if (!items.length) return `<section class="wallet-section"><h3>${title}</h3><p class="small">${empty}</p></section>`;
  return `<section class="wallet-section"><h3>${title}</h3><table><tbody>${items}</tbody></table></section>`;
}

function choiceButtons() {
  const found = detected();
  return `<div class="wallet-choice" role="list">${CATALOG.map(item => {
    const foundMark = found.includes(item.id) ? ' · detected' : '';
    const action = item.kind === 'inject' ? 'Connect in this tab' : 'Open app';
    const klass = item.kind === 'inject' ? 'primary-button' : 'quiet-button';
    return `<button class="${klass}" type="button" data-wallet-id="${item.id}" role="listitem">
      <strong>${escape(item.name)}</strong>
      <small>${escape(action)} · ${escape(item.where)}${foundMark}</small>
    </button>`;
  }).join('')}</div>`;
}

function renderHoldings(session, holdings, status) {
  if (status) return `<p class="small" role="status">${escape(status)}</p>${session.address ? '' : choiceButtons()}`;
  if (!session.address) {
    return `<p>Pick a wallet. Only Kasware and Kastle inject in this tab. The rest open in their own app. This site never asks for a recovery phrase.</p>
      ${choiceButtons()}
      <p class="small">Detected: ${detected().join(', ') || 'none'}.</p>`;
  }
  const tokenRows = (holdings?.tokens || []).map(token => `<tr><th>${escape(token.tick)}</th><td>${escape(token.amount)}</td></tr>`).join('');
  const picked = savedDomain();
  const domainRows = (holdings?.domains || []).map(domain => {
    const on = domain.name === picked;
    return `<tr><th><button class="wallet-domain-pick${on ? ' is-picked' : ''}" type="button" data-pick-domain="${escape(domain.name)}">${escape(domain.name)}</button></th><td>${domain.verified ? 'verified' : escape(domain.status || 'listed')}</td></tr>`;
  }).join('');
  const name = catalogItem(session.id)?.name || session.id;
  const shown = picked || holdings?.primary || '';
  return `<p class="small">${escape(name)} · ${escape(holdings?.network || 'mainnet')}${shown ? ` · ${escape(shown)}` : ''}</p>
    <p class="wallet-address"><code>${escape(session.address)}</code></p>
    <section class="wallet-section"><h3>KAS</h3><p class="wallet-kas">${holdings?.kas != null ? escape(holdings.kas) : 'Not checked'}</p>${holdings?.kasError ? `<p class="small">${escape(holdings.kasError)}</p>` : ''}</section>
    ${rows('Tokens', tokenRows, 'No KRC-20 tokens reported for this address.', holdings?.tokensError)}
    ${rows('Domains', domainRows, 'No KNS domains reported for this address.', holdings?.domainsError)}
    <p class="small">${domainRows ? 'Tap a domain to use it as the Chat default.' : ''}</p>
    <div class="wallet-actions"><button class="quiet-button" type="button" data-wallet-refresh>Refresh</button><button class="quiet-button" type="button" data-wallet-logout>Disconnect</button></div>
    <p class="small">Indexer views. Not a proof of spendability. Testnet playground wallets on this site stay separate. Switch wallet: disconnect, then pick another.</p>`;
}

function paint(root, session, holdings, status) {
  const open = root.querySelector('[data-wallet-open]');
  if (open) {
    const domain = savedDomain();
    open.textContent = session.address ? (domain || shortAddress(session.address)) : 'Wallet';
    open.title = domain || session.address || 'Pick a wallet';
    open.setAttribute('aria-pressed', String(Boolean(session.address)));
  }
  for (const target of root.querySelectorAll('[data-wallet-view]')) target.innerHTML = renderHoldings(session, holdings, status);
}

export function mountInstalledWallet() {
  const tools = document.querySelector('.header-tools');
  if (!tools || tools.querySelector('[data-wallet-open]')) return;
  const wrap = document.createElement('div');
  wrap.className = 'wallet-shell';
  wrap.innerHTML = `<button class="wallet-button" type="button" data-wallet-open aria-expanded="false" aria-controls="wallet-panel">Wallet</button>
    <div class="wallet-panel" id="wallet-panel" data-wallet-panel hidden><div data-wallet-view></div></div>`;
  tools.append(wrap);
  const page = document.querySelector('[data-wallet-page-root]');
  if (page) page.setAttribute('data-wallet-view', '');
  const panel = wrap.querySelector('[data-wallet-panel]');
  const open = wrap.querySelector('[data-wallet-open]');
  let holdings = null;

  const draw = status => {
    paint(document, current(), holdings, status);
    if (status) document.dispatchEvent(new CustomEvent('kaspa-wallet-status', {detail: status}));
  };
  const load = async () => {
    const session = current();
    if (!session.address) {
      holdings = null;
      draw();
      return;
    }
    draw('Reading KAS, tokens, and domains…');
    try {
      holdings = await loadHoldings(session.address, await walletNetwork(session.id));
      draw();
    } catch (error) {
      draw(error.message || 'Holdings could not be loaded.');
    }
  };

  const connect = async id => {
    const session = await connectById(id);
    persist(session.id, session.address);
    panel.hidden = false;
    open.setAttribute('aria-expanded', 'true');
    await load();
  };

  open.addEventListener('click', async () => {
    panel.hidden = !panel.hidden;
    open.setAttribute('aria-expanded', String(!panel.hidden));
    const session = current();
    if (!panel.hidden && session.address && !holdings) await load();
    else draw();
  });

  document.addEventListener('kaspa-domain-changed', () => draw());

  document.addEventListener('click', async event => {
    const domainPick = event.target.closest('[data-pick-domain]');
    if (domainPick) {
      saveDomain(domainPick.dataset.pickDomain || '');
      draw();
      return;
    }
    const pick = event.target.closest('[data-wallet-id]');
    if (pick) {
      try {
        if (pick.dataset.walletId === 'kasware' && window.kasware?.requestAccounts) {
          const approval = window.kasware.requestAccounts();
          let accounts = await withTimeout(approval, 120000, 'Kasware approval timed out. Open Kasware, unlock it, pick an account, and approve.');
          if (!accounts?.[0]) {
            try { accounts = await window.kasware.getAccounts?.(); } catch { accounts = []; }
          }
          const address = String(accounts?.[0]?.address || accounts?.[0] || '');
          if (!address) throw new Error('Kasware returned no account. Approve Log in in the Kasware popup.');
          persist('kasware', address);
          panel.hidden = false;
          open.setAttribute('aria-expanded', 'true');
          await load();
          return;
        }
        await connect(pick.dataset.walletId);
      } catch (error) {
        panel.hidden = false;
        open.setAttribute('aria-expanded', 'true');
        draw(error.message);
      }
      return;
    }
    if (event.target.closest('[data-wallet-logout]')) {
      await disconnectWallet();
      holdings = null;
      draw();
      return;
    }
    if (event.target.closest('[data-wallet-refresh]')) {
      await load();
      return;
    }
    if (!event.target.closest('.wallet-shell') && !event.target.closest('[data-kachat]')) {
      panel.hidden = true;
      open.setAttribute('aria-expanded', 'false');
    }
  });

  const resume = async () => {
    if (!isMobile()) {
      const quiet = await kaswareAccountsQuiet();
      if (quiet[0] && current().id === 'kasware') persist('kasware', String(quiet[0]));
    }
    const session = current();
    if (isMobile() && session.id === 'kasware' && typeof window.kasware === 'undefined') {
      clearSession();
      holdings = null;
    }
    draw();
    if (current().address) await load();
  };

  if (window.kasware?.on) {
    window.kasware.on('accountsChanged', accounts => {
      if (current().id !== 'kasware') return;
      if (!accounts?.[0]) {
        clearSession();
        holdings = null;
        draw();
        return;
      }
      persist('kasware', String(accounts[0]));
      load();
    });
    window.kasware.on('networkChanged', () => {
      if (current().id === 'kasware' && current().address) load();
    });
  }
  resume();
}
