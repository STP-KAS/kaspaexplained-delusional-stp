const MAIN = {
  id: 'mainnet',
  kas: 'https://api.kaspa.org',
  kns: 'https://api.knsdomains.org/mainnet',
  krc20: 'https://api.kasplex.org/v1',
};
const TN10 = {
  id: 'testnet-10',
  kas: 'https://api-tn10.kaspa.org',
  kns: 'https://api.knsdomains.org/tn10',
  krc20: 'https://tn10api.kasplex.org/v1',
};

export function networkApis(label) {
  const n = String(label || '').toLowerCase();
  if (n.includes('test') || n.includes('tn10') || n.includes('tn-10')) return TN10;
  return MAIN;
}

export function formatSompi(value) {
  const n = BigInt(value || 0);
  const neg = n < 0n;
  const abs = neg ? -n : n;
  const whole = abs / 100000000n;
  const frac = abs % 100000000n;
  const fracText = frac.toString().padStart(8, '0').replace(/0+$/, '');
  const body = fracText ? `${whole.toString()}.${fracText}` : whole.toString();
  return `${neg ? '-' : ''}${body}`;
}

export function formatTokenAmount(balance, decimals) {
  const d = Number(decimals);
  if (!Number.isInteger(d) || d < 0 || d > 18) return String(balance ?? '0');
  const raw = String(balance ?? '0').replace(/^-/, '');
  const sign = String(balance ?? '0').startsWith('-') ? '-' : '';
  if (d === 0) return sign + raw;
  const pad = raw.padStart(d + 1, '0');
  const cut = pad.length - d;
  return sign + `${pad.slice(0, cut)}.${pad.slice(cut)}`.replace(/\.?0+$/, '');
}

export function shortAddress(address) {
  const a = String(address || '');
  if (a.length <= 22) return a;
  return `${a.slice(0, 12)}…${a.slice(-8)}`;
}

async function readJson(url) {
  const response = await fetch(url, {headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error(`Lookup failed (${response.status})`);
  return response.json();
}

function tokenRows(payload) {
  const list = payload?.result || payload?.data || payload?.tokens || [];
  if (!Array.isArray(list)) return [];
  return list.map(item => ({
    tick: item.tick || item.ticker || item.symbol || 'token',
    amount: formatTokenAmount(item.balance ?? item.amount ?? 0, item.dec ?? item.decimal ?? item.decimals ?? 0),
    locked: item.locked != null ? formatTokenAmount(item.locked, item.dec ?? item.decimal ?? item.decimals ?? 0) : null,
  })).filter(row => row.tick);
}

function domainRows(payload) {
  const list = payload?.data?.assets || payload?.assets || payload?.data || [];
  if (!Array.isArray(list)) return [];
  return list.filter(item => item.isDomain !== false).map(item => ({
    name: item.asset || item.fullName || item.name || '',
    status: item.status || '',
    verified: Boolean(item.isVerifiedDomain || item.isVerified),
  })).filter(row => row.name);
}

export async function loadHoldings(address, networkLabel) {
  const apis = networkApis(networkLabel);
  const encoded = encodeURIComponent(address);
  const [kas, tokens, domains, primary] = await Promise.allSettled([
    readJson(`${apis.kas}/addresses/${encoded}/balance`),
    readJson(`${apis.krc20}/krc20/address/${encoded}/tokenlist`),
    readJson(`${apis.kns}/api/v1/assets?${new URLSearchParams({owner: address, type: 'domain', pageSize: '50'})}`),
    readJson(`${apis.kns}/api/v1/primary-name/${encoded}`),
  ]);
  const kasValue = kas.status === 'fulfilled' ? (kas.value.balance ?? kas.value) : null;
  const primaryName = primary.status === 'fulfilled'
    ? (primary.value?.data?.domain?.fullName || primary.value?.domain?.fullName || null)
    : null;
  return {
    network: apis.id,
    address,
    kas: kasValue == null ? null : formatSompi(kasValue),
    kasError: kas.status === 'rejected' ? 'KAS balance is unavailable from the explorer.' : null,
    tokens: tokens.status === 'fulfilled' ? tokenRows(tokens.value) : [],
    tokensError: tokens.status === 'rejected' ? 'Token list is unavailable from the Kasplex indexer.' : null,
    domains: domains.status === 'fulfilled' ? domainRows(domains.value) : [],
    domainsError: domains.status === 'rejected' ? 'Domain list is unavailable from the KNS indexer.' : null,
    primary: primaryName,
  };
}
