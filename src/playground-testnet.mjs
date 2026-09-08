const FAUCET = 'https://faucet-testnet.kaspanet.io';
const STORE = 'kaspa-playground-tn10-key';
const NETWORKS = ['testnet-10', 'kaspa_testnet', 'kaspa_testnet_10', 'testnet10'];

const root = document.querySelector('[data-playground-testnet]');
if (!root) {
  // Page has no Testnet-10 strip.
} else {
  const q = name => root.querySelector(`[data-pg-${name}]`);
  const say = (text, error = false) => {
    const el = q('status');
    if (!el) return;
    el.textContent = text;
    el.dataset.error = String(error);
  };

  function isTestnetAddress(address) {
    return typeof address === 'string' && address.startsWith('kaspatest:');
  }

  function paintKasware(address, network) {
    q('kasware-address').textContent = address || 'Not connected';
    q('kasware-network').textContent = network || 'Unknown';
    q('kasware-warn').hidden = !address || isTestnetAddress(address);
    q('kasware-faucet').hidden = !isTestnetAddress(address);
  }

  function paintGenerated(address) {
    q('generated-address').textContent = address || 'No disposable wallet yet';
    q('generated-faucet').hidden = !address;
    q('generated-lab').hidden = !address;
  }

  async function waitForKasware() {
    if (window.kasware) return window.kasware;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      if (window.kasware) return window.kasware;
    }
    return null;
  }

  async function switchToTestnet(wallet) {
    if (!wallet?.switchNetwork) return wallet.getNetwork?.() || '';
    let last = '';
    for (const id of NETWORKS) {
      try {
        await wallet.switchNetwork(id);
        last = await wallet.getNetwork?.() || id;
        if (String(last).toLowerCase().includes('test')) return last;
      } catch {
        last = await wallet.getNetwork?.() || last;
      }
    }
    return last;
  }

  async function connectKasware() {
    const wallet = await waitForKasware();
    if (!wallet) {
      window.open('https://www.kasware.xyz', '_blank', 'noopener');
      say('Kasware is not in this browser. Install it, switch the wallet to Testnet 10, then connect again.', true);
      return;
    }
    say('Connecting Kasware…');
    const network = await switchToTestnet(wallet);
    const accounts = await wallet.requestAccounts();
    const address = accounts?.[0] ? String(accounts[0]) : '';
    paintKasware(address, network);
    if (!address) {
      say('Kasware returned no address.', true);
      return;
    }
    if (!isTestnetAddress(address)) {
      say('Kasware is still on mainnet. In Kasware settings, switch Network to Testnet 10, then connect again.', true);
      return;
    }
    say('Kasware is on Testnet-10. Use the faucet for tKAS. Never paste a seed here.');
  }

  async function generateWallet() {
    say('Creating a disposable Testnet-10 wallet…');
    try {
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
      if (!key) throw new Error('key');
      const address = key.toAddress('testnet-10').toString();
      sessionStorage.setItem(STORE, key.toString());
      paintGenerated(address);
      q('generated-secret').textContent = 'Saved in this tab only. Open the details below if you need the hex. This is Testnet-10. Not a seed phrase. Not mainnet.';
      q('generated-hex').textContent = key.toString();
      say('Disposable tKAS wallet ready. Fund it from the Testnet-10 faucet. Use the town lab if you want the full experiment.');
    } catch {
      say('The integrated wallet could not load here. Open the Testnet-10 lab and press Create test wallet.', true);
    }
  }

  function restoreGenerated() {
    const hex = sessionStorage.getItem(STORE);
    if (!hex) return;
    import('/assets/kaspa/kaspa.js').then(async loaded => {
      await loaded.default({module_or_path: '/assets/kaspa/kaspa_bg.wasm'});
      const key = new loaded.PrivateKey(hex);
      paintGenerated(key.toAddress('testnet-10').toString());
      q('generated-secret').textContent = 'Restored from this tab.';
      q('generated-hex').textContent = hex;
    }).catch(() => {});
  }

  q('kasware')?.addEventListener('click', () => connectKasware().catch(error => {
    say(error?.message || 'Kasware connect failed.', true);
  }));
  q('generate')?.addEventListener('click', () => generateWallet().catch(error => {
    say(error?.message || 'Wallet generate failed.', true);
  }));
  restoreGenerated();
}
