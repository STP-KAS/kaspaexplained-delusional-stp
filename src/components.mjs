import {transactionFlow,ledgerGlyph} from './flow-diagrams.mjs';
import {transactionState} from './models.mjs';
import {networkDiagram} from './network-diagram.mjs';
import { networkState, spendState, miningState, vaultState } from './models.mjs';

export const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const link = (label, href) => `<a href="${escape(href)}">${label}<span aria-hidden="true"> ↗</span></a>`;
export const detail = (title, body) => `<details class="detail"><summary>${title}</summary><div class="detail-body">${body}</div></details>`;
export const section = (id, title, body, intro = '') => `<section class="chapter" id="${id}"><div class="section-title"><h2>${title}</h2>${intro ? `<p>${intro}</p>` : ''}</div>${body}</section>`;
export const note = text => `<p class="model-note">${text}</p>`;
export const rows = items => `<div class="reading-rows">${items.map(([title, body]) => `<article><h3>${title}</h3><div>${body}</div></article>`).join('')}</div>`;

export function payment() {
  return `<figure class="experiment payment" data-lab="payment" data-stage="2">
    <div class="experiment-label"><span>A payment through the network</span><span>Illustrated sequence</span></div>
    <div class="payment-scene">
      <div class="wallet-object"><span class="object-label">Sender</span><div class="document-object">${ledgerGlyph('signature')}<strong>Signed payment</strong><small>Permission to spend an output</small></div></div>
      <div class="flow-connector" aria-hidden="true">→</div>
      <div class="block-object"><span class="object-label">Network</span><div class="block-stack"><div class="back-block" aria-hidden="true"></div><div class="front-block">${ledgerGlyph('block')}<span>Block</span><div class="transaction-line is-selected">Your payment</div><div class="transaction-line">Other transactions</div></div></div></div>
      <div class="flow-connector" aria-hidden="true">→</div>
      <div class="receiver-object"><span class="object-label">Recipient</span><div class="receipt-object">${ledgerGlyph('output')}<span data-payment-badge>Accepted</span><strong data-payment-headline>A spendable output</strong><small data-payment-small>In the currently accepted history</small></div></div>
    </div>
    <div class="step-control" role="group" aria-label="Payment stages">${['Sent', 'Included', 'Accepted', 'Later work'].map((label, i) => `<button data-stage="${i}" aria-pressed="${i === 2}"><span class="step-number">${i + 1}</span>${label}</button>`).join('')}</div>
    <figcaption class="experiment-answer" data-payment-answer aria-live="polite">The payment is accepted in the current history. The recipient may still wait before treating it as settled.</figcaption>
    ${note('This sequence has no clock or confirmation count. Inclusion, acceptance, and a recipient’s confidence are different things.')}
  </figure>`;
}

export function network({introductory=false}={}) {
  const state = networkState(500, 400);
  return `<figure class="experiment network${introductory ? ' network-intro' : ''}" data-lab="network">
    <div class="experiment-label"><span>${introductory ? 'Two miners. One network.' : 'Why blocks arrive in parallel'}</span>${introductory?'<div class="network-playback"><button class="quiet-button" data-network-replay>Watch it happen</button><button class="quiet-button" data-network-reset>Reset</button></div>':'<span>Interactive model</span>'}</div>
    <div class="network-workbench"><div class="network-stage"><div class="dag-result" data-dag-result>${networkDiagram(state)}</div><div class="block-inspection" role="status" hidden><strong data-block-title>Inspect a block</strong><p data-block-detail>Select A, B, C, or D in the scene to see its references.</p></div><div class="network-presets" role="group" aria-label="Compare message delays"><button data-delay-preset="100" aria-pressed="false">News arrives quickly <span>100 ms</span></button><button data-delay-preset="500" aria-pressed="true">News arrives late <span>500 ms</span></button></div><div class="scene-tabs" role="group" aria-label="Views of this example"><button data-network-view="connections" aria-pressed="true">Block connections</button><button data-network-view="messages" aria-pressed="false">What miners see</button></div>
    <div class="network-scene" data-message-view hidden>
      <div class="miner-view"><span class="object-label">Miner 1</span><div class="miner-desk"><span class="desk-label">Blocks received or found</span><div class="known-blocks" data-miner-one>${state.firstKnows.map(b => `<span>${b}</span>`).join('')}</div><p data-miner-one-note>Found B at 100 ms.</p></div></div>
      <div class="message-space" role="img" aria-label="B is still on its way to miner 2" data-network-messages><div class="message-track"><span class="track-label">B →</span><div class="track"><i data-message-b>B</i></div></div><div class="message-track"><span class="track-label">← C</span><div class="track"><i data-message-c>C</i></div></div><p>Messages take time</p></div>
      <div class="miner-view"><span class="object-label">Miner 2</span><div class="miner-desk"><span class="desk-label">Blocks received or found</span><div class="known-blocks" data-miner-two>${state.secondKnows.map(b => `<span>${b}</span>`).join('')}</div><p data-miner-two-note>Found C without knowing B.</p></div></div>
    </div>
    ${introductory ? '<details class="timeline-disclosure"><summary>Inspect the timing</summary>' : ''}<div class="timeline-control"><label class="range-control"><span>Time in the example <strong data-network-time>400 ms</strong></span><input type="range" min="0" max="1200" step="1" value="400" data-time></label><div class="event-shortcuts"><button data-event-time="100">B found</button><button data-event-time="400">C found</button><button data-event-time="1200">Both delivered</button></div></div>${introductory ? '</details>' : ''}</div>
    ${introductory ? '<details class="network-advanced"><summary>Adjust the delay and inspect a block</summary>' : ''}<aside class="network-inspector"><label class="range-control"><span>Message delay <strong data-network-delay>500 ms</strong></span><input type="range" min="0" max="800" step="1" value="500" data-delay></label><label class="exact-control">Exact delay <span><input data-delay-number type="number" min="0" max="800" step="1" value="500"> ms</span></label><div class="decision-band"><span>At <span data-network-clock>400 ms</span></span><strong data-network-decision>C references A.</strong><p data-network-reason>B has not arrived. Both miners worked from the information they had.</p></div>${introductory ? '' : `<div class="experiment-controls"><button class="quiet-button" data-network-replay>Watch it happen</button><button class="quiet-button" data-network-reset>Reset</button></div>`}</aside>${introductory ? '</details>' : ''}</div>
    <p class="sr-only" data-network-announcement aria-live="polite"></p><figcaption>${note('An illustrative two-miner model. Discoveries stay fixed at 100 and 400 ms. The same delay applies both ways. Packet positions show elapsed delivery, not physical distance.')}</figcaption>
    ${detail('Model assumptions and event times', `<p>Delivery occurs before discovery at an exact tie. Real mining is random. D is a possible later block, not a timed discovery. This example calculates neither GHOSTDAG nor confirmation confidence.</p><div class="table-scroll" tabindex="0" role="region" aria-label="Network events"><table><thead><tr><th>Time</th><th>Event</th></tr></thead><tbody data-network-events>${state.events.map(e => `<tr><td>${e.time} ms</td><td>${e.event}</td></tr>`).join('')}</tbody></table></div>`)}
  </figure>`;
}

export function spend() {
  const state = spendState();
  return `<figure class="experiment spend" data-lab="spend"><div class="experiment-label"><span>One output, two spending attempts</span><span>Constructed example</span></div>
    <div class="spend-scene"><div class="unspent-object"><span class="object-label">Available output</span><strong>10 KAS</strong><span>Both attempts refer to this same output.</span></div><div class="split-connector" aria-hidden="true">↗<br>↘</div><div class="attempts">${['alice','bob'].map(name => `<div class="spend-attempt" data-attempt="${name}" data-valid="${state.accepted === name}"><span>Pay ${name === 'alice' ? 'Alice' : 'Bob'}</span><strong>10 KAS</strong><span class="outcome" data-spend-outcome="${name}">${state.accepted === name ? 'Accepted' : 'Already spent'}</span></div>`).join('')}</div></div>
    <div class="step-control" role="group" aria-label="Illustrative agreed order"><button data-first="alice" aria-pressed="true">Alice’s payment first</button><button data-first="bob" aria-pressed="false">Bob’s payment first</button></div>
    <figcaption class="experiment-answer" data-spend-answer aria-live="polite">Alice’s payment consumes the output. Bob’s attempt cannot spend it again. Keeping both blocks does not make both payments valid.</figcaption>
    ${note('The ordering is chosen here to expose the consequence. It is not a GHOSTDAG calculation. Fees are omitted from this conservation example.')}</figure>`;
}

export function mining() {
  const state = miningState();
  return `<figure class="experiment mining" data-lab="mining"><div class="experiment-label"><span>One minute of network-wide discoveries</span><span>Seeded illustration</span></div>
    <div class="mining-body"><div class="mining-field"><div class="mining-grid" role="img" aria-label="600 blocks, with this miner’s discoveries highlighted" data-mining-grid>${state.blocks.map(b=>`<i data-yours="${b.yours}"></i>`).join('')}</div>
    <div class="plot-key"><span><i></i>Other miners</span><span><i class="accent"></i>Your miner</span></div>
    </div><div class="mining-settings"><div class="number-pair"><div><span>Expected discoveries</span><strong data-mining-expected>${state.expected}</strong></div><div><span>In this sample</span><strong data-mining-found>${state.found}</strong></div></div>
    <div class="experiment-controls"><label class="range-control"><span>Your share of network work <strong data-mining-share>1%</strong></span><input type="range" min="0.1" max="10" step="0.1" value="1" data-share></label><button class="quiet-button" data-mining-sample>Another sample</button><button class="quiet-button" data-mining-reset>Reset</button></div>
    </div></div><figcaption class="experiment-answer" data-mining-answer aria-live="polite">The network can find blocks frequently while one miner wins only occasionally.</figcaption>
    ${note('600 prescribed opportunities at 10 per second. Each is an independent draw using your work share; discovery times, stale work, fees, and pool payouts are not modeled. This does not predict income.')}
    ${detail('Inspect the calculation', '<p>Expected discoveries = 600 × work share. Each sample uses a reproducible pseudorandom seed, beginning at 42. Changing the share keeps the same random draws; “Another sample” changes the seed.</p><p>Real block discovery times are random. This display fixes the number of opportunities to isolate differences in mining share.</p>')}
  </figure>`;
}

export function vault() {
  const s=vaultState();
  return `<figure class="experiment vault" data-lab="vault"><div class="experiment-label"><span>A withdrawal with three conditions</span><span>Constructed example</span></div>
    <div class="vault-scene"><div class="vault-balance"><span class="object-label">Locked output</span><strong data-vault-balance>10,000 KAS</strong><p>The remainder keeps the spending rule.</p></div><div class="vault-rules">${['Wait at least 60 example steps','Withdraw no more than 2,000 KAS','Use the authorized destination'].map((r,i)=>`<div data-check="${i}" data-pass="${s.checks[i]}"><span data-check-mark>${s.checks[i]?'✓':'×'}</span>${r}</div>`).join('')}</div></div>
    <label class="select-control"><span>Attempt a withdrawal</span><select data-vault-action><option value="early">Too early: step 30</option><option value="large">Too much: 3,000 KAS</option><option value="wrong">Wrong destination</option><option value="valid">All conditions satisfied</option></select></label>
    <figcaption class="experiment-answer" data-vault-answer aria-live="polite">Rejected. The signature alone cannot bypass the waiting rule.</figcaption>
    ${note('No wallet or real funds. Each attempt starts from the same 10,000 KAS. “Steps” are illustrative; this is not a deployable contract or a specified locktime encoding.')}</figure>`;
}

export function transaction() {
  return `<figure class="experiment transaction" data-lab="transaction"><div class="experiment-label"><span>Where the amount goes</span><span>Constructed example</span></div>
    <div class="transaction-equation"><div><span>Input</span><strong>12.5 KAS</strong></div><i aria-hidden="true">=</i><div class="transaction-outputs"><div><span>Payment</span><strong data-tx-payment>7 KAS</strong></div><div><span>Change</span><strong data-tx-change>5.499 KAS</strong></div><div><span>Fee</span><strong>0.001 KAS</strong></div></div></div>
    <div data-value-flow>${transactionFlow(transactionState(7))}</div><p class="flow-scale-note">Ribbon widths compare payment and change. The fee line is enlarged to remain visible.</p>
    <label class="range-control"><span>Payment amount <strong data-tx-amount>7 KAS</strong></span><input data-payment-amount type="range" min="0.1" max="12.5" step="0.1" value="7"></label>
    <figcaption class="experiment-answer" data-tx-answer aria-live="polite">Payment, change, and fee use the entire input. Change creates another spendable output for the sender.</figcaption>
    ${note('Amounts are calculated in whole sompi: 100,000,000 sompi = 1 KAS. This is not a signed transaction or a fee recommendation. Payment and change labels are authored for this example.')}</figure>`;
}

export function inspector() {
  if(process.env.KASPA_RELEASE==='v1')return `<div class="reading-rows"><article><h3>Open an explorer</h3><div><p>Paste a transaction ID into a public explorer. Check its acceptance status, inputs, and outputs. An address does not establish someone’s identity, and an output’s position does not tell you whether it is payment or change.</p><p><a href="https://explorer.kaspa.org/">Open the Kaspa explorer ↗</a></p></div></article></div>`;
  return `<section class="inspector" data-inspector><form data-lookup-form><label for="transaction-id">Inspect a mainnet transaction</label><div class="lookup-line"><input id="transaction-id" name="transaction" type="text" maxlength="64" pattern="[a-fA-F0-9]{64}" spellcheck="false" autocomplete="off" placeholder="Paste a transaction ID" required><button class="primary-button" type="submit">Look up</button></div><p class="small">Looking up sends the ID directly to api.kaspa.org. No wallet connection. Never enter a recovery phrase.</p></form><p data-lookup-message role="status"></p><div data-lookup-result></div></section>`;
}

// A short explanation advances through actions on the same visible object.
export function walletLesson(){
  const steps=[
    ['Receive','Share the address. Keep the keys.', 'Your receiving address is public. Your recovery phrase authorizes access to your wallet and must stay private.', '<div class="lesson-wallet"><span class="object-label">Illustrative wallet</span><div class="address-symbol" aria-hidden="true">↙</div><h3>Receive KAS</h3><p class="example-address">Your public address</p><div class="receipt-line"><span>Share with sender</span><strong>Address</strong></div><div class="receipt-line"><span>Keep private</span><strong>Recovery phrase</strong></div></div>'],
    ['Send','Review before you sign.', 'Check the destination, network, amount, and fee in your wallet. Try a small payment when using a new destination.', '<div class="lesson-wallet"><span class="object-label">Illustrative review</span><div class="address-symbol" aria-hidden="true">↗</div><h3>2 KAS</h3><p class="example-address">To your intended recipient</p><div class="receipt-line"><span>Network</span><strong>Check it</strong></div><div class="receipt-line"><span>Destination</span><strong>Compare it</strong></div><div class="receipt-line"><span>Fee</span><strong>Review it</strong></div></div>'],
    ['Verify','Follow the transaction ID.', 'Check the outputs and acceptance state in an explorer. A screenshot from the sender is not independent evidence. The recipient decides when to treat an accepted payment as settled.', '<div class="lesson-wallet"><span class="object-label">Illustrative explorer</span><div class="address-symbol" aria-hidden="true">✓</div><h3>Check the record</h3><p class="example-address">Transaction ID → network record</p><div class="receipt-line"><span>Outputs</span><strong>Amount + destination</strong></div><div class="receipt-line"><span>Acceptance</span><strong>Provider observation</strong></div><div class="receipt-line"><span>Settlement</span><strong>Your policy</strong></div></div>']
  ];
  return `<div class="lesson" data-lesson><nav class="lesson-steps" aria-label="Using a wallet">${steps.map(([name],i)=>`<button data-lesson-step="${i}" aria-pressed="${i===0}"><span>${i+1}</span>${name}</button>`).join('')}</nav>${steps.map(([name,title,body,object],i)=>`<div class="lesson-panel" data-lesson-panel="${i}"${i?' hidden':''}><div class="lesson-copy"><p class="eyebrow">${i+1} / 3 · ${name}</p><h3>${title}</h3><p>${body}</p><button class="primary-button" data-lesson-next="${(i+1)%3}">${i===2?'Start again':'Continue'} <span aria-hidden="true">→</span></button></div>${object}</div>`).join('')}<p class="lesson-note">A guided illustration. No wallet connection, keys, or real funds.</p></div>`;
}

export function tradeoffComparison(){
  const items=[
    ['Parallel blocks','Concurrent work can stay in the history.','More graph structure to receive, validate, and order.','<div class="comparison-blocks" aria-hidden="true"><i>A</i><span>↗ &nbsp; ↖</span><div><i>B</i><i>C</i></div></div>'],
    ['Frequent blocks','More opportunities to include a payment.','Propagation, transaction mass, fees, and miner behavior still affect inclusion.','<div class="comparison-pulses" aria-hidden="true">'+Array.from({length:10},()=>'<i></i>').join('')+'</div>'],
    ['Verification','A node can check the rules independently.','Hardware, storage, connectivity, and maintained software are still needed.','<div class="comparison-node" aria-hidden="true"><span>Blocks</span><strong>Node ✓</strong><span>Checked history</span></div>'],
    ['Proof of work','Participation is tied to computing work and physical costs.','Specialized hardware and pools can concentrate control.','<div class="comparison-work" aria-hidden="true"><i>Work</i><span>→</span><i>Blocks</i></div>']
  ];
  return `<div class="comparison" data-lesson><nav class="lesson-steps" aria-label="Compare design tradeoffs">${items.map(([name],i)=>`<button data-lesson-step="${i}" aria-pressed="${i===0}">${name}</button>`).join('')}</nav>${items.map(([name,benefit,cost,visual],i)=>`<div class="comparison-panel" data-lesson-panel="${i}"${i?' hidden':''}><div class="comparison-object">${visual}<span>${name}</span></div><div><p class="eyebrow">What this enables</p><h3>${benefit}</h3></div><div><p class="eyebrow">What it requires</p><p>${cost}</p>${i<items.length-1?`<button class="primary-button" data-lesson-next="${i+1}">Continue</button>`:'<p>You have compared all four tradeoffs. Use the tabs to revisit one.</p>'}</div></div>`).join('')}</div>`;
}

export function evidenceSteps(){return `<div class="evidence-steps"><article><span>01</span><h3>Read the document</h3><p>What rule is proposed or specified?</p></article><article><span>02</span><h3>Check implementation</h3><p>Which software enforces that rule?</p></article><article><span>03</span><h3>Verify activation</h3><p>Is the rule active on the network?</p></article></div><p class="source-line">A document, software release, and network activation are separate evidence.</p>`;}
