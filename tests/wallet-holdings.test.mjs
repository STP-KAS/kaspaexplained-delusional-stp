import test from 'node:test';
import assert from 'node:assert/strict';
import {formatSompi, formatTokenAmount, networkApis, shortAddress} from '../src/wallet-holdings.mjs';

test('formatSompi keeps whole kaspa and trims dust', () => {
  assert.equal(formatSompi(0), '0');
  assert.equal(formatSompi(100000000), '1');
  assert.equal(formatSompi(123456789), '1.23456789');
  assert.equal(formatSompi(10000000), '0.1');
});

test('formatTokenAmount respects decimals', () => {
  assert.equal(formatTokenAmount('1200000000', 8), '12');
  assert.equal(formatTokenAmount('50', 0), '50');
  assert.equal(formatTokenAmount('1500', 2), '15');
});

test('networkApis maps testnet labels', () => {
  assert.equal(networkApis('kaspa').id, 'mainnet');
  assert.equal(networkApis('kaspaTestnet_10').id, 'testnet-10');
});

test('shortAddress keeps the ends', () => {
  const address = 'kaspa:' + 'q'.repeat(50) + 'endpart';
  const short = shortAddress(address);
  assert.equal(short.startsWith('kaspa:qqqqqq'), true);
  assert.equal(short.endsWith('endpart'), true);
  assert.equal(short.includes('…'), true);
});
