# Testnet application examples

These are local, custodial Testnet-10 teaching applications. No public signer,
real-world oracle validation, fiat peg, privacy guarantee, or production audit.
All amounts are sompi. Default deposits are 20,000,000 sompi (0.2 tKAS).

## Implemented contracts

- **ApplicationEscrow:** buyer releases to seller; arbiter chooses buyer or seller;
  buyer can refund after node-derived timeout. Parties trust the arbiter's choice.
  A timely release and timeout refund may race; the first accepted spend wins.
- **SharedTreasury:** any of the three distinct member pairs authorizes a full
  withdrawal to a reviewed public key. SIGHASH_ALL commits the outputs. The local
  lab owns all three identities, so this demonstrates the contract threshold,
  not independent human custody or a distributed signature collection service.
- **PredictionEscrow:** oracle selects yes/no winner after resolution time; after
  refund time either participant can authorize an equal refund to both participants.
  A late oracle settlement can race that refund. The contract does not verify
  the truth of an event, collect two independently funded stakes, or implement
  an order book. The local deposit is one pooled teaching fixture.
- **ReserveReceipt:** holder redeems the entire principal. A separate amount in
  the same UTXO pays the fee; unused fee reserve returns to depositor. This is a
  nontransferable single-use claim on tKAS, not a fungible token or stablecoin.
- **ProofPayout:** owner supplies the published SDK's valid Groth16 fixture.
  Verification key and all five public inputs are fixed in the locking script.
  This checks an existing proof, not a newly generated private computation.

Every spend constrains input/output counts, deposit value, recipients and fees.
The ordinary policy caps fees at 1,000,000 sompi. Proof verification currently
needs a higher relay fee and is intentionally blocked by that policy. Do not
fund it until a separately reviewed bounded policy can complete the exit.

## Integration

`createApplication(lab, kind, options)` and
`reviewApplication(lab, requestId, entry, parameters)` must run inside
`lab.exclusive()`. Neither broadcasts. Creation records a request compatible
with the existing funding review. Review returns the existing pending-submit
protocol and a one-minute token, with all expected outputs shown.

Kinds: `escrow`, `treasury`, `prediction`, `receipt`, `proof`.
Creation options: `amount` (integer sompi, default 20,000,000) and `delayMs`
(default 120,000). Timings are based on the connected node's median time.

Spend options:

- escrow: `release`, `resolve` with `{paySeller: boolean}`, or `refund`.
- treasury: `spend` with `{pair: 0|1|2, recipientPublicKey?: xOnlyHex}`;
  pair 0 is A+B, 1 is A+C, 2 is B+C. Default recipient is A.
- prediction: `settle` with `{yesWins: boolean}`, or `refund` with `{refundBy: 'yes'|'no'}` (default yes).
- receipt: `redeem`.
- proof: `verify` (currently fee-blocked).

Private role keys remain only under each record's `key` property. Every public
projection must continue stripping that property. `roleAddresses` are public;
funding receipt lookup must use the contract address, not these role addresses.

## Verification and limits

Run `node scripts/application-fixtures.mjs` before the VM harness. It creates
12 unfunded transactions using disposable identities and synthetic UTXOs, never
opens the workshop wallet, and never connects to a node. The Rust suite then
executes those exact SDK signature scripts against the pinned VM.

`tests/applications_vm.rs` also covers wrong roles, repeated member signatures,
changed approved outputs, incorrect payout destinations, fee excess, reduced
principal, timeout boundaries, final input sequence, and corrupted ZK proof.
Ordinary fixture input budget is 40; proof budget is 1800. These are explicit
version-1 budgets, not unlimited VM allowances.

The runtime fee estimate is a conservative size bound plus committed compute
mass, using the node's current rate with a 100-sompi/gram floor. Storage mass is
computed separately: post-Toccata relay fee does not multiply storage mass by
that rate. Actual node standardness, storage caps, acceptance and receipt history
still require testnet verification. A tiny fee-reserve change output may fail
storage-mass policy; check this before funding the receipt application.

Source dependencies: SilverScript v1-rc1, Rusty Kaspa
`a41a333b08848f41bf737b72592e463a6011b8ac` in the VM harness, SDK v2.0.1.
The public Groth16 fixture is extracted without executing its devnet script or
using its embedded example key. Existing upstream notices apply.
