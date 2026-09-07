export function normalizeTransaction(raw, checked = new Date().toISOString()) {
  if (!raw || !/^[a-f0-9]{64}$/.test(raw.transaction_id || '')) throw new Error('The data provider returned an unrecognized transaction.');
  const amount = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
  const inputs = (Array.isArray(raw.inputs) ? raw.inputs : []).map(input => ({
    transaction: String(input.previous_outpoint_hash || ''), index: input.previous_outpoint_index,
    address: input.previous_outpoint_address || null,
    sompi: amount(input.previous_outpoint_amount ?? input.previous_outpoint_resolved?.amount),
  }));
  const outputs = (Array.isArray(raw.outputs) ? raw.outputs : []).map(output => ({
    index: output.index, address: output.script_public_key_address || null, sompi: amount(output.amount),
  }));
  const sum = values => values.length && values.every(v => v.sompi !== null) ? values.reduce((total, v) => total + BigInt(v.sompi), 0n) : null;
  const totalIn = sum(inputs), totalOut = sum(outputs);
  return {
    id: raw.transaction_id, checked, source: 'https://api.kaspa.org', network: 'Kaspa mainnet',
    accepted: typeof raw.is_accepted === 'boolean' ? raw.is_accepted : null,
    acceptingBlock: raw.accepting_block_hash || null, containingBlocks: Array.isArray(raw.block_hash) ? raw.block_hash : [],
    inputs, outputs, inputSompi: totalIn?.toString() ?? null, outputSompi: totalOut?.toString() ?? null,
    feeSompi: totalIn !== null && totalOut !== null && totalIn >= totalOut ? (totalIn - totalOut).toString() : null,
  };
}

export async function lookupTransaction(id, fetcher = fetch) {
  if (!/^[a-f0-9]{64}$/.test(id)) return { status: 400, body: { error: 'Enter a 64-character transaction ID using 0–9 and a–f.' } };
  try {
    const response = await fetcher(`https://api.kaspa.org/transactions/${id}?resolve_previous_outpoints=light`, { signal: AbortSignal.timeout(10000), redirect: 'error' });
    if (response.status === 404) return { status: 404, body: { error: 'This provider did not find that transaction. Check the ID and network; absence here is not proof that a transaction is invalid.' } };
    if (!response.ok) throw new Error('provider');
    if (Number(response.headers.get('content-length')) > 2_000_000) throw new Error('size');
    const reader=response.body.getReader();const chunks=[];let length=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>2_000_000){await reader.cancel();throw new Error('size');}chunks.push(value);}}finally{reader.releaseLock();}
    const text = Buffer.concat(chunks).toString('utf8');
    const raw = JSON.parse(text);
    if (raw.transaction_id !== id) throw new Error('mismatch');
    return { status: 200, body: normalizeTransaction(raw) };
  } catch {
    return { status: 502, body: { error: 'The public data service is unavailable or returned incomplete data. Your last result remains below. Try again later or use an independent explorer.' } };
  }
}
