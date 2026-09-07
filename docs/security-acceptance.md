# Wallet and release acceptance

## Verified offline

The local wallet saves and fsyncs the signed transaction, spending reservation, and attempt before calling the node. A failed save after a successful submission leaves the earlier uncertain record recoverable after restart. A real persistence error blocks the operation queue. Reviewed recovery resends identical signed bytes and retains the original budget reservation. Duplicate approval requests serialize and send once; another process cannot acquire an active wallet's lock.

Receipt scans revoke an accepting block removed by a chain reorganization and persist `acceptance-changed`. The original spending reservation remains. This is one node's current view, not final settlement. Scans have bounded pages and retain their cursor.

Public status responses exclude wallet keys, participant keys, and signed recovery journals. Recovery review intentionally exposes the signed transaction for review, but no private keys. The local server binds loopback, validates the Host and Origin, rejects cross-site requests, and requires a random capability for wallet operations. These controls do not protect against malicious software already running as the same local user or a compromised site script.

Reproduce these checks with:

```
node --test tests/submission-journal.test.mjs tests/wallet-load.test.mjs tests/acceptance.test.mjs tests/local-server.test.mjs tests/setup-integrity.test.mjs
node scripts/check-contract-vm.mjs
```

The combined VM command includes ordinary contracts, application contracts, transferable tokens, and backed receipts. Tests use deterministic unfunded fixtures. They do not authorize or perform live transactions.

## Dependency reproduction

`node scripts/setup-testnet.mjs` installs SDK v2.0.1 and SilverScript v1-rc1 only after matching pinned SHA-256 archive digests. It checks archive paths before extraction and stages the SDK before replacement. A corrupt cached release is rejected before extraction and leaves an existing installation unchanged. A verified macOS arm64 reinstall completed on 2026-09-06; other platform pins are present but installation on those platforms has not been exercised here.

The SDK archive digest is `7eaffac9cd920ef2fdf540c6e10f2a2b7761170ebc62ec57dfa0f71c64567a71`; the macOS arm64 compiler archive digest is `021bbef65cf4198190a61f9022f4289f68f1fb18f349fbfe38601b2f63e6c42a`. All platform compiler digests are in the setup script. The VM harness requires SilverScript commit `c7d17a15ac88610d013ec9ffffa9520aeb69929b`, rejects tracked upstream edits, and uses Cargo's locked dependency resolution.

`THIRD_PARTY.md` retains the SDK ISC notice, SilverScript ISC notice, and upstream CashScript MIT acknowledgements. Both license copyright lines were checked against installed upstream files. Public distributions that bundle the SDK must retain its complete license notice. A checksum verifies consistency with the pin; it does not independently establish the publisher's identity.

## Remaining acceptance gates

Browser wallet work must prove encrypted backup export/import restores every role and the exact contract, blocks funding until recovery is established, and never stores plaintext keys. Test wrong passwords, modified ciphertext, invalid networks, incompatible templates, oversized input files, and corrupt keys. Before public broadcasting, preserve the reviewed signed transaction and prove response loss or page closure cannot cause an unreviewed second payment. Verify signing callbacks cannot alter reviewed destinations, amounts, covenant arguments, or another participant's signature.

Live testnet acceptance remains separate: funded contract creation and each lifecycle action must produce transaction IDs and accepted-block evidence, with external-wallet signing tested in the actual wallet. No live funding or broadcasting was performed by this audit. Publication readiness also requires the final browser journeys and deployed dependency files to be checked.

## Native payment and browser recovery additions

The local payment review now uses `server/native-payment.mjs`, a native-v1 builder, instead of the SDK's legacy Generator mass gate. It retains the original per-payment, per-fee and cumulative budget checks and the existing prebroadcast journal. It requires owned P2PK inputs, one exact destination output and positive change to the same owner. The synthetic 0.3 tKAS case has compute mass 2638, storage mass 33333 and a 264800-sompi fee. Seven exact signed native fixtures were checked against the pinned Rust VM and consensus mass calculator, including changed outputs/destination, wrong signer and insufficient compute budget. The combined VM harness passes 12 Rust tests.

`src/public-recovery.mjs` reconstructs only the supported exact signed action; the transaction's identity, unsigned fields, unlock arguments, fee and controlled change must match the public builder. Imported output summaries and observed flags are not used as transaction authority. It recognizes each of the three controlled funding roles and permits large source balances only when change remains owned. Three recovery tests cover funding and exits across the original four public applications plus mutation rejection. The combined targeted wallet/server/setup/native/recovery test command passes 23 tests. New token and backed-receipt browser adapters require their own recovery coverage.
