const STORE_KEY = 'kaspa-playground-tn10-key';
const STORE_WATCH = 'kaspa-playground-tn10-watch';
const TN10_API = 'https://api-tn10.kaspa.org';
const RPC_URL = 'wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh';
const SEND_SOMPI = 10_000_000n; // 0.1 tKAS
const MINER_ADDRESS = 'kaspatest:qzpvdakagvwfm95g8pv9ndpupjtndgjfhmve08cg3tv5wgfytjzf7cudwwzv0';

const root = document.querySelector('[data-playground-testnet]');
if (root) {
  const q = name => root.querySelector(`[data-pg-${name}]`);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const withTimeout = (promise, ms, label) => Promise.race([
    promise,
    sleep(ms).then(() => { throw new Error(label); }),
  ]);

  let session = {kind: '', address: '', keyHex: '', network: ''};

  const say = (text, error = false) => {
    const el = q('status');
    if (!el) return;
    el.textContent = text;
    el.dataset.error = String(error);
  };

  const isTn10 = address => typeof address === 'string' && address.startsWith('kaspatest:');

  const shortAddr = address => {
    const a = String(address || '');
    if (a.length <= 22) return a;
    return `${a.slice(0, 12)}…${a.slice(-8)}`;
  };

  const formatTkas = sompi => {
    const n = BigInt(sompi || 0);
    const whole = n / 100000000n;
    const frac = n % 100000000n;
    const fracText = frac.toString().padStart(8, '0').replace(/0+$/, '');
    return fracText ? `${whole}.${fracText}` : whole.toString();
  };

  function sompiFromBalance(b) {
    if (b == null) return 0n;
    if (typeof b === 'bigint') return b;
    if (typeof b === 'number') return BigInt(Math.trunc(b));
    if (typeof b === 'string' && /^\d+$/.test(b)) return BigInt(b);
    const raw = b.total ?? b.confirmed ?? b.balance ?? b.amount ?? 0;
    return BigInt(String(raw).split('.')[0] || 0);
  }

  async function balanceFromApi(address) {
    const response = await fetch(`${TN10_API}/addresses/${encodeURIComponent(address)}/balance`, {
      headers: {Accept: 'application/json'},
    });
    if (!response.ok) throw new Error(`Balance lookup failed (${response.status})`);
    const body = await response.json();
    return sompiFromBalance(body.balance ?? body);
  }

  async function waitForKasware() {
    if (window.kasware) return window.kasware;
    for (let i = 0; i < 10; i++) {
      await sleep(120 * (i + 1));
      if (window.kasware) return window.kasware;
    }
    return null;
  }

  async function kaswareAccountsQuiet() {
    const wallet = window.kasware;
    if (!wallet?.getAccounts) return [];
    try {
      const accounts = await withTimeout(wallet.getAccounts(), 2500, 'getAccounts timeout');
      return accounts?.length ? accounts : [];
    } catch {
      return [];
    }
  }

  function paint() {
    const logged = Boolean(session.address);
    q('paths').hidden = logged;
    q('session').hidden = !logged;
    if (!logged) return;
    const canSend = session.kind === 'kasware' || session.kind === 'local';
    q('kind').textContent = session.kind === 'kasware' ? 'Kasware · Testnet-10'
      : session.kind === 'local' ? 'Local test wallet · this tab'
      : 'Watching an address · read only';
    q('address').textContent = session.address;
    q('network').textContent = session.network || 'Testnet-10';
    q('play').hidden = !canSend;
    q('watch-hint').hidden = session.kind !== 'watch';
    q('mine-hint').hidden = session.kind !== 'local';
  }

  async function refreshBalance() {
    if (!session.address) return;
    q('balance').textContent = '…';
    try {
      let sompi = 0n;
      if (session.kind === 'kasware' && window.kasware?.getBalance) {
        sompi = sompiFromBalance(await window.kasware.getBalance());
      } else {
        sompi = await balanceFromApi(session.address);
      }
      q('balance').textContent = formatTkas(sompi);
      session.sompi = sompi;
    } catch {
      q('balance').textContent = '-';
    }
  }

  function useSession(next) {
    session = next;
    if (next.kind === 'local' && next.keyHex) sessionStorage.setItem(STORE_KEY, next.keyHex);
    if (next.kind === 'watch') sessionStorage.setItem(STORE_WATCH, next.address);
    paint();
    refreshBalance();
  }

  async function loginKasware() {
    const wallet = await waitForKasware();
    if (!wallet) {
      window.open('https://www.kasware.xyz', '_blank', 'noopener');
      say('Kasware is not in this tab. Install it, unlock it, switch Network to Testnet 10 inside Kasware, then Log in.', true);
      return;
    }
    say('Kasware: approve Log in. If the window is black, close it, click the Kasware icon, unlock, try again.');
    const quiet = await kaswareAccountsQuiet();
    const accounts = quiet[0] ? quiet : await withTimeout(wallet.requestAccounts(), 45000, 'Kasware Log in timed out (black window?). Close it and retry.');
    const address = accounts?.[0] ? String(accounts[0]) : '';
    if (!address) throw new Error('Kasware returned no account.');
    let network = '';
    try { network = String(await wallet.getNetwork?.() || ''); } catch {}
    if (!isTn10(address)) {
      say('Kasware is not on Testnet 10. In Kasware, open Settings and switch Network to Testnet 10. Then Log in again. This page will not switch it for you.', true);
      return;
    }
    useSession({kind: 'kasware', address, network: network || 'Testnet-10', keyHex: ''});
    say('Logged in. Balance is your mined tKAS on Testnet-10. The models below do not spend it. Send 0.1 tKAS if you want a real toy payment.');
  }

  async function makeLocal() {
    say('Making a local Testnet-10 wallet…');
    const loaded = await import('/assets/kaspa/kaspa.js');
    await loaded.default({module_or_path: '/assets/kaspa/kaspa_bg.wasm'});
    let key;
    for (let i = 0; i < 8; i++) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      try {
        key = new loaded.PrivateKey(Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''));
        break;
      } catch {}
    }
    if (!key) throw new Error('Could not create a key.');
    const address = key.toAddress('testnet-10').toString();
    q('hex').textContent = key.toString();
    useSession({kind: 'local', address, network: 'Testnet-10', keyHex: key.toString()});
    say('Local wallet ready. Copy the address and point your TN10 miner at it. No faucet. Your coins show up here when the node sees them.');
  }

  async function watchAddress() {
    const address = String(q('watch').value || '').trim();
    if (!isTn10(address)) {
      say('Paste a kaspatest: address. Mainnet kaspa: addresses do not belong on this playground.', true);
      return;
    }
    useSession({kind: 'watch', address, network: 'Testnet-10', keyHex: ''});
    say('Watching that address. To send, Log in with the Kasware that holds it, or make a local wallet and mine to that instead.');
  }

  async function sendToy() {
    const dest = String(q('dest').value || '').trim() || session.address;
    if (!isTn10(dest)) throw new Error('Destination must be a kaspatest: address.');
    if (session.kind === 'kasware') {
      const wallet = window.kasware;
      if (!wallet?.sendKaspa) throw new Error('This Kasware build cannot send from the page.');
      say('Approve the 0.1 tKAS send in Kasware.');
      const id = await withTimeout(wallet.sendKaspa(dest, Number(SEND_SOMPI)), 60000, 'Send timed out. Check Kasware.');
      say(`Sent. ${id ? `Transaction ${id}` : 'Kasware accepted the send.'} Refreshing balance…`);
      await refreshBalance();
      return;
    }
    if (session.kind !== 'local' || !session.keyHex) throw new Error('This address is watch-only.');
    say('Signing 0.1 tKAS from the local wallet…');
    const loaded = await import('/assets/kaspa/kaspa.js');
    await loaded.default({module_or_path: '/assets/kaspa/kaspa_bg.wasm'});
    const key = new loaded.PrivateKey(session.keyHex);
    const rpc = new loaded.RpcClient({url: RPC_URL, networkId: 'testnet-10'});
    await withTimeout(rpc.connect({blockAsyncConnect: true, timeoutDuration: 8000}), 10000, 'Testnet-10 node did not connect.');
    try {
      const {entries} = await rpc.getUtxosByAddresses([session.address]);
      if (!entries?.length) throw new Error('No spendable outputs yet. Mine to this address, then try again.');
      const {transactions} = await loaded.createTransactions({
        entries,
        outputs: [{address: dest, amount: SEND_SOMPI}],
        changeAddress: session.address,
        networkId: 'testnet-10',
        priorityFee: 0n,
      });
      let last = '';
      for (const pending of transactions) {
        pending.sign([key]);
        last = await pending.submit(rpc);
      }
      say(`Sent 0.1 tKAS. ${last || 'Submitted.'} Refreshing balance…`);
      await refreshBalance();
    } finally {
      await rpc.disconnect().catch(() => {});
    }
  }

  function logout() {
    session = {kind: '', address: '', keyHex: '', network: ''};
    paint();
    say('Logged out. Kasware stays installed. The local key stays in this tab until you clear site data.');
  }

  async function restore() {
    const quiet = await kaswareAccountsQuiet();
    if (quiet[0] && isTn10(String(quiet[0]))) {
      let network = '';
      try { network = String(await window.kasware.getNetwork?.() || ''); } catch {}
      useSession({kind: 'kasware', address: String(quiet[0]), network: network || 'Testnet-10', keyHex: ''});
      say('Kasware session restored.');
      return;
    }
    const hex = sessionStorage.getItem(STORE_KEY);
    if (hex && q('hex')) q('hex').textContent = hex;
    const address = MINER_ADDRESS;
    if (q('watch')) q('watch').value = address;
    useSession({kind: 'watch', address, network: 'Testnet-10', keyHex: ''});
    say('Showing your pinned miner address. Log in with Kasware to send from it, or make a local test wallet if you want a different one.');
  }

  q('kasware')?.addEventListener('click', () => loginKasware().catch(error => say(error.message || String(error), true)));
  q('generate')?.addEventListener('click', () => makeLocal().catch(error => say(error.message || String(error), true)));
  q('watch-go')?.addEventListener('click', () => watchAddress().catch(error => say(error.message || String(error), true)));
  q('send')?.addEventListener('click', () => sendToy().catch(error => say(error.message || String(error), true)));
  q('refresh')?.addEventListener('click', () => refreshBalance().catch(error => say(error.message || String(error), true)));
  q('logout')?.addEventListener('click', logout);
  q('copy')?.addEventListener('click', () => {
    const text = session.address;
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => say('Address copied. Point your TN10 miner here if this is your local wallet.')).catch(() => say(text));
  });

  if (window.kasware?.on) {
    window.kasware.on('accountsChanged', accounts => {
      if (session.kind !== 'kasware') return;
      if (!accounts?.[0]) { logout(); return; }
      const address = String(accounts[0]);
      if (!isTn10(address)) {
        say('Kasware left Testnet 10. Switch Network back to Testnet 10 inside Kasware.', true);
        logout();
        return;
      }
      useSession({...session, address});
    });
    window.kasware.on('networkChanged', network => {
      if (session.kind !== 'kasware') return;
      session.network = String(network || '');
      paint();
      if (!String(network).toLowerCase().includes('test')) {
        say('Kasware is not on Testnet 10. Switch it inside Kasware, then Log in again.', true);
      }
    });
  }

  restore().catch(() => {});
}
