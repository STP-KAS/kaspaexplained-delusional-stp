# Custom capped Testnet-10 token

This implementation is an experimental covenant token, not a KCC-0020-conforming
asset, audited financial product, dollar claim, or mainnet application. It has
exact unfunded SDK transaction/VM evidence. Funded node acceptance and public
wallet integration must be recorded separately.

## Issuance and identity

The minter state stores remaining **lifetime issuance allowance**. Genesis has
one minter, owned by the issuer, with quantity equal to the declared cap. Minting
moves units from that allowance into a holder cell. Transfers, splits, and merges
conserve holder units. A joint issuer-and-holder burn removes the holder cell and
leaves the allowance unchanged. The holder cannot independently burn under this
contract. Burn does not redeem tKAS, unlock a reserve, or create treasury rights.

The verified genesis covenant ID identifies a token instance. Matching issuer,
cap, branding, or redeem-script template alone does not prove the same lineage.
The application must retain and verify genesis evidence before displaying a cap
claim. A different genesis can create another token with identical terms.

KCC-0001, KCC-0002, and KCC-0020 were merged into the conventions repository on
2026-08-20 as Draft documents. KCC-0021 metadata remained an open proposal when
checked on 2026-09-06. Current KCC-0020 specifies ownership/borrow/extension fields
and transfer interfaces that this teaching contract does not implement.

Sources: [KCC registry](https://github.com/kaspanet/kccs),
[KCC-0020](https://github.com/kaspanet/kccs/blob/main/kcc-0020.md),
[KCC-0021](https://github.com/kaspanet/kccs/pull/6).

## Server integration

`server/token-lab.mjs` deliberately has no wallet loading, key persistence, RPC,
or broadcast behavior. The caller owns authorization, current Testnet-10 node
verification, UTXO selection, cumulative spending cap, recovery records, relay,
and accepted-transaction verification.

- `compileToken({issuer, cap, state})` compiles the exact pinned contract; issuer
  and owner are x-only public-key hex strings. State is
  `{owner, quantity, isMinter}`. Compiler arguments and outputs are public and
  temporary. The installed toolchain must have passed `setup:testnet`.
- `buildTokenGenesis(sdk, {fundingUtxos, token, cellAmount, fee, changeAddress})`
  creates exactly one genesis minter and optional native change. It populates
  covenant bindings through the SDK and reconstructs the ID independently.
- `buildTokenMove(sdk, {tokenInputs, successors, operation, fundingUtxos, payments,
  fee})` prepares mint (`1`), holder transfer/split/merge (`0`), or joint burn (`2`).
  A token input is `{utxo, token}`; a successor is `{token, amount}`. Native funding
  is optional and appended after token inputs. Payments are explicit native
  `{address, amount}` outputs. Values must balance exactly with the fee.
- `buildTokenExchange(sdk, {sellerToken, buyerFundingUtxos, buyerToken, price,
  sellerAddress, buyerChangeAddress, fee})` transfers a complete holder cell to the
  buyer and pays the seller in the **same transaction**. It preserves the native
  value in the token cell. Both parties sign SIGHASH_ALL over the reviewed
  transaction. This is a negotiated atomic exchange, not an unattended offer
  book, AMM, or separately deployed swap covenant.
- `preflightTokenPlan(sdk, plan, {feeRate, maxFee, requireReady})` fills only empty
  signature scripts with exact-length placeholders, computes consensus masses,
  sets the exact storage commitment, and checks fee and block limits. `feeRate`
  is sompi per normalized gram, at least the pinned relay floor of 100. Use a
  current node fee estimate and verify the node is Testnet-10 with Toccata active.
- `signTokenPlan(plan, signInput, {feeRate, maxFee})` reruns preflight, then calls
  `signInput(transaction, inputIndex, signer)` for each owner. The callback must
  return raw 65-byte SIGHASH_ALL hex or the SDK's `41`-prefixed encoding. It cannot
  change reviewed transaction fields. Return the signed transaction for the
  caller's review/broadcast flow. The fixture-only bypass is not a release path.

Keep RPC-returned SDK UTXO reference objects intact. The SDK exposes
`entry.covenantId`, but its plain-object UTXO parser expects `covenant_id`.
Flattening references can silently discard lineage. The builder rejects missing
or mixed IDs and mismatched input redeem scripts. It explicitly checks that the
SDK retained output bindings.

## Script and mass compatibility

SDK 2.0.1's default ScriptBuilder enforces a legacy 520-byte push limit. This
contract's redeem script is approximately 1.9 KB. `pushTokenData` implements
canonical direct/PUSHDATA1/PUSHDATA2 encoding, including small numeric pushes.
The JavaScript ABI encoding is checked byte-for-byte against SilverScript v1-rc1's
Rust encoder for every token fixture.

The pinned SDK's generic `calculateTransactionFee` prices overall mass and still
applies a 100,000 limit. `updateTransactionMass` writes overall mass into the
storage commitment. Those behaviors cannot be used blindly for covenant v1
transactions: the pinned node validates **exact contextual storage mass**,
relaxes that legacy cap after Toccata, and prices relay using the larger of
compute mass and normalized transient mass. `tokenConsensusMass` implements this
narrow native-v1/empty-payload case. Tests compare it with the pinned consensus
implementation, including UTXO plurality, rounding, and the storage commitment.
SDK disagreement is reported explicitly and never relabeled node rejection.

Source pin: rusty-kaspa `a41a333` as resolved by SilverScript
`c7d17a15ac88610d013ec9ffffa9520aeb69929b` (v1-rc1), SDK release 2.0.1:

- `consensus/core/src/mass/mod.rs`: serialized size, compute/transient/storage.
- `consensus/core/src/config/params.rs`: Testnet-10 coefficients and block limits.
- `consensus/src/processes/transaction_validator/tx_validation_in_utxo_context.rs`:
  exact storage commitment.
- `mining/src/mempool/check_transaction_standard.rs`: post-Toccata relay pricing.
- `wallet/core/src/wasm/tx/mass.rs`: generic SDK estimator limitations.

Default compute budget is 16 (169,999 allowed script units per input). The maximum
observed valid token leader used 122,151 units; the native funding signer used
100,001 and the token delegate 104,128. This is fixture evidence, not a universal
upper bound for unrelated contracts.

## Verification

Run `node scripts/token-fixtures.mjs --check-vm`. It uses the exact public
contract source and writes deterministic **unfunded** transactions under
`.cache/token-fixtures/`. Do not fund their public fixture keys or outpoints.
The isolated Rust test receives `KE_CONTRACT_DIR` and `KE_TOKEN_FIXTURES`.
It does not modify the shared `contracts_vm.rs` suite.

The eight successful transitions are genesis, mint, transfer, split, merge,
joint burn, atomic exchange, and allowance exhaustion. Nineteen adversarial
fixtures cover wrong holder/delegate/buyer signatures, insufficient budget,
output state and template substitution, absent/invalid bindings, signed price
changes, duplicate minters, inflation, restored allowance, unknown operations,
exhaustion, mixed lineages, excess fanout, and unauthorized holder destruction.
All successful fixtures balance value, meet pinned block limits and relay floor,
retain IDs through SDK Safe JSON, and use exact contextual storage commitments.
They are alternatives/branches, not a promise that all can be spent sequentially.

A small unfunded example uses 0.31 tKAS input to create a 0.30 minter, then two
0.145 token cells with 0.01 fees at each stage. This fits pinned post-Toccata block
limits despite the SDK's legacy cap. Live UTXO conditions and fee estimates still
need checking before an owner-funded run. Cumulative application spending counts
recycled funds again; do not infer the run's total budget from fees alone.
