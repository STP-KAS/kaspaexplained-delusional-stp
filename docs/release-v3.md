# V3 verification

Deployed September 6, 2026 from revision `d1d69ec2ddab0eafffa427acdbb7df500f232041`
by [publication run 34052188335](https://github.com/parker2017code/kaspa-explained/actions/runs/34052188335).
All 143 public files matched local SHA-256 hashes. One historical-page HTTP
request timed out on the first pass and matched on its individual retry.
The earlier `50f6187` publication attempt stopped at the animation gate and
did not publish; the timing fix and deterministic regression test are included
in the deployed revision.

V3 replaces the illustrative block cards with detailed SVG ledger diagrams and
adds state-driven money and group-move drawings. Phone layouts use separate,
readable geometry. Payment, change and fee retain the original whole-sompi model;
only the very small fee line is enlarged for visibility.

Token creation now accepts a public name. The genesis transaction carries a
canonical UTF-8 JSON payload using the `kaspa-explained-token` application format.
Names contain 1–40 Unicode code points and at most 120 UTF-8 bytes. They are not
unique identifiers and do not declare compliance with KCC or another token
standard. The covenant ID and creation transaction ID identify the token and its
recorded name.

The spending ABI is unchanged. Payload bytes are included in mass and fee
calculation and committed by the native input signature. Encrypted recovery
reconstructs the exact signed transaction. Imported name metadata remains
unverified until a node freshly observes the exact genesis transaction in
accepted history; competing genesis records for one covenant ID are rejected.
Earlier unnamed tokens remain recoverable.

## Checked before publication

- 57 model, server, transaction and recovery tests passed.
- 29 token consensus fixtures matched independent Rust mass calculations: 9 valid and 20 rejected. Named genesis passed native Schnorr execution; changing the name payload after signing failed. Original unnamed coverage remains.
- 23 public-release tests and wallet/signature mutation checks passed.
- 168 unfunded application browser states passed across Chromium, Firefox and WebKit.
- 27 dedicated naming cases passed across the same three browser engines, including Unicode, length bounds, literal HTML-like text, legacy recovery and unverified imported names.
- 150 page/viewport/theme render states passed automated layout checks; representative desktop and phone drawings were visually inspected.
- 120 guided layout states passed, along with 432 local states in the final public-education verification script.
- A named token was created, minted and moved by the V3 browser on Testnet-10. All three transactions were accepted. A separate node block query returned the creation payload containing `Garden test token`. Encrypted backup and fresh-context restoration preserved the verified name and completed token flow.

The named genesis transaction is
`e9c2c81ed312a2d9c53febdf73905cba70eb74e20cdf5191943782e2236b0e7e`.
Full transaction and recovery evidence is recorded in
[the application review](../design/GUIDED-APPS-REVIEW.md).

## Phone performance

The sticky header is opaque, touch devices do not start automatic network
replay, explicit replay is throttled, and unchanged timeline rows are reused.
Playback advances in whole milliseconds so its range control cannot round to
the final value before playback actually stops. The publication gate exposed
that fractional-time race; an exact boundary regression test now covers it.
Chromium with 6× CPU slowdown measured guided handlers at 2.3–16.8 ms; WebKit
phone emulation measured 1–5 ms. No repeated idle rendering was observed.
One 70 ms initial home load task occurred in the throttled Chromium run.
These are bounded desktop-engine measurements, not measurements on the reported
six-year-old iPhone.

See [visual and performance evidence](../design/V3-VISUAL-REVIEW.md) and
[naming browser evidence](../design/V3-NAMING-UX-REVIEW.md).

## Publication checks

The publication workflow checks the pinned consensus VM, both release builds,
public applications, faucet policy, all three browser engines, copy, guided
journeys and rendered layouts before publishing. After deployment, all 143 public file hashes matched. A fresh visitor used the
public faucet and completed all six application scenarios, with 13 transactions
accepted automatically. The live education suite passed 432 states across three
browser engines. See [the live application record](release-v3-live.md),
[the public visual review](../design/V3-LIVE-VISUAL-REVIEW.md) and
[the real mainnet inspector check](../design/V3-INSPECTOR-REVIEW.md). Testnet acceptance is not a security audit or a finality guarantee.
