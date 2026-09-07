# V2 release notes

Published September 6, 2026 at https://kaspaexplained.com from revision
`4695529`. Pages run `34044565585` succeeded at 16:21 UTC. All 24 application
transactions have dated accepted-chain evidence, including the two-recipient
payment. Publication does not certify production security.

V2 contains sixteen canonical pages: the fifteen educational documents from V1
and `/applications`, plus 87 compatibility routes. The public application lets visitors create a disposable
Testnet-10 wallet, send test coins, use escrow and threshold treasury rules,
resolve a prediction payout, verify a fixed proof, and operate capped tokens
and fully backed native receipts. It runs from static files with a browser SDK
and node RPC. The private workshop signer is not part of the public release.

Publish `dist/` from the reviewed source revision. Keep `dist-v1/` available as
the separately built educational release. Historical testnet, contracts and
split routes lead to the public applications page. The release packaging test
checks that local signing interfaces and API callers are absent. Source reuse
follows `LICENSE.md` and `THIRD_PARTY.md`; compiler, SDK and example proof
materials retain their stated notices.

## Builder entry points

[Public architecture](public-architecture.md) gives the file map, trust model,
exact caps, recovery format, build commands, and public VM checks. The six
contract sources live in `contracts/public/`. Start with the transaction
builders and signing adapters in `src/public-*.mjs` when reusing behavior;
the UI is one disposable-wallet demonstration of those APIs.

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

`setup:testnet` installs binaries; `check:contracts:vm` also clones and verifies
the pinned SilverScript Rust source required by public `--check-vm` commands.
Rust and native build tools must already be installed.

These commands generate templates, execute unfunded consensus fixtures,
validate recovery/signing, and build `dist/`. The browser gate requires a real
Testnet-10 connection and fails if it cannot create and restore an unfunded
wallet; it does not broadcast or establish funded transaction acceptance. For the complete educational checks also run `npm run check`,
`npm run check:copy`, `npm run check:posts`, and the documented browser review.

## Release checks

- [x] Public architecture documents all sixteen canonical pages and six templates.
- [x] Separate public signing adapters enforce transaction/body/signature integrity.
- [x] Restore rejects forged holding lineage and clears saved acceptance claims.
- [x] Accepted-history tests cover exact transaction IDs, spent outputs,
  pagination, reorganizations, missing checkpoints and node failures.
- [x] Nineteen public release/transaction/acceptance/recovery tests and signing checks pass.
- [x] A bounded scan of the 138-file static artifact found no suspicious secret
  filenames or embedded private-key/token literals. This is not exhaustive
  secret detection or a security audit.
- [x] Record all 24 public-browser transactions in accepted-chain history,
  including the full token and backed-receipt sequences.
- [x] Complete 144 unfunded browser states across Chromium, Firefox and WebKit,
  four widths and both themes, with actual RPC and encrypted recovery.
- [x] Record the added two-recipient native payment acceptance and exact outputs.
- [x] Complete final funded-state Chromium review: 80 states across five widths
  and both themes, plus keyboard/error/account-switch checks and visual corrections.
- [x] Run final combined release checks after the last code change.
- [x] Publish the reviewed source revision and static artifact.
- [x] Verify the custom domain, application SDK/WASM/templates, historical
  routes and public education pages after deployment.

## Live evidence

All 23 original public-browser transactions were found in accepted-chain history
in the September 6 scan completed at 15:43:28 UTC. This includes escrow funding
and refund, treasury funding and A/B spend, prediction funding and Yes settlement,
proof funding and verification, native payments, every backed-receipt lifecycle
operation, and token genesis through mint, move, split, merge, exchange and burn.
The proof exit fee was 0.181539 tKAS, below its distinct 0.2 tKAS cap.

[The public browser review](../design/PUBLIC-APPS-REVIEW.md) records full IDs,
fees and accepting blocks. The complete sequence used 0.315262 tKAS in fees;
native balances and the remaining issuer cell reconcile with fees to the
1.2 tKAS allocation. Receipts were fully redeemed, and token circulating supply
was zero with 900 units still unissued. After the accepted split, native balances are Main 0, Second 0.1340785 and
Third 0.0901665 tKAS; the issuer cell retains 0.660493 tKAS.

The reproducible unfunded browser gate passed 48 states per engine in Chromium,
Firefox and WebKit. It verifies SDK/WASM loading, three distinct zero-balance
accounts, missing-file and wrong-password errors, encrypted file and browser
recovery, keyboard interaction and no horizontal overflow at 320/390/768/1440
pixels in both themes. Safari initially exposed SDK resolver cross-origin errors;
the public entry point now connects directly to the verified Testnet-10 endpoint
and disconnects on page hide. Fresh runs passed all 144 states without hiding
errors. Node unavailability remains a visible failure rather than an offline pass.

The final 80 funded-state screenshots and interaction checks passed.
Post-deployment verification passed as recorded below. No installed external-wallet or physical-device
claim follows from the automated engine checks.

The two-recipient payment `c9b0b794c4c0cf99417d5a0460db2f33170291dd342bb667358d2f1898dc93a2`
was accepted in block `d7bc055e63148471510fe9f10d7b08208e59689159191c0ca6f05a73dedde331`.
Its two 0.0401665 tKAS outputs and 0.00306 tKAS fee were independently checked.
The earlier 0.01 + 0.01 proposal was rejected before signing by storage mass;
that earlier rejection is not the outcome of the successfully submitted split.

Pages run `34044565585`, job `101517207218`, successfully deployed revision
`4695529` at 16:21 UTC on September 6. Its corrected dependency sequence passed
all three public VM suites, 52 general tests, 19 public tests plus signing
checks, 144 unfunded browser states, nine browser journeys, and 160 render
states with zero findings.

The live artifact matched all 138 expected files by HTTP response and SHA-256
(`.cache/live-v2-verification.json`). Independent live Chromium and WebKit checks
passed 48 states each: SDK loading, account creation, encrypted file/local
restore, missing-file/wrong-password errors, four widths and both themes.
There were no page exceptions or private API calls, and those checks sent no
funds. Evidence is under `.cache/visual-review/public-live/`. The live application
screenshot was visually inspected; the mainnet lookup labels its provider data
accurately. These checks do not extend to physical devices or a security audit.

## Trust and limits

Only Testnet-10 is supported. Ordinary contract and payment fees are capped
at 0.01 tKAS, token/receipt fees at 0.03 tKAS, and the fixed proof example at
0.2 tKAS. Principal limits are 1 tKAS; native debit checks allow only the
actual calculated fee above the permitted principal after controlled change
is verified. Caps bound an individual plan, not the security of a wallet or
an application deployed by someone else.

The prediction oracle determines the reported outcome. The three sandbox
accounts share one browser operator and demonstrate signature rules rather
than independent governance. Tokens have a lifetime issuance cap; burning
does not restore issuance. Receipts redeem native tKAS backing and make no
USD or off-chain reserve promise. The fixed proof demonstrates verification,
not complete privacy. Node observation is current evidence, not finality.
External-wallet callback tests do not establish installed-provider behavior.
Physical-device testing and an independent security audit remain unverified.
