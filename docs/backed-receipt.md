# Backed tKAS receipts

This experimental Testnet-10 contract represents claims on coins already locked
in its outputs. One receipt unit equals one sompi. It is not a USD stablecoin,
bank reserve certificate, or off-chain promise. No external issuer is needed to
honor redemption: a holder spends the backing under the contract rules.

## What is enforced

Every receipt input and successor must carry exactly its declared quantity in
sompi. Receipt outputs also preserve the compiler-checked contract template,
series state, and covenant identity. A holder can transfer or split one receipt;
two independently authorized receipts of the same covenant can merge. Their
quantities and backing sum must remain unchanged.

Redemption accepts one holder input. A partial redemption keeps one successor
owned by the same holder and pays the difference directly to that holder's P2PK
address. Full redemption pays the complete principal and leaves no receipt
successor. There is no zero-balance placeholder or mint allowance to refill.

Fees come from exactly one ordinary sponsor input, followed by exactly one
positive sponsor change output. Neither transfers nor redemptions can skim
principal to pay fees. The sponsor signs the whole transaction separately. The
contract caps fees at its constructor policy (at most 3,000,000 sompi). The
application may enforce a tighter local cap.

A transaction may contain at most two receipt inputs and two successors.
Redemption has one input holder and at most one successor. All receipt inputs
and outputs come first; payout and sponsor change follow in their prescribed
positions. Quantities and group totals are positive and at most 1,000,000,000
sompi (10 tKAS). These bounds keep this teaching contract small and explicit.

## Genesis and identification

`buildBackedGenesis` creates one covenant output whose value is its declared
principal, with ordinary funding and change. A consumer must verify that genesis
outpoint, covenant ID, script template, series and backing. Anybody can create a
new similarly named series. A name alone is not authenticity or shared supply.
An incorrectly funded output may exist on-chain, but the contract refuses to
spend it as a valid receipt: its actual value must equal the encoded quantity.

The `seriesId` state is explicitly checked against the constructor series. An
adversarial test caught that a constructor label unused by the executable script
is optimized away; the implemented state check prevents that ambiguity.

## Builder interface

`server/backed-receipt.mjs` exports:

- `compileBackedReceipt({series, maxFee, state: {owner, quantity}})`
- `buildBackedGenesis(sdk, {fundingUtxos, receipt, fee, sponsorPublicKey})`
- `buildBackedMove(sdk, {receiptInputs, successors, operation, sponsorUtxo,
  sponsorPublicKey, fee})`
- `preflightBackedPlan(plan, {feeRate, requireReady})`
- `signBackedPlan(plan, signInput, {feeRate})`
- `generateBackedFixtures(destination?)`

`receiptInputs` are `{utxo, receipt}` pairs. `successors` are compiled receipt
objects. `operation` is `transfer` (including split/merge) or `redeem`.
`owner`, `series`, and `sponsorPublicKey` are 32-byte hexadecimal values.
`quantity` is an exact integer number of sompi. Fees are integer sompi too.
The signer callback receives `(transaction, inputIndex, signer)`; the signer
record identifies `owner` and `kind` (`receipt` or `native`). It must return a
65-byte SIGHASH_ALL signature or the SDK's push-encoded equivalent.

No function reads a private wallet, creates a network client, or broadcasts.
The caller supplies verified node UTXOs and collects each required signature.
Signing rejects changes to the reviewed transaction. Successful submission and
acceptance still need the workshop's journal and reconciliation code.

## Verification

Run `node server/backed-receipt.mjs --fixtures`. It creates disposable,
unfunded SDK transactions in `.cache/backed-receipt/transactions.json`.
The pinned SilverScript harness should copy `tests/backed_receipt_vm.rs` to
`silverscript-lang/tests/kaspa_explained_backed_receipt.rs` and set
`KE_BACKED_FIXTURES` to that generated JSON, plus `KE_CONTRACT_DIR` to this
repository's contracts directory. Run cargo with
`--test kaspa_explained_backed_receipt --locked`.

The 27 fixtures include six successful paths: genesis, transfer, split, merge,
partial redemption and full redemption. Twenty-one adversarial transactions
fail, including wrong holder/delegate/sponsor signatures, backing theft,
inflation, short payouts, changed ownership during redemption, series changes,
missing/wrong covenant bindings, foreign covenant inputs and insufficient
committed execution budget. Most malicious transactions are signed again with
valid keys, so those tests exercise contract rules, not merely stale signatures.

The Rust test independently checks SDK ABI bytes, executes every input, and
cross-checks exact compute, transient and storage mass against pinned consensus.
All six valid fixtures fit the pinned 500,000 compute / 500,000 storage /
1,000,000 transient block limits. Input budgets are 16; the most expensive
receipt fixture used 122,757 script units. All use a separately paid
1,000,000-sompi fee, above the fixture's calculated 100-sompi/gram relay floor.

Live fee estimates, pruning/history recovery, reorganization handling and
actual node admission remain separate checks. This is unaudited source and
unfunded VM evidence, not a completed funded testnet rollout.

## Public demonstration

Show principal locked, current holder, receipt quantity, locked sompi, sponsor
fee, and the resulting outputs side by side. A useful sequence is lock 1 tKAS,
split into 0.4 and 0.6 claims, transfer one claim, merge with both holders'
authorization, then redeem part or all. Include an attempted one-sompi skim and
its rejection. Keep the signer local and identify the disposable identities.
