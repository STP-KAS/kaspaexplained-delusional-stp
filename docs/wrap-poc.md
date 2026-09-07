# Wrapping PoC

The app has two separate experiments: a native backed tKAS receipt, and an external test asset carried between Ethereum Sepolia and Kaspa Testnet-10 by an explicitly trusted local oracle. The external asset is **Pixie Test USD (pUSD)**, a freely minted test token with six decimals. It is not USD, USDC, or a claim against real reserves.

## Run

Use the repository's existing Testnet SDK/template setup, then run:

```sh
npm run setup:wrap
npm run check:wrap
npm run serve:wrap
```

Open `http://127.0.0.1:8912/wrap?experiment=bridge`. The default source is Sepolia. `WRAP_EVM_NETWORK=local npm run serve:wrap` selects the separately journaled local Ethereum test chain. Mainnet is rejected by both adapters.

The signing server binds only to loopback, checks Host and Origin, and requires a per-process capability for actions. Do not expose it through a public tunnel. Its wallets and exact signed journals stay in `.local/wrap-poc/`, excluded from Git, with owner-only permissions. A static public build does not provide the oracle service.

## What the external experiment does

1. Prepare a mock token and oracle-controlled vault on the source chain. Set up an experimental Kaspa capped-token issuer using a separate tKAS state deposit.
2. Lock exactly 100 pUSD in the source vault. The event binds its unique deposit ID, source chain, vault, amount and Kaspa recipient.
3. The local oracle checks the canonical successful receipt, configured contract code, exact deposit fields and source-chain finalization before issuing 100 corresponding Kaspa units.
4. Transfer the entire Kaspa holding from You to Pip.
5. Pip and the issuer jointly burn the holding. Only after the matching Kaspa transaction has an accepting-block observation does the oracle release the original 100 pUSD to Pip's fixed source-chain test address.

Signed transactions are saved before broadcast. Source retries reuse the same signed bytes. Kaspa deposit IDs prevent a repeated observation from issuing twice. Pending or uncertain Kaspa transactions block later actions; checking does not silently resubmit them. The source vault independently prevents repeated release of a deposit or reuse of a burn ID.

The Kaspa covenant enforces its own token rules. It does **not** verify Ethereum consensus, a source deposit proof, or whether the oracle told the truth. The source vault similarly trusts the configured oracle about Kaspa burns. This PoC's local service holds the oracle and both demonstration users' keys. Those are visible trust assumptions, not independent users or noncustodial wallet connections.

## Native receipt comparison

The other tab locks 0.5 tKAS directly in a Kaspa covenant, transfers its fully backed receipt to Pip, and redeems it to Pip. Each unit is backed by one locked sompi; an ordinary sponsor input pays fees separately. It has no external reserve, bridge operator or price oracle. This route reuses the published backed-receipt contract and the existing encrypted browser-wallet journal.

## Verified boundaries

The source contracts, adapter and orchestration tests cover exact lock/release accounting, wrong oracle rejection, duplicate deposit/burn rejection, failed token transfers, source finality gating, matched burn acceptance, concurrent action exclusion, network guards and loopback access controls. Real-SDK synthetic tests cover the Kaspa mint/transfer/burn lifecycle and the browser-backed receipt lifecycle, including saved-before-send behavior and pending-state handling.

The real two-public-testnet round trip completed on 7 September 2026: 100 pUSD locked on Sepolia, 100 wTestUSD issued and transferred to Pip on Kaspa Testnet-10, the whole holding burned, and 100 pUSD released to Pip on Sepolia. The source vault and both Kaspa claim balances ended at zero. Exact transaction IDs, accepting blocks, receipts and final balances are saved in [the verification record](wrap-poc-roundtrip-verification.json). Test success is not a claim of production safety. The current external PoC supports one fixed 100-token round trip. The capped-token contract has a finite lifetime issuance allowance; burning does not replenish that allowance. Its token units are a custom experimental convention, not claimed conformance with KCC-20 or another wallet standard.

## From here to real capital

| Area | This PoC | Work still required |
| --- | --- | --- |
| Asset | Freely minted pUSD on a testnet | Choose the real source asset and define who can redeem it, where it is held, and what rights redemption gives. |
| Oracle | One local operator controls issuance and release | Specify the trust model, independent observations, signer security and failure handling. A threshold committee still has trust assumptions; a verified cross-chain proof is a different design. |
| Users | The service controls both test roles | Integrate independent source and Kaspa wallets, bind signed redemption intent to the exact amount and destination, and test multiple users without shared signing keys. |
| Supply | One fixed demonstration deposit | Production supply accounting, persistent indexing, asset/decimal/covenant registries, cap policy, replay handling and reconciliation across both chains. |
| Finality | Finalized source block; Kaspa node acceptance observation | A documented confirmation/reorganization policy, independent RPC checks, incident limits and recovery procedures. |
| Recovery | Exact local signed journals; pending actions stop the flow | Durable replicated storage, audited recovery/resubmission tools, key rotation, backups and operators who can resolve interrupted redemptions. |
| Assurance | Local adversarial tests and testnet evidence | Independent contract, cryptography, bridge and application review; fault-injection exercises; monitored pilots with explicit limits. |
| Operations and obligations | No real-value service | Custody and redemption arrangements, jurisdiction-specific legal review, accounting, reserve reporting and incident response appropriate to the chosen asset. |

A useful next milestone is the same complete round trip with two independently controlled test wallets, followed by a deliberately interrupted redemption that is safely recovered. Moving real money is a separate release decision after those missing controls are implemented and reviewed.

Primary references: [Kaspa covenant state](https://github.com/kaspanet/docs/blob/main/content/docs/toccata/covenant-state.mdx), [KIP-20 covenant identity](https://github.com/kaspanet/kips/blob/master/kip-0020.md), [Ethereum networks](https://ethereum.org/developers/docs/networks/), [Ethereum bridges](https://ethereum.org/bridges/), [WBTC custody model](https://wbtc.network/whitepaper), [Circle USDC terms](https://www.circle.com/legal/usdc-terms).
