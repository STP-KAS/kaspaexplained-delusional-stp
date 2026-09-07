// SDK v2.0.1 returns an OP_DATA_65 script, not the raw ABI signature.
export function rawInputSignature(encoded) {
  if (typeof encoded !== 'string' || !/^41[0-9a-f]{130}$/i.test(encoded)) {
    throw new Error('Unexpected SDK signature encoding. Contract signing stopped.');
  }
  return encoded.slice(2);
}
