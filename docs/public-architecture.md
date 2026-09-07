# Public Testnet-10 applications

The public site combines Sprout Harbor’s economic guide, the native receipt lab and other Testnet applications. The current economic route is documented in [the economy release notes](economy-release.md); accepted transaction evidence is in [the live record](economy-live-verification.json). The external bridge page publishes [recorded test evidence](wrap-poc-roundtrip-verification.json) and has no public signing service.

Historical V2/V3 rollout counts and revisions remain in [V2 notes](release-v2.md), [V3 notes](release-v3.md) and [the earlier guided review](../design/GUIDED-APPS-REVIEW.md). Those reports are dated snapshots.

The deployed app needs static artifacts and the pinned browser SDK. It does not
need the workshop signer, its files, or a public native compiler endpoint.

The shared application layer below predates the town. Its contracts remain used by the town service desks. `node scripts/build-public-templates.mjs --check-vm` compiles
`contracts/public/*.sil` at build time and writes
`.cache/public-templates/templates.json`. The object is
`{version:1, network:'testnet-10', templates:{escrow,treasury,prediction,proof,token,receipt}}`.
Run the static build to package that JSON, the public browser modules, and the
checked SDK 2.0.1 `web/kaspa/kaspa.js`, `kaspa_bg.wasm`, and license. Publish
only `dist/`; never publish `.local/`, compiler caches, or the workshop server.

Per-instance keys, principal, fee limits, and deadlines live in runtime state.
`instantiatePublicContract(sdk, template, state)` patches only the compiler's
`state_span`, using canonical fixed-width state serialization. It never searches
and replaces byte sequences in the program. Build verification uses different
keys and dates, comparing patched bytecode with a fresh compiler result. Proof
verifying key and public inputs remain the published fixture in the template.

State fields:

- Escrow: buyer, seller, arbiter, refundAfter, principal, maxFee.
- Treasury: memberA, memberB, memberC, principal, maxFee.
- Prediction: yesOwner, noOwner, oracle, resolveAfter, refundAfter, principal,
  maxFee. Either holder may authorize the fixed refund split after its deadline.
- Proof: owner, principal, maxFee.

Keys are x-only public-key hex. Deadlines are integer millisecond timestamps from
the node's median time. Amounts are sompi. Ordinary examples use 20,000,000
principal and 1,000,000 maxFee; proof uses 50,000,000 principal and 20,000,000
maxFee. The proof costs substantially more than a signature-only spend.

The browser initializes the SDK, connects RPC, checks `getBlockDagInfo().network`
is `testnet-10`, and preserves SDK UTXO reference objects. It must check active
Toccata rules and current fee estimates before preparing a transaction.

1. Instantiate the selected contract and run `preflightPublicContract` at the
   current fee rate. Every supported exit must fit before funds are locked.
2. `buildPublicFunding` constructs the exact contract deposit and controlled
   wallet change. Show the output, debit, and fee before signing.
3. `signPublicPlan` accepts a caller-owned signing callback. Disposable testnet
   keys may remain in browser memory for a clearly labeled sandbox. This module
   creates no key vault, backup, or persistent private-key storage.
4. Alternatively use `kaspirePublicSigningRequest`, call the selected provider
   only on a user action, then `acceptKaspirePublicSignature`. Treasury signatures
   can be collected separately. Kaspire's returned transaction is compared with
   the reviewed body and expected contract arguments before acceptance.
5. Revalidate with `validatePublicPlan` immediately before submission. Broadcast
   the signed transaction, then verify acceptance and exact outputs. Submission
   or a transaction ID alone is not acceptance.
6. Spend only the exact matching funded UTXO using `buildPublicSpend`. Query node
   median time for timeout actions; a browser clock is not sufficient.

Final signed validation enforces principal at most 1 tKAS; ordinary fee at most
0.01 tKAS; proof fee at most 0.2 tKAS. Large faucet UTXOs work because debit
excludes verified change to the same controlled wallet. Unknown recipients,
extra outputs, changed fee, changed metadata during signing, or modification of
an earlier signature are rejected.

The portable mass calculation follows pinned post-Toccata consensus: exact
contextual storage commitment, compute/transient block limits, and relay pricing.
It does not use the SDK's legacy 100k cap or set overall mass as storage mass.
See `docs/token-design.md` for the source references and SDK discrepancy.

`tests/public_templates_vm.rs` executes the exact browser-built transactions in
pinned SilverScript v1-rc1 / kaspa-txscript. The suite verifies 22 transactions,
including all four funding paths, every spending route, wrong signatures,
premature refund, and invalid Groth16 proof. It also compares canonical state
patches, ABI bytes, mass dimensions, fee and storage commitments. The build script
checks partial Kaspire request/response assembly and malicious callback changes.
These are unfunded fixtures; installed-wallet behavior and node acceptance need
separate release evidence.

The resolver in prediction is trusted to report the result. Refund eligibility
opens a competing spending path; it does not make the oracle path expire.
Multiple sandbox keys demonstrate signature thresholds, not independent people.
The published Groth16 fixture proves verification, not complete transaction
privacy. None of these applications is audited or intended for mainnet.

## Public tokens and fully backed receipts

The public templates also include `token` and `receipt`. Their browser modules
are `src/public-token.mjs`, `src/public-receipt.mjs`, and
`src/public-asset-signing.mjs`; all are dependency-free browser modules apart
from each other and the caller-supplied SDK. No module opens a wallet, compiler,
filesystem or RPC connection. Policy fields are fixed-width runtime state so
an arbitrary browser participant can instantiate a contract from the published
artifact. Every consumed and successor state must preserve token issuer/cap or
receipt series/maxFee. This is enforced in the public SilverScript sources.

`instantiatePublicToken(sdk, templates.token, {issuer, cap, state})` accepts a
32-byte issuer key, integer cap up to 1,000,000,000, and
`{owner, quantity, isMinter}`. It returns the complete state plus script,
address, artifact and ABI. `buildTokenGenesis`, `buildTokenMove` and
`buildTokenExchange` retain the backend builder's option names. Genesis makes
one issuer-owned minter whose quantity equals the lifetime cap. Operations are
0 transfer/split/merge, 1 mint, and 2 issuer-and-holder-authorized burn. Burn
never restores issuance allowance. Exchange transfers one complete holder cell
and the specified native price atomically, requiring seller and buyer
SIGHASH_ALL signatures over the same transaction.

`instantiatePublicReceipt(sdk, templates.receipt, {series, maxFee, state})`
accepts a 32-byte series, fee cap at most 3,000,000 sompi (default), and
`{owner, quantity}`. Quantity is sompi backing, at most 1 tKAS in the public
adapter. `buildBackedGenesis` and `buildBackedMove` retain the backend option
names. The sponsor signs one ordinary P2PK input; its positive change pays the
fee. Transfer/split/merge conserve backing exactly. Partial redemption pays
the removed quantity to the current holder, and full redemption removes the
receipt and returns its full principal. This is a native tKAS claim, not a USD
stablecoin or off-chain reserve promise.

Omit `fee` to calculate the pinned relay estimate at the supplied `feeRate`
(default 100 sompi/gram). Genesis and exchange use controlled ordinary change;
receipt operations always charge the sponsor change. For a token move with
omitted fee, successor amounts are **before fee** and must sum to total inputs
minus explicit payments. The final successor pays the calculated fee; select
another with `feeSuccessorIndex`. For explicit `fee`, amounts are final and
must already balance. This supports exact reconstruction from a saved review.
The browser rejects mass overflow, insufficient fee, aggregate covenant
principal over 1 tKAS, and native debit over 1 tKAS plus fee after verifying
controlled change. The asset fee ceiling is 0.03 tKAS, not the fee target.
Ordinary four-app and payment limits remain 0.01 tKAS; proof remains 0.2 tKAS.

For example, token genesis can lock 0.5 tKAS. Mint can allocate half to the
remaining minter and half (minus calculated fee) to the holder. Transfers use
the complete input cell before fee; splits need sufficiently large successor
cells to meet storage mass. The unfunded suite uses 0.3 tKAS genesis and adds
0.2 tKAS to the holder cell when splitting. A backed receipt can lock 0.5 tKAS,
split into 0.2 and 0.3 claims, and use a separate sponsor UTXO for fees.

`signPublicAssetPlan(plan, callback)` requests `(transaction, index, signer)`;
`signer.owner` identifies the required x-only public key. The complete reviewed
transaction, metadata and every signature script are protected against
mutation between signing steps and during final validation. Native and
covenant signatures must be 65-byte SIGHASH_ALL. `kaspirePublicAssetSigningRequest`
and `acceptKaspirePublicAssetSignature` support ordered ABI arguments and
multi-party signing, with `submitTransaction: false` and full transaction,
argument and prior-signature checks. `validatePublicAssetPlan` reports whether
all required signatures have been accepted. Provider responses alone are not
node admission evidence.

`buildPublicPayment(sdk, {fundingUtxos, owner, recipient, amount, feeRate})`
constructs ordinary P2PK payments between selected public keys. It shares the
asset signer API, limits the payment to 1 tKAS and the calculated fee to 0.01
 tKAS, and verifies that funding and change belong to the selected account.

Run `node scripts/public-token-fixtures.mjs --check-vm` and
`node scripts/public-receipt-fixtures.mjs --check-vm` after building templates.
They execute 27 token and 28 receipt transactions built by the actual browser
modules, cross-check their columnar state ABI against fresh Rust compiler
output, and independently check all consensus mass dimensions. All 14 valid
paths use the exact calculated fee. The 41 adversarial cases include altered
policy, inflation, backing theft, wrong signatures, mixed covenant identities,
missing bindings, redirected redemption, exhausted issuance and insufficient
execution budget. `node scripts/check-public-asset-signing.mjs` additionally
checks native payments, local/Kaspire signing and mutation rejection without
network or private wallet access.


## Reproduce the public build

Use Node.js 22 or later, npm, Git, `unzip`, and `tar` on supported macOS or
Linux arm64/x64. The VM checks also require Rust and native build tools.
From the repository root:

```sh
npm ci
npm run setup:testnet
npm run check:contracts:vm
node scripts/build-public-templates.mjs --check-vm
node scripts/public-token-fixtures.mjs --check-vm
node scripts/public-receipt-fixtures.mjs --check-vm
npm run check:public
npx playwright install chromium firefox webkit
npm run check:public:browser
```

Setup verifies downloaded SDK/compiler checksums. It installs binaries only;
`check:contracts:vm` first clones and verifies the pinned SilverScript source
required by the public VM commands. The VM harness pins
SilverScript revision `c7d17a15ac88610d013ec9ffffa9520aeb69929b` and uses
Cargo's locked dependency resolution. The public-template command creates
all six templates and checks the original four applications. The following
two commands check transactions constructed by the actual token and receipt
browser adapters. `check:public` builds the static output and checks release
packaging, accepted-history observation, recovery, restored holdings, and
signing mutation rejection. These commands neither create a funded wallet
nor broadcast. `npm run check:contracts:vm` additionally exercises the separate
workshop contract, native-payment, token, and receipt harnesses.

For a static preview, serve `dist/` with a static HTTP server that resolves
extensionless paths to their `.html` files. The public application requires
HTTPS or localhost for browser cryptography, WASM support, and a reachable
Testnet-10 WebSocket RPC endpoint. No local signing server is required.

## Source map

| Files | Responsibility |
| --- | --- |
| `src/page-registry.mjs`, `scripts/build.mjs` | Sixteen canonical V2 documents, shared search/sitemap, static packaging and compatibility routes. |
| `src/public-apps-page.mjs`, `src/public-apps.css` | Public application markup and styling. |
| `src/public-apps.mjs` | Disposable three-account wallet, encrypted recovery, RPC checks, original contract review and activity. |
| `src/public-assets-ui.mjs` | Payment, token and receipt flows; holdings reconciliation and restored-state validation. |
| `src/public-contracts.mjs` | Original four templates, state serialization, transactions, mass, signing and final validation. |
| `src/public-token.mjs`, `src/public-receipt.mjs` | Covenant state and transaction construction for tokens and backed receipts. |
| `src/public-asset-signing.mjs` | Shared asset/payment signing, Kaspire response validation and debit limits. |
| `src/public-recovery.mjs`, `src/public-asset-recovery.mjs` | Reconstruct the exact signed transaction from its journal; reject altered inputs, outputs, fees and metadata. |
| `src/public-transaction.mjs` | Shared public transaction construction and validation. |
| `src/public-acceptance.mjs` | Bounded accepted-chain scans, pagination and reorganization revocation. |
| `contracts/public/*.sil` | Six public contract sources. |
| `scripts/build-public-templates.mjs`, `scripts/public-*-fixtures.mjs`, `tests/public*_vm.rs` | Compiler/state equivalence and consensus VM fixtures. |

The sixteen documents are index, what-is-kaspa, why-kaspa-matters,
skeptical-case, kaspa-mining, build-on-kaspa, status, kaspa-origin-story,
kips, moose, sources, playground, 404, money, applications, and search.
The build also emits 87 compatibility redirects; these are not canonical pages.

## Recovery and observation boundaries

The public UI generates three disposable Testnet-10 keys. It encrypts the keys
and session with AES-256-GCM, a fresh salt and IV, and PBKDF2-SHA256 with
250,000 iterations. A fresh session automatically stores its random recovery
secret and encrypted envelope in the tab's sessionStorage. Reload can restore
that tab; closing or clearing it can lose access. Both materials are available
to same-origin scripts, so this is not protection against XSS or compromised
page code. Unlocked signing keys also remain in memory.

An optional file export uses a user-selected password of at least 12
characters. Export is not a prerequisite for the guided flow. Existing manual
recovery imports remain supported; the operator cannot reconstruct a lost
visitor password or recovery file.

Each guided action displays its purpose, principal and fee cap. By default,
that action builds, validates, signs, persists and submits one transaction.
Optional manual review exposes the exact transaction before submission. The
signed transaction and checkpoint are saved before any broadcast; failed
persistence blocks submission. Uncertain transactions block conflicting new
actions. Recovery reproduces the identical signed bytes, not a replacement
spend. Restored holdings are checked against exact signed journal outputs,
and saved acceptance must be observed again at the node.

The six guided scenarios cover escrow, a shared treasury, prediction, proof
payout, a capped token and a fully backed receipt. Invalid examples are
identified as local checks before signing; they do not claim a node rejected a
transaction that was never sent. Token and receipt examples use the actual
builder's conservation checks. Busy navigation queues the selected scenario
until the running action finishes, preserving the transaction's original
scenario and journal. Advanced payment and asset actions remain available.

The optional funding step calls a separate service with only the public
recipient address and request ID. It requests a fixed 10 tKAS payout; it does
not send the visitor's keys or an arbitrary transaction to a signer. The
faucet's dedicated key, spending bounds, retry behavior and deployment evidence
are described in [faucet.md](faucet.md).

A returned transaction ID proves only the node's submission response. The UI
separately checks exact unspent outputs and accepted-chain history. History
allows observation after outputs have already been spent. Removed accepting
blocks revoke prior acceptance during a reorganization scan. Neither result
promises finality, honest RPC service, or agreement across independent nodes.
Current asset spends re-fetch exact outpoint, amount, script version, script,
and covenant identity before constructing the next operation.

Use [the V2 release checklist](release-v2.md) and
[public browser evidence](../design/PUBLIC-APPS-REVIEW.md) for live coverage.
Adapter tests for an external signer do not establish installed-wallet support.


The public entry point `src/public-apps.mjs` connects directly to
`wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh`. This avoids SDK resolver
cross-origin probe errors observed in WebKit. Page hide disconnects the active
RPC client; failed connection remains visible and users can retry the create or
restore action. Application transactions use direct RPC without a local API
or hidden offline fallback. The separate faucet is an explicit external funding
service, not a proxy for application signing.
`scripts/check-public-browser.mjs` accepts `chromium`, `firefox`, or `webkit`
(default Chromium); each engine saves its own evidence under
`.cache/visual-review/public-browser/`. Its disposable recovery envelope is
kept in memory, and closing each context discards keys and encrypted storage.
