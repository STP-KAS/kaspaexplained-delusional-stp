# Covenant town economy release

Status on 7 September 2026: the new economic route passed desktop/mobile browser verification and a fresh 21-transaction execution on real Testnet-10, including accepted wage spending, delivery and same-wallet restoration. Public deployment is authorized and is being published.

## Purpose

The town accompanies the question, “What could a KAS economy look like?” Its first order connects a supplier, pooled investment, paid work, customer spending and delivery. Pip has a visible role as buyer, backer, worker and customer. Sprout carries purchased food to a destination. Each transaction advances this order or returns a finished agreement’s state deposit.

The business starts with three parts. Three backers fund its greenhouse. Pip earns 0.1 tKAS for a checked schedule, then spends 0.03 tKAS from that exact wage output on all three crop vouchers. The remaining 0.07 tKAS, less the purchase network fee, returns to Pip. Sprout takes three accepted adjacent steps to the food store. The game then records three food crates as delivered.

This demonstrates one small possible economic interaction. It is not evidence of commercial demand, autonomous agents, profitable agriculture or adoption.

## Exact first-order route

The guide contains 22 steps: 21 transactions requiring node-reported acceptance and one local rejection that signs and submits nothing.

| Steps | Agreement and economic effect |
| --- | --- |
| `shop` | Create three parts sale vouchers. Their state deposits are 0.25 tKAS each. |
| `budget` | Fund Pip’s restricted purse with 0.23 tKAS. Its named-supplier payment cap is 0.05 tKAS. |
| `overspend` | Try a 0.10 tKAS request. The app rejects it before signing; no transaction or network fee results. |
| `buy` | A composed transaction transfers all three parts vouchers to Pip and pays the supplier 0.05 tKAS from the restricted purse. There is no preliminary payment. |
| `parts-refund`, `recover` | Retire the parts vouchers and return their remaining deposits to Pip; separately recover the unused restricted purse to Main. The acquired parts persist only as local game inventory. |
| `factory` | Create three conditional project pledges with deposits of 0.25 tKAS each. This demonstration wallet funds and controls every role. |
| `approve-main`, `approve-pip`, `approve-third` | Each distinct pledge owner signs readiness. Approval does not release the pool. |
| `factory-pay` | Consume all three ready pledges together and pay their beneficiary, Main, less the network fee. The game uses the three parts and records the greenhouse as built. |
| `compute` | Fund the job state with 0.25 tKAS, including an exact 0.1 tKAS worker reward. |
| `compute-pay` | Check three distinct worker assignments with total cost at most six. Pay Pip exactly 0.1 tKAS. The game makes three food crates available. |
| `compute-refund` | Return the spare job-state deposit to Main. This is neither wage income nor food delivery. |
| `crop-shop` | Create three crop vouchers priced at 0.03 tKAS for the complete bundle. Main separately funds their three 0.25 tKAS state deposits. Their `worldId` identifies the accepted wage transaction. |
| `crop-buy` | Spend the exact accepted wage outpoint, with no fallback coin or top-up. Pay Main 0.03 tKAS, transfer all three vouchers to Pip, and return 0.07 tKAS less the exact fee to Pip. |
| `habitat` | Fund a fresh 0.1 tKAS movement-state deposit. Bind its `worldId` to the accepted crop purchase transaction. Start at `(1,1)` with three energy. |
| `move-1`, `move-2`, `move-3` | Follow `(1,1) → (2,1) → (2,2) → (1,2)`, spending one energy per accepted successor. Arrival records three local food crates delivered to the store. |
| `habitat-refund`, `crop-refund` | Close the delivery state and crop vouchers; return the remaining deposits to their designated owners. Refunds do not create wages, revenue or additional food. |

Network fees are variable. Deposits are temporary contract-state funding, not item prices; returned deposits must not be counted as business earnings. The 0.1 tKAS wage and 0.03 tKAS crop price replace an earlier 0.05/0.02 proposal that did not fit the intended split-output transaction’s storage-mass constraints.

A repeat order starts at `compute`, earns a new wage, creates and purchases a new crop bundle, starts a newly bound delivery, and closes its deposits. It requires eleven accepted transactions. It does not rebuild the greenhouse or replay the initial parts purchase.

## Evidence boundaries

**Node-enforced Testnet state:** signatures, the restricted purse’s recipient and cap, the atomic voucher/payment exchange, distinct pledge approvals and all-member release, the scheduling assignment and worker reward, and terrarium successor movement and energy rules.

**Browser-enforced workflow:** using the exact wage output, reserving a saved or uncertain spend, binding the crop lineage to that wage, binding the delivery session to the crop purchase, and presenting the steps in economic order. These relationships must be checked against validated recovered transaction plans; the pure game projection is not a substitute for protocol validation.

**Local game interpretation:** parts, greenhouse construction, food production, cargo and arrival-as-delivery. The node does not inspect a physical shipment, a greenhouse, employment or a person. Retired voucher deposits do not leave live on-chain ownership behind; retained physical inventory is a local rule.

Only freshly accepted records advance the economic projection. Duplicate receipts must not multiply inventory or income. Pending transactions must not award food. An older habitat journey or an unrelated successor chain must not deliver a newly bought order. Restoring a wallet clears cached acceptance until fresh observation.

## Saved-wallet migration

Keep the legacy route available for saved wallets. Recover the signed journal and reobserve acceptance before choosing its route or continuing. Do not reinterpret an older 0.05 tKAS job reward as the new 0.1 tKAS wage, silently repeat a payment, or count the legacy habitat walk as this order’s delivery.

After a completed legacy tour, explicitly continue with a fresh economic order at `compute`. Its new accepted 0.1 tKAS wage funds the new 0.03 tKAS purchase. Persist route mode and starting journal offset so reloads select the same order. Pending or uncertain spends stay reserved and must be resolved before any new spend. The old history remains inspectable.

## External asset example

`/wrap?experiment=bridge` displays the recorded Ethereum Sepolia → Kaspa Testnet-10 → Sepolia round trip when opened publicly. The published record is `docs/wrap-poc-roundtrip-verification.json`, copied by the build to `/assets/wrap-poc-roundtrip.json`.

That example was verified at 2026-09-07 10:39:33 UTC: all four Kaspa transactions have accepting blocks, the source release succeeded, Pip held 100 pUSD, the source vault held zero, and no wrapped claims remained. The UI labels these as recorded balances of demonstration accounts, not current balances or the visitor’s wallets. Public viewing has no signing action or local signer API connection. The working loopback service retains its interactive route.

The source vault and release depend on a trusted test oracle. Kaspa does not independently validate Ethereum consensus in this experiment. These test tokens have no cash-redemption promise. The bridge illustrates external asset representation entering and leaving Kaspa; **wTestUSD is not integrated as a town spending asset and cannot buy the town’s crops**.

## Release gates

- Protocol and VM checks must verify the current wage/price, exact wage-only purchase, payment/ownership outputs, recovery and reservation of uncertain spends.
- Model and story checks must cover acceptance-only awards, deduplication, new delivery lineage, ordered lifecycle, repeat-order expectations and executable price consistency.
- Replay the entire new guide from a fresh state in a browser, including invalid schedule feedback, pending/retry behavior, the final food-store delivery and deposit refunds. Check desktop and mobile, keyboard access, activity evidence, visible Pip, reloads and saved-wallet migration.
- Execute a fresh complete economic order on real Testnet-10. Save the accepted transaction IDs and accepting blocks, exact wage input, price and change outputs, connected three-move chain, final local delivery and refunds. Completed; exact evidence is recorded in `economy-live-verification.json`.
- Verify the public recorded bridge on desktop and mobile, with the evidence JSON present, working explorer links, no mutation actions and no attempt to reach the local signer service. Also retain native wrap and loopback bridge regression checks.
- Run the repository’s required build, relevant checks and `bash scripts/check-site.sh`. Resolve material failures and stale copy before publishing. After deployment, verify the public economy flow and recorded bridge again, and state precisely which tests used synthetic RPC versus real nodes.

The release status must distinguish implementation, local checks, real Testnet acceptance and public deployment. Passing one is not proof of the others.

## Real Testnet verification

The new economy completed its full 21-transaction route on Testnet-10 on 7 September 2026. All 21 transactions have accepting-block observations. The crop purchase consumes output 1 of Pip’s accepted 0.1 tKAS wage transaction, pays 0.03 tKAS to the greenhouse account, and returns change after the network fee. The purchase-bound delivery reached its destination, recording three delivered game food crates. The same encrypted wallet restored with 21 records and no extra submissions. Exact evidence is in [economy-live-verification.json](economy-live-verification.json).

The changed-app deployment reuses the SHA-256-pinned, previously published contract templates and refuses any change to their source/compiler setup. It builds and checks the shipped app/link graph instead of recompiling and retesting unchanged contracts.

## Production browser verification, 7 September 2026

Checks ran against `https://kaspaexplained.com`, loading its published HTML, scripts and styles. All 180 page/viewport/theme render states passed automated layout checks; selected desktop and mobile screenshots were also inspected. Chromium, Firefox and WebKit passed 56 application states each using real Testnet-10 RPC, with no funding or submissions.

The existing real economy wallet restored on the public site with all 21 accepted receipts, the same address and three delivered game food crates. Signing and submission were blocked during this read-only verification. Separate live-served browser runs replaced only RPC with synthetic responses to exercise the complete 21-step order and 11-step repeat at 1440 and 390 pixels, including pending-state withholding, exact wage spending, the four recorded bridge cards, activity inspection and reload without replay. Native wrapping also passed both sizes with synthetic RPC. These lifecycle runs do not claim new live-chain transactions.
