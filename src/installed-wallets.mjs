import {loadHoldings, shortAddress} from './wallet-holdings.mjs';

const STORE_ID = 'kaspa-explained-wallet-id';
const STORE_ADDR = 'kaspa-explained-wallet-address';
const CATALOG = [
  ['Kasware', 'https://www.kasware.xyz', 'inject'],
  ['Kastle', 'https://kastle.cc', 'inject'],
  ['KasVault / Ledger', 'https://kasvault.io', 'open'],
  ['Kaspium', 'https://kaspium.io', 'install'],
  ['Kaspa NG', 'https://kaspa-ng.org', 'open'],
  ['Tangem', 'https://tangem.com', 'install'],
  ['OneKey', 'https://onekey.so', 'install'],
  ['KasKeeper', 'https://chromewebstore.google.com/detail/kaskeeper/bicbpicnddlclhekbmgafcbkemdikdem', 'install'],
  ['Kurncy', 'https://www.kurncy.com', 'install'],
  ['Zelcore', 'https://zelcore.io', 'install'],
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  sleep(ms).then(() => { throw new Error(label); }),
]);

function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function current() {
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
}

function clearSession() {
  try {
    sessionStorage.removeItem(STORE_ID);
    sessionStorage.removeItem(STORE_ADDR);
  } catch {}
}

function isMobile() {
  return matchMedia('(pointer:coarse)').matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');
}

function detected() {
  const found = [];
  if (!isMobile() && typeof window.kasware !== 'undefined') found.push('kasware');
  if (typeof window.kastle !== 'undefined') found.push('kastle');
  return found;
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
  const wallet = await waitForKasware();
  if (!wallet) {
    window.open('https://www.kasware.xyz', '_blank', 'noopener');
    throw new Error('Kasware is not in this tab. Install the extension, unlock it, then connect.');
  }
  const quiet = await kaswareAccountsQuiet();
  if (quiet[0]) return {id: 'kasware', address: String(quiet[0])};
  const accounts = await withTimeout(wallet.requestAccounts(), 45000, 'Kasware connect timed out');
  if (!accounts?.[0]) throw new Error('Kasware returned no account.');
  return {id: 'kasware', address: String(accounts[0])};
}

async function connectKastle() {
  const wallet = window.kastle;
  if (!wallet?.connect) {
    window.open('https://kastle.cc', '_blank', 'noopener');
    throw new Error('Kastle is not installed.');
  }
  const ok = await withTimeout(wallet.connect(), 45000, 'Kastle connect timed out');
  if (!ok) throw new Error('Kastle connect was declined.');
  const account = await wallet.getAccount();
  const address = account?.address || account;
  if (!address) throw new Error('Kastle returned no account.');
  return {id: 'kastle', address: String(address)};
}

async function walletNetwork(id) {
  try {
    if (id === 'kasware' && window.kasware?.getNetwork) return await window.kasware.getNetwork();
    if (id === 'kastle' && window.kastle?.getNetwork) return await window.kastle.getNetwork();
  } catch {}
  return 'mainnet';
}

async function disconnectWallet() {
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

function renderHoldings(session, holdings, status) {
  if (status) return `<p class="small" role="status">${escape(status)}</p>`;
  if (!session.address) {
    const mobile = isMobile();
    const actions = mobile
      ? '<button class="primary-button" data-wallet-id="kastle">Kastle</button>'
      : '<button class="primary-button" data-wallet-id="kasware">Kasware</button><button class="quiet-button" data-wallet-id="kastle">Kastle</button>';
    const lead = mobile
      ? 'On a phone, connect Kastle in this tab. This site never asks for a recovery phrase.'
      : 'Connect Kasware or Kastle in this tab. This site never asks for a recovery phrase.';
    const inject = mobile
      ? 'On a phone, only Kastle injects here. Kasware is a desktop extension.'
      : 'Only Kasware and Kastle inject here. The rest stay in their own apps.';
    return `<p>${lead}</p>
      <div class="wallet-actions">${actions}</div>
      <p class="small">Detected: ${detected().join(', ') || 'none'}.</p>
      <section class="wallet-section"><h3>Other wallets</h3><p class="small">${inject}</p>
      <ul class="wallet-catalog">${CATALOG.filter(([, , kind]) => kind !== 'inject').map(([name, url]) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${escape(name)}</a></li>`).join('')}</ul></section>`;
  }
  const tokenRows = (holdings?.tokens || []).map(token => `<tr><th>${escape(token.tick)}</th><td>${escape(token.amount)}</td></tr>`).join('');
  const domainRows = (holdings?.domains || []).map(domain => `<tr><th>${escape(domain.name)}</th><td>${domain.verified ? 'verified' : escape(domain.status || 'listed')}</td></tr>`).join('');
  return `<p class="small">${escape(session.id)} · ${escape(holdings?.network || 'mainnet')}${holdings?.primary ? ` · ${escape(holdings.primary)}` : ''}</p>
    <p class="wallet-address"><code>${escape(session.address)}</code></p>
    <section class="wallet-section"><h3>KAS</h3><p class="wallet-kas">${holdings?.kas != null ? escape(holdings.kas) : 'Not checked'}</p>${holdings?.kasError ? `<p class="small">${escape(holdings.kasError)}</p>` : ''}</section>
    ${rows('Tokens', tokenRows, 'No KRC-20 tokens reported for this address.', holdings?.tokensError)}
    ${rows('Domains', domainRows, 'No KNS domains reported for this address.', holdings?.domainsError)}
    <div class="wallet-actions"><button class="quiet-button" data-wallet-refresh>Refresh</button><button class="quiet-button" data-wallet-logout>Disconnect</button></div>
    <p class="small">Indexer views. Not a proof of spendability. Testnet playground wallets on this site stay separate.</p>`;
}

function paint(root, session, holdings, status) {
  const open = root.querySelector('[data-wallet-open]');
  if (open) {
    const idle = isMobile() ? 'Kastle' : 'Kasware';
    open.textContent = session.address ? shortAddress(session.address) : idle;
    open.title = session.address || (isMobile() ? 'Connect Kastle' : 'Connect Kasware or Kastle');
    open.setAttribute('aria-pressed', String(Boolean(session.address)));
  }
  for (const target of root.querySelectorAll('[data-wallet-view]')) target.innerHTML = renderHoldings(session, holdings, status);
}

export function mountInstalledWallet() {
  const tools = document.querySelector('.header-tools');
  if (!tools || tools.querySelector('[data-wallet-open]')) return;
  const wrap = document.createElement('div');
  wrap.className = 'wallet-shell';
  wrap.innerHTML = `<button class="wallet-button" type="button" data-wallet-open aria-expanded="false" aria-controls="wallet-panel">${isMobile() ? 'Kastle' : 'Kasware'}</button>
    <div class="wallet-panel" id="wallet-panel" data-wallet-panel hidden><div data-wallet-view></div></div>`;
  tools.append(wrap);
  const page = document.querySelector('[data-wallet-page-root]');
  if (page) page.setAttribute('data-wallet-view', '');
  const panel = wrap.querySelector('[data-wallet-panel]');
  const open = wrap.querySelector('[data-wallet-open]');
  let holdings = null;

  const draw = status => paint(document, current(), holdings, status);
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
    const chosen = isMobile() ? 'kastle' : id;
    const session = chosen === 'kastle' ? await connectKastle() : await connectKasware();
    persist(session.id, session.address);
    panel.hidden = false;
    open.setAttribute('aria-expanded', 'true');
    await load();
  };

  open.addEventListener('click', async () => {
    const session = current();
    if (!session.address && isMobile()) {
      try {
        await connect('kastle');
        return;
      } catch (error) {
        panel.hidden = false;
        open.setAttribute('aria-expanded', 'true');
        draw(error.message);
        return;
      }
    }
    if (!session.address && detected().length === 1) {
      try {
        await connect(detected()[0]);
        return;
      } catch (error) {
        panel.hidden = false;
        open.setAttribute('aria-expanded', 'true');
        draw(error.message);
        return;
      }
    }
    panel.hidden = !panel.hidden;
    open.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden && session.address && !holdings) await load();
    else draw();
  });

  document.addEventListener('click', async event => {
    const pick = event.target.closest('[data-wallet-id]');
    if (pick) {
      try {
        await connect(pick.dataset.walletId);
      } catch (error) {
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
    if (!event.target.closest('.wallet-shell')) {
      panel.hidden = true;
      open.setAttribute('aria-expanded', 'false');
    }
  });

  const resume = async () => {
    if (!isMobile()) {
      const quiet = await kaswareAccountsQuiet();
      if (quiet[0]) persist('kasware', String(quiet[0]));
    }
    const session = current();
    if (isMobile() && session.id === 'kasware') {
      clearSession();
      holdings = null;
    }
    draw();
    if (current().address) await load();
  };

  if (!isMobile() && window.kasware?.on) {
    window.kasware.on('accountsChanged', accounts => {
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
      if (current().address) load();
    });
  }
  resume();
}
