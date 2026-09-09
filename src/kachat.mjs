import {CATALOG, current, detected, isMobile} from './installed-wallets.mjs';
import {loadHoldings, shortAddress} from './wallet-holdings.mjs';

const STORE_DOMAIN = 'kaspa-explained-default-domain';
const APP = '/kachat/app/';

function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function nameOf(id) {
  return CATALOG.find(item => item.id === id)?.name || id;
}

function savedDomain() {
  try { return sessionStorage.getItem(STORE_DOMAIN) || ''; } catch { return ''; }
}

function saveDomain(name) {
  try {
    if (name) sessionStorage.setItem(STORE_DOMAIN, name);
    else sessionStorage.removeItem(STORE_DOMAIN);
  } catch {}
}

function appUrl(session, domain) {
  const params = new URLSearchParams();
  params.set('from', 'explained');
  if (session?.address) params.set('address', session.address);
  if (domain) params.set('domain', domain);
  return `${APP}?${params}`;
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

function domainPicker(holdings, chosen) {
  const domains = holdings?.domains || [];
  const primary = holdings?.primary || '';
  const selected = domains.some(item => item.name === chosen) ? chosen : (primary || '');
  if (holdings?.domainsError) {
    return `<p class="small">${escape(holdings.domainsError)}</p>`;
  }
  if (!domains.length) {
    return `<p class="small">No KNS domains on this address. KaChat will use the address until you register one.</p>`;
  }
  return `<fieldset class="kachat-domains">
    <legend>Default domain</legend>
    <p class="small">Local choice for this tab. It does not change the on-chain primary name.${primary ? ` KNS primary now: ${escape(primary)}.` : ''}</p>
    <label><input type="radio" name="kachat-domain" value="" ${selected ? '' : 'checked'}> Use the address only</label>
    ${domains.map(item => {
      const mark = item.name === primary ? ' · KNS primary' : '';
      const check = item.name === selected ? ' checked' : '';
      return `<label><input type="radio" name="kachat-domain" value="${escape(item.name)}"${check}> ${escape(item.name)}${item.verified ? ' · verified' : ''}${mark}</label>`;
    }).join('')}
  </fieldset>`;
}

function idle(phone) {
  return `<p>Do you want to connect a wallet first? Kasware and Kastle can log in here. If not, open KaChat Desktop without being logged in. There you can create a new wallet or import one you already have. This site never asks for a recovery phrase.</p>
    ${choiceButtons()}
    <div class="wallet-actions">
      <a class="primary-button" href="${APP}" data-kachat-open="guest">Continue without connecting</a>
      <a class="quiet-button" href="${APP}" data-kachat-open="create">Create a new wallet in KaChat</a>
    </div>
    <p class="small">Detected in this tab: ${detected().join(', ') || 'none'}. ${phone ? 'On a phone, Kastle injects. Kasware is a computer extension. Create or import inside KaChat, or install the Android APK.' : 'On a computer, Kasware or Kastle inject. Ledger is KasVault.'}</p>`;
}

function connected(session, holdings, phone) {
  const domain = savedDomain();
  return `<p class="small">${escape(nameOf(session.id))} · connected</p>
    <p class="wallet-address"><code>${escape(session.address)}</code></p>
    ${holdings ? domainPicker(holdings, domain) : '<p class="small">Reading domains…</p>'}
    <p>Next, KaChat Desktop opens not logged in. Create a new wallet there, or import the same wallet you connected here. Your default domain is remembered in this tab.</p>
    <div class="wallet-actions">
      <a class="primary-button" href="${appUrl(session, domain)}" data-kachat-open="app">Open KaChat Desktop</a>
      <a class="quiet-button" href="${APP}" data-kachat-open="create">Create a new wallet instead</a>
      <button class="quiet-button" type="button" data-wallet-logout>Disconnect</button>
    </div>
    ${phone ? `<p class="small"><a href="https://github.com/KaspaSilver/KaChat-Android/releases/tag/4.1" target="_blank" rel="noopener noreferrer">KaChat Android APK ↗</a></p>` : ''}
    <p class="small">${escape(shortAddress(session.address))}. Switch wallet: disconnect, then pick another.</p>`;
}

function paint(root, status, holdings) {
  const login = root.querySelector('[data-kachat-login]');
  if (!login) return;
  const session = current();
  const phone = isMobile();
  const body = session.address ? connected(session, holdings, phone) : idle(phone);
  login.innerHTML = status ? `<p class="small" role="status">${escape(status)}</p>${body}` : body;
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
      const pick = savedDomain();
      if (pick && !(holdings.domains || []).some(item => item.name === pick)) saveDomain(holdings.primary || '');
      else if (!pick && holdings.primary) saveDomain(holdings.primary);
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
  root.addEventListener('change', event => {
    const input = event.target.closest('input[name="kachat-domain"]');
    if (!input) return;
    saveDomain(input.value);
    const link = root.querySelector('[data-kachat-open="app"]');
    if (link) link.href = appUrl(current(), savedDomain());
  });
}
