// Pinned rusty-kaspa v2.0.1 TN10 relay policy, narrowly scoped to the
// workshop's version-0, one-input, two-P2PK-output, empty-payload split.
// Storage mass is still validated separately. Relay admission is not inclusion.
export function splitRelayFee(signatureBytes,rate=100){
  if(!Number.isSafeInteger(signatureBytes)||signatureBytes<1||signatureBytes>100000)throw new Error('Invalid signature-script length.');
  if(!Number.isFinite(rate)||rate<100||rate>100000)throw new Error('Invalid node fee estimate.');
  const compute=1970+signatureBytes,transient=500+2*signatureBytes;
  return BigInt(Math.ceil(Math.max(compute,transient)*rate))+1000n;
}
