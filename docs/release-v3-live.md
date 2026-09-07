# V3 deployed live verification — September 6, 2026

**Passed:** all six applications on [the public site](https://kaspaexplained.com/applications), from a fresh disposable wallet and the actual faucet button, produced 13 accepted Testnet-10 transactions. This run used deployed source `d1d69ec2ddab0eafffa427acdbb7df500f232041`, following the owner's 143-file HTTP byte-match verification.

## Fresh visitor and faucet

The public **Create test wallet → Get 10 test coins** flow generated address `kaspatest:qpt2drmcgp24nmmejczfpz7k76rkkprnukzauzceu79tv04akuqygkytqkh0y`. Request `8ed1440f-9ab9-4d1f-9417-8165d60430d1` returned funding transaction `ec1ff95c4a3f931b3c900801eeffbc0adeaa9950d3572986fc866c2677a54dbd`. The browser automatically verified its exact output 0 for **10 tKAS** before the first application action.

No direct refill, existing wallet funds, manual Check, or Refresh action was used. Default application buttons signed, saved, submitted, and automatically observed each transaction. No browser runtime errors or unrequested downloads occurred.

## Completed scenarios

- Escrow: lock, blocked early refund, buyer release.
- Shared treasury: lock, blocked single signature, two-signature withdrawal.
- Prediction: lock, blocked participant settlement, oracle settlement.
- Proof payout: lock, blocked missing proof, valid proof payout.
- Token: create **Live garden token**, mint 100 units, block inflation from 100 to 101, transfer the 100 units.
- Backed receipt: lock 0.5 tKAS, block claim reduction without returning backing, fully redeem the receipt.

All six invalid examples were rejected locally before signing. This does not claim invalid transactions were broadcast or rejected by the node.

## Public token name and recovery

An independent read-only audit retrieved the token creation transaction directly from public block `196257802ee54f35e6ade0ebd413ca3f04776610492840990ee634975ab284e1`. Its payload decoded to:

```json
{"protocol":"kaspa-explained-token","version":1,"name":"Live garden token"}
```

This is metadata in the actual public transaction, not merely a browser nickname. It is an experimental custom covenant token; this verification does not establish KCC standard compatibility.

Reloading the original tab restored the same session automatically without resubmission. The token retained its name and completed status; the receipt remained fully redeemed. An actual optional encrypted backup was then downloaded and restored in a fresh browser context on the public site. All six completion markers, the name after genesis reobservation, and the holdings survived. No runtime errors occurred during these checks. Private wallet material and encrypted recovery files remain local QA artifacts and are not published.

## Independent accepted-chain evidence

A separate read-only audit against node version **2.0.1** at `wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh` completed at **2026-09-06T18:57:50.630Z**, finding all 13 transaction IDs in accepted-chain history. These are current node observations, not a finality guarantee or a security audit.

| Scenario / action | Transaction ID | Fee (tKAS) | Accepting block |
| --- | --- | ---: | --- |
| escrow / fund | `e31e815c6dd3aef894cb629b4aa40ce46a1af0813a478dfc97dac766d5470b93` | 0.002659 | `f1b05535c53af011f3b90c9739e44ca4d9bb5bfbf6adc5e7d7534fd7184530f2` |
| escrow / release | `8aaa7afce9202f9228077f1cee269aabc9cd2d5b0ebe94463de2aa25804ece9b` | 0.002810 | `7f36158e28a0479f235f88e7608a44d78305c6871c5796989ec2bd48f38007b2` |
| treasury / fund | `9ccd9bebb2b2dc990f65653ee37e389505c1af9b2b4feb7ff445867f3f16c47c` | 0.002659 | `ed287390d5f443f960006b5d179d9fc9f18857a5f1f72a60ee973a79c9b87dab` |
| treasury / spend | `040f8a4cb41acbd0983464b8bfeab93c3f8b9016efde49fee583cd72dab44fbd` | 0.003462 | `7fd9efa4798a6e1a51e5ca9c4ab901cbfbeeb5b7edd924d492abb45edcd78aca` |
| prediction / fund | `aeca21393755d3ebeae6c0dbe94e833edd6dc8b3fd92c54abaf7949d3de82d1d` | 0.004379 | `5dcbe412dc8b264d2e8a9df9f65315d32bf95c862a359a16aea4f7cb99213e75` |
| prediction / settle | `24c1056e9c24301d661daa4019dd10808b84f0f747681a9d0247aaef1ff16595` | 0.003527 | `d6638d96c396d1350c8200ded2696f0860f64c382c23172d76c1340f62d635bb` |
| proof / fund | `ea7d07f5447b60b7efac78d32636e7f45aa52b94f8c134148eadd75d279000ff` | 0.004379 | `88fe431469d5580eaae1c32e4a8b6add1da53600bc39962b47f15e7a11b92dae` |
| proof / verify | `50590cc0787fa5adee9cad6150a5a011345527056627e62fff3a233173bc014d` | 0.181539 | `b61c8f503222351f7c6dc027083243904c0c758f2b8bb3c530add7aba9675219` |
| token / create | `8b638f40f686704a0a1491d0b9b4b9d39283e6c19194877ccc5fe52d47736b7b` | 0.004488 | `ff38c882854001b5facdc25cf3dee294fe94869d704521f4c0b6d7a2d158e4da` |
| token / mint | `84bfc276967de26d76ebe12ef7fef68c393782bd6d4c56ac43db3fdc392680ba` | 0.005816 | `569b19923656de55e87e947f861f8ac2995ed31722e90e8008e880c84ec7ff4f` |
| token / move | `f3973671e79960c2c38f70fd1b11bf0cedbc1a17b7e725b9192f859340d2078e` | 0.005480 | `0723f58ef7b1cc492526684f86bcce9934743cefb59823aebd37d6c2a6c5b216` |
| receipt / create | `36d9e278a1e9b07135587082851c31ade0bac58b23edd347708774f008c45b9a` | 0.002693 | `d881badd6c28cbecc3a641e51c37e8b08414a980da2eed7d5ec23a5572391d92` |
| receipt / redeem-full | `44c89e47b70584fe2aee14a52849b78e6cc9e611ec3024d42a2d36a0e0a56c3b` | 0.006683 | `6c98eb79f5a44734fdc041ca9b4a7d4dca3e0efb8c9c236650c129615047a6e8` |

Application fees total **0.230574 tKAS**. Final native balances were Main **9.083532**, Second **0.197190**, and Third **0 tKAS**. Token contracts retain **0.488704 tKAS**: 900 unissued units in the issuer cell and 100 units held by the third account. The backed receipt has no remaining claim. Native balances + token contract value + fees equal exactly **10 tKAS**.

## Local evidence artifacts

- `.cache/v3-online-transaction-evidence.json`: public transaction construction metadata and fees.
- `.cache/v3-independent-public-audit.json`: independent node observations and retrieved name payload.
- `.cache/v3-online-browser-evidence.json`: actual backup and fresh-context restoration assertions.
- `.cache/v3-online-token-complete.png`, `.cache/v3-online-receipt-complete.png`, `.cache/v3-online-token-reloaded.png`, `.cache/v3-online-restored-phone.png`: browser results. The restored phone image was visually inspected.

This live run covers the six guided application paths. Other expert actions and physical older-iPhone performance were not newly tested by this run; their separate evidence and limits remain in the release review.
