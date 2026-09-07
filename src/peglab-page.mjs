export const peglabPage = {
  file: 'peglab.html',
  title: 'PegLab',
  description: 'A Testnet-10 teaching covenant that looks like a dollar and then fails in public. Not USD. Tiny pool. Will depeg.',
  body: `
<link rel="stylesheet" href="/assets/peglab.css">
<div class="peglab" data-peglab>
  <p class="peglab-banner">TESTNET TOY. NOT USD. NOT AN ISSUER. WILL DEPEG.</p>
  <div class="page-intro">
    <p class="eyebrow">PegLab · Kaspa Testnet-10</p>
    <h1>A dollar-shaped object with a 2 tKAS pool.</h1>
    <p class="lead">tPEG is a covenant claim on locked test KAS, priced by one admin key. Mint at the oracle, move the oracle, sell through a pool too small to defend a peg. It is not money.</p>
  </div>
  <p class="peglab-rung"><span>Code</span><span>Audit-lite</span><span>Tiny pool</span><span>Will depeg</span><span>No mainnet</span></p>
  <div class="peglab-board">
    <section class="peglab-card">
      <h2>Live state</h2>
      <div class="peglab-metrics" data-peglab-metrics></div>
      <div class="peglab-holders" data-peglab-holders></div>
      <div class="peglab-controls">
        <button class="primary-button" data-peglab-mint type="button">Mint 100 tPEG</button>
        <button class="quiet-button" data-peglab-swap type="button">Swap 0.2 tKAS through pool</button>
        <button class="quiet-button" data-peglab-redeem type="button">Redeem 40 tPEG</button>
        <button class="quiet-button" data-peglab-oracle type="button">Post oracle +25%</button>
        <button class="quiet-button" data-peglab-stale type="button">Expire oracle</button>
        <button class="quiet-button" data-peglab-pause type="button">Pause</button>
        <button class="quiet-button" data-peglab-reset type="button">Reset genesis</button>
      </div>
    </section>
    <section class="peglab-card">
      <h2>Wallet prompt</h2>
      <pre class="peglab-prompt" data-peglab-prompt></pre>
    </section>
  </div>
  <section class="peglab-card">
    <h2>Depeg lab</h2>
    <p>Five scripted steps. The last one is the product: target, pool, and redeem disagree, and a 2 tKAS pool cannot pull them together.</p>
    <div class="peglab-controls"><button class="primary-button" data-peglab-demo type="button">Run depeg lab</button></div>
    <div class="peglab-steps" data-peglab-steps></div>
  </section>
  <details class="detail">
    <summary>What this is, and what it is not</summary>
    <div class="detail-body">
      <p>This page runs the PegLab economic engine in your browser. It is the STP Testnet-10 toy from <a href="https://github.com/STP-KAS/peglab-stp">STP-KAS/peglab-stp</a>. Anybody can compile a similarly named series. A name is not authenticity. Verify genesis outpoint, template hash, series bytes, and backing.</p>
      <p>Redeem is tKAS at an admin price, not dollars. Pause blocks new risk; it does not create a peg. No mainnet. Do not put real funds in this.</p>
      <p>Dedicated Testnet-10 wallet: <code>kaspatest:qzpvdakagvwfm95g8pv9ndpupjtndgjfhmve08cg3tv5wgfytjzf7cudwwzv0</code>. The seed is not on this site.</p>
    </div>
  </details>
</div>
<script type="module" src="/assets/peglab-ui.mjs"></script>`,
};
