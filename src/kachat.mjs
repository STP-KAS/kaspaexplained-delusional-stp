import {CATALOG, current, detected, isMobile} from './installed-wallets.mjs';
import {shortAddress} from './wallet-holdings.mjs';

function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function nameOf(id) {
  return CATALOG.find(item => item.id === id)?.name || id;
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

function idle(phone) {
  return `<p>Pick the wallet you already use. Kasware and Kastle can log in here. Every other wallet opens in its own app. This site never asks for a recovery phrase.</p>
    ${choiceButtons()}
    <p class="small">Detected in this tab: ${detected().join(', ') || 'none'}. ${phone ? 'On a phone, Kastle injects. Kasware is a computer extension. Kaspium, Tangem, Kurncy, and the KaChat Android app are the phone path.' : 'On a computer, Kasware or Kastle inject. Ledger is KasVault.'}</p>`;
}

function connected(session, phone) {
  return `<p class="small">${escape(nameOf(session.id))} · logged in</p>
    <p class="wallet-address"><code>${escape(session.address)}</code></p>
    <p>That address is your Kaspa identity. KaChat Desktop and the KaChat phone app use the same identity if you log in with the same wallet there. This page does not send messages and does not hold keys.</p>
    <div class="wallet-actions">
      <a class="primary-button" href="${phone ? 'https://github.com/KaspaSilver/KaChat-Android/releases/tag/4.1' : 'https://github.com/KaspaSilver/KaChat-Desktop'}" target="_blank" rel="noopener noreferrer">${phone ? 'Get KaChat for Android' : 'Open KaChat Desktop'} ↗</a>
      <button class="quiet-button" type="button" data-wallet-logout>Disconnect</button>
    </div>
    <p class="small">${escape(shortAddress(session.address))}. Switch wallet: disconnect, then pick another.</p>`;
}

function paint(root, status) {
  const login = root.querySelector('[data-kachat-login]');
  if (!login) return;
  const session = current();
  const phone = isMobile();
  const body = session.address ? connected(session, phone) : idle(phone);
  login.innerHTML = status ? `<p class="small" role="status">${escape(status)}</p>${body}` : body;
}

export function mountKachat() {
  const root = document.querySelector('[data-kachat]');
  if (!root) return;
  paint(root);
  document.addEventListener('kaspa-wallet-changed', () => paint(root));
  document.addEventListener('kaspa-wallet-status', event => paint(root, event.detail || ''));
}
