# Kaspa Explained · delusional STP

This repository is **STP-KAS** (Remco) working on Kaspa Explained locally: UX, a short PoW ethos line, and Kasware/Kastle holdings. It is the **project delusional** approach: honest labels, no fake inject, no Gramlane product.

Upstream education and Testnet apps remain [parker2017code/kaspa-explained](https://github.com/parker2017code/kaspa-explained). Public site: [kaspaexplained.com](https://kaspaexplained.com). Parker codes. STP does user experience.

This overlay adds:

- A short homepage ethos: proof of work for money you own, proof of stake left that idea, Kaspa goes back with fast programmable PoW. Not an attack on Bitcoin.
- In-page wallet connect for **Kasware** and **Kastle** only. Other wallets are listed, not injected.
- Structured holdings: KAS, KRC-20 tokens, KNS domains.
- Windows local preview via `start-ui.ps1` (Parker's `setup:testnet` is still macOS/Linux).

```powershell
cd kaspaexplained-delusional-stp
npm ci
.\start-ui.ps1
```

Then open [http://127.0.0.1:8899/](http://127.0.0.1:8899/) and [http://127.0.0.1:8899/wallet](http://127.0.0.1:8899/wallet).

---

# Kaspa Explained

[Kaspa Explained](https://kaspaexplained.com) is an independent guide to Kaspa with interactive explanations and experimental Testnet-10 applications. The public build includes 18 canonical pages and 87 compatibility routes.

## Sprout Harbor: a small KAS economy

[Enter the town](https://kaspaexplained.com/covenants). Buy greenhouse parts, pool three backers’ investment, pay Pip for a checked work schedule, sell the harvest, and carry the purchased food to the store.

Pip earns **0.1 tKAS** and spends **0.03 tKAS from that exact wage output** on three crop vouchers. The rest returns to Pip after the network fee. Sprout’s three accepted moves complete the delivery. The first order uses 21 Testnet transactions and one local rejected request; an additional order earns a fresh wage without rebuilding the greenhouse.

Signatures, spending limits, voucher ownership, payments, pledge conditions, the schedule check and movement rules are enforced on Testnet-10. Parts, greenhouse production, cargo and food delivery are game interpretations. The browser controls all demonstration accounts. These are unaudited experiments with free test coins, not mainnet applications.

A complete economic order and its reload were verified on Testnet-10 on 7 September 2026. Inspect the [accepted transaction record](docs/economy-live-verification.json), [browser checks](docs/economy-browser-verification.json), and [economic route and evidence boundaries](docs/economy-release.md). These are dated observations, not a security audit or unconditional finality.

## External assets and native receipts

[The bridge example](https://kaspaexplained.com/wrap?experiment=bridge) shows a recorded round trip: lock 100 pUSD on Ethereum Sepolia, issue its representation on Kaspa, transfer the claim to Pip, then burn it and release the source tokens to Pip. The [verification record](docs/wrap-poc-roundtrip-verification.json) includes the source receipts and four accepted Kaspa transactions, including initialization.

The public page displays dated demonstration balances and explorer links. It cannot sign or send bridge transactions. A trusted test oracle authorizes issuance and release; Kaspa does not independently verify Ethereum consensus here. **wTestUSD cannot buy the town’s crops.** See [bridge architecture](docs/wrap-poc.md).

[Wrap lab](https://kaspaexplained.com/wrap) also supports native test-KAS receipts: lock backing, transfer its claim and redeem it. Other experiments include payments, escrow, threshold treasury, prediction payouts, fixed-proof checks and capped tokens.

## Run locally

Use Node.js 22 or later:

```sh
npm ci
npm run setup:testnet
npm run build
node scripts/static-preview.mjs dist
```

Open [the local preview](http://127.0.0.1:8899/). SDK/compiler setup verifies pinned checksums. Contract VM checks additionally require Rust/native build tools, Git, `unzip` and `tar`; macOS and Linux arm64/x64 are supported by the setup workflow. Windows setup is unverified.

The public application is static. It creates disposable accounts, encrypts browser recovery and connects directly to Testnet-10. It needs no public signing server or compiler endpoint. The optional fixed-amount faucet is described in [faucet operations](docs/faucet.md).

For the standalone education build, use `npm run build:v1` and preview `dist-v1`. Maintained source is in `src/`; generated output belongs in `dist/` or `dist-v1/`.

## Verify changes

```sh
npm run check
npm run check:v4
npm run check:contracts:vm
npm run check:v4:vm
npm run check:economy
npx playwright install chromium firefox webkit
npm run check:v4:flows
node scripts/check-wrap-recorded-browser.mjs
npm run check:copy
npm run check:posts
```

The economy browser regression uses the real SDK with synthetic RPC; it is separate from the recorded live Testnet run. `npm run check:public:browser` checks public wallet loading and recovery across three browser engines using real RPC without funding accounts or submitting transactions. Node unavailability fails that gate. Run `bash scripts/check-site.sh` before publishing, following the [release checklist](RELEASE-CHECKLIST.md).

Contract sources are in `contracts/public/`; tests and verification tools in `tests/` and `scripts/`; social posts in `content/`. [Public architecture](docs/public-architecture.md) describes transaction construction, signing and recovery. Historical release reports remain in `docs/` and `design/` as dated evidence.

## Local services

`npm run serve` starts the separate local workshop at [127.0.0.1:8898](http://127.0.0.1:8898/). `npm run setup:wrap` and `npm run serve:wrap` prepare and run the local bridge experiment; see its [setup instructions](docs/wrap-poc.md). These services control local demonstration identities and are excluded from the public static build. Private state under ignored `.local/` must never be published. Uncertain submissions must be reconciled before another spend.

## Reuse

New project-controlled code is offered under **PolyForm Noncommercial 1.0.0**, and educational content under **CC BY-NC 4.0**. Commercial reuse is not granted under these new terms; see their permitted purposes and scope in [LICENSE.md](LICENSE.md).

Earlier MIT and CC BY 4.0 grants remain valid for previously released material. Third-party code, independent contributions and Moose’s books retain their own terms. Preserve the notices in [THIRD_PARTY.md](THIRD_PARTY.md).

Corrections should identify the exact claim or behavior and a supporting primary source.
