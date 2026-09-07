# Public Testnet-10 application review

September 6, 2026. This report is separate from the V1 education-site review. Public browser assets connect directly to Testnet-10; they do not expose the local server wallet or signer.

## Verified browser path

The browser loaded the pinned SDK/WASM, created three disposable role keys in memory, connected to a synchronized indexed Testnet-10 node, and prepared an escrow instance. A downloaded password-encrypted recovery file was saved. A fresh tab decrypted the saved recovery and recreated the same wallet address and exact contract script/address.

The initial 0.3 tKAS allocation was sent by the owner using the separately journaled local wallet. Public browser review then showed the exact contract destination, principal, fee, and change before signing. The signed transaction was encrypted, saved locally and downloaded before a separate submission action. An initial missing output observation remained pending; an explicit subsequent check resolved it.

| Public UI action | Transaction | Fee (tKAS) | Observed result |
| --- | --- | ---: | --- |
| Escrow funding, 0.2 tKAS | `eb374901fc3376c67b0e6b3798d49445ab280d9790ee1d9e6c70576a2b44ef1d` | 0.002659 | Exact output IDs, indices, amounts and scripts |
| Escrow timed refund | `ab8429c4db77c9275ab459a66acc26c224b3dff88df4f32d54cfe988de3b06f6` | 0.002810 | 0.19719 tKAS returned; wallet 0.294531 tKAS |
| Treasury funding, 0.2 tKAS | `2f6f8b13080a3de381cb7e445df96809bcfad2f801b2423b897eaecc78d6e156` | 0.006099 | Exact outputs and accepted-chain history |
| Treasury A+B withdrawal | `5db84ecc9dcc5ab2be16e81ddb7bb494414d6910f3297734c6784b258d5a5646` | 0.003462 | 0.196538 tKAS returned; accepted-chain history |

After the first escrow cycle, a bounded additional 0.9 tKAS allocation was independently sent and verified by the owner. Subsequent fees use that existing allocation; no automatic refill exists in the browser application.

## Current safeguards checked in code and fixtures

- Testnet-10, synchronization, UTXO indexing and current priority fee estimates are checked before reviews/submission. Each exact transaction has a principal and fee ceiling. Native payments and ordinary applications cap fees at 0.01 tKAS; token/receipt actions at 0.03; proof verification at 0.2. The principal cap is 1 tKAS.
- Recovery uses PBKDF2-SHA256 and AES-GCM with random salt/IV. Plaintext private keys stay in memory. Persistent browser data and downloaded recovery files are encrypted.
- Signed journals are durable before broadcast. Failed persistence/download retries reuse the same journal; uncertain broadcasts block replacement spending. Recovery reconstructs the exact signed bytes through installed templates and validates destination, input identity, amount, signatures, fee and mass.
- Restored holdings must correspond to validated signed-journal outputs. Script version and covenant ID join transaction ID, output index, script and amount in UTXO checks.
- Accepted-chain scanning starts from a recorded node checkpoint and tracks removal of an observed accepting block. UTXO observations and accepted-chain observations remain separate; neither is represented as finality.
- Selecting a different application or account invalidates outstanding reviews. Pending transactions block new actions across ordinary contracts and asset applications.

Fixture/recovery checks passed for token genesis, mint, transfer, split, merge, joint burn and exchange; backed receipt creation, transfer, split, merge and partial/full redemption; and native account payments. The live journeys below provide separate network evidence; these checks are not a production security audit.

## Design application

The major-wallet and application references are recorded in `PRODUCT-RESEARCH.md`. Their product patterns informed a first-class Restore path, named setup stages, one reviewed next action, receive/faucet/backup/account controls, visible account balances, tangible role or holding panels, selectable holdings, and durable transaction cards. The token and backed-receipt surfaces distinguish token quantity from contract test-coin value and backing. The prediction example identifies its oracle, and all three example accounts are explicitly controlled by the same tab.

Live treasury/prediction/proof and asset lifecycle verification are complete. Final responsive snapshots and combined checks are recorded separately below. Physical-device, assistive-technology, and production security claims remain outside this evidence.

## Initial, creation and restore states — 2026-09-06

The public V2 static build passed the full render runner: 16 pages at 320, 390,
768, 1024 and 1440 pixels, in light and dark themes (160 states). It reported no
page errors, horizontal overflow or undersized measured controls. The build and
money pages received direct application-link edits during that run; those two
pages were checked again at all five widths and both themes (20 states), with
no old local-workshop links or horizontal overflow.

A separate Chromium review used fresh browser contexts and newly generated,
**unfunded** disposable wallets. It exercised the initial page, missing-file
restore error, created wallet with zero balance, wrong-password error, and
successful restoration of the locally saved encrypted recovery. Each state was
captured at 320, 390, 768 and 1440 pixels in both themes: 40 states, no page
errors or horizontal overflow. Screenshots of the narrow created-wallet state
and wide wrong-password state were visually inspected; no CSS correction was
needed. The wrong-password case displays the existing generic safe error.

Evidence: `.cache/visual-review/dist/report.json`, the corresponding static-page
screenshots, and `.cache/visual-review/public-initial/report.json` with 40 state
screenshots. No existing funded QA wallet was accessed, no funds were requested,
and no transaction was submitted. This review establishes the initial and
recovery UI behavior only; it does not replace the separate funded lifecycle,
wallet-provider, physical-device or security evidence. Later holdings-display
refinements were outside this initial-state review.

## Complete public-browser transaction evidence

All 24 transactions below were reviewed, signed, saved in password-encrypted recovery, and then submitted through the public browser interface. Each subsequently appeared in the node's accepted-chain history. The final read-only scan completed at 2026-09-06T15:52:21.843Z using `wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh`. It began from the independently verified accepting block of the owner's initial wallet allocation (`878c4e58aa0e95e0a74167bc7073508b0b2e2ec9e567251bad7c1896dd66d391`); this retrospective audit checkpoint is separate from checkpoints recorded during browser submission. The scan stopped after finding all 24 targets in 20 pages, with no missing IDs. This is node-specific acceptance evidence, not a finality claim.

Total application transaction fees: **0.315262 tKAS**, paid from the existing **1.2 tKAS** allocation. Final native balances were Main **0**, Second **0.1340785**, Third **0.0901665 tKAS**. The token issuer holding retains **0.660493 tKAS**, **900 unissued units**, and zero circulating units after the burn. Receipts are fully redeemed. Native balances plus the issuer value and fees reconcile to 1.2 tKAS. No further funds were requested.

| Application / action | Transaction ID | Fee (tKAS) | Accepting block |
| --- | --- | ---: | --- |
| escrow / fund | `eb374901fc3376c67b0e6b3798d49445ab280d9790ee1d9e6c70576a2b44ef1d` | 0.002659 | `d6a192a106ebf585001676048010ee61db077f5e6582c3a96f7e4acf3692abda` |
| escrow / refund | `ab8429c4db77c9275ab459a66acc26c224b3dff88df4f32d54cfe988de3b06f6` | 0.002810 | `fccdfba7fac996c7f94cd2f6e52b5d64d33f2cbf9f41a84a549e03b92a5f4ec8` |
| treasury / fund | `2f6f8b13080a3de381cb7e445df96809bcfad2f801b2423b897eaecc78d6e156` | 0.006099 | `998e0382a43d7c8fd913d4bcaf61525f25a4d101c6a89e2bd94f807e015990d8` |
| treasury / spend | `5db84ecc9dcc5ab2be16e81ddb7bb494414d6910f3297734c6784b258d5a5646` | 0.003462 | `b2198df0f5b014a0fdd77b421158669bd220e5d2cdf14fa106f10ce6f41869b0` |
| prediction / fund | `df1e048b316cc5fd13e1bfad244289f16a92452fc419d54a4b87d48457c9227c` | 0.004379 | `3e497a9c5b847f24235728a510368854f0f922f4f50b1f136da4e0cb2c9fe4cf` |
| prediction / settle | `daa0e471638bef9bd170875ea725567c32d948ac1825f523d94fb7ae1f326869` | 0.003527 | `ada4543476680d2d219ab4406158d78a23bba41f889c1d52a04ceb66a814bc28` |
| proof / fund | `39fb3bb4b61f756e56a435b53ff7ea566445839169c920562d4a92c7dc254883` | 0.004379 | `ea3e1d18d6ee1e8fa11817e92f6e79a32be6342021b7e0310e4b81eec85207f7` |
| proof / verify | `46a3f9401c64778a2ba6d080c023391e5181df810518cc063cb9b8a7012fa161` | 0.181539 | `e45e3d547df1f82f93ca24b4d0ca9d6d912fdc8891571dca0917146369cf2c25` |
| payment / send | `6a8f14e6e5dc6582a54fc30bb7fa4b575835e60fa3c994672e27808fc367e02c` | 0.004368 | `d01b5e6a46b68f28154c0448ea08baa3e53a7b697b15d834997db59be80e6123` |
| receipt / create | `9e6f73970704fee4e6374ca4b6a320c2f626ea820f15556beca9274201f14750` | 0.002693 | `d4e7a85b4664268a29ab8d2510e0a2f65c8459f2c45ec56f17d525b2b7ce07e9` |
| receipt / split | `711cb57137a8ef9dfe8fac9ae4f8df4a01f5e491b5850b6a474b8f3829fa9862` | 0.007409 | `f4fd4e46bfa7c23f983af9166a03371e51ceac2d9da631ec32a724f2cba8b843` |
| receipt / merge | `9d884f44868d0ef044f2294b8127b158ee5dbd98b89d2f6255e253b97dca2ca7` | 0.010836 | `1f9abb45c9c7fbb39e2bbc8926364e4936870abf1e5bf50c0027cfe26c27aa15` |
| receipt / move | `41fe310957bb2f75e7df562f55d5b4cbba2326853a43d69d24583155e4619670` | 0.006840 | `bb88605416f9d41b1a2c3c7e699f0082ce8102c5eaf7155199066c026338ec25` |
| receipt / redeem-half | `4f73b413ab63602462cb99051990a83a748bd2f6b32055d9b8526d25688dbd39` | 0.007252 | `582acc1c60ca96b4420eb52f7f0ed630daab1edb8d4d6e9df00588c7e379afa6` |
| receipt / redeem-full | `c474525df24a718d1e4ecebc3ec081cb8d7cf5c95614c12d3273f554da3247bd` | 0.006683 | `fd9284d10259a98f3f5e727ef8a6d84fa44e46c5e00ea0aec5982d0ed9aa92bf` |
| payment / send | `3b63fe83638d784aaa7672a8fb9007b36a68d0e21d4db420d07f0466a26b516f` | 0.006088 | `9f5b4bb12ba9ce1d4a9c0dc0c6326b9321381320c0146126f7c50f70b38aae34` |
| token / create | `9546607a87270f38b3555e5e4a4acbac275513c4acaee286083b7d3acd78b5ab` | 0.004413 | `b75f308a04b6ce78e66f0af6c09789b1f565c5e88d4666ebfbd67420fb35461e` |
| token / mint | `611f1996a1cf3841af0830c7d2417e894441ec056b25976a95a4961bfd947974` | 0.005816 | `dfb31218eb392fee86110978e9e1eafbe7c956bdf03224369e2a95caaa8a56fc` |
| token / move | `1d6b08152aa5c694628afecec5887666e4e78e78a19ae2ae361f6e2025ff2f59` | 0.005480 | `e3d3b95b49fa9eddda6f79486da8c21b7dd2b61bfac85968314147cda57f2110` |
| token / split | `b65dd556c2fc7fbff49a540b5a6aaa08f24a766b94f6971ed5790f400d7f856f` | 0.007385 | `4355989d98a9c3d1a71f489db0b3f015f54e098d1fb4fedf3f89ec726959d8fd` |
| token / merge | `282d18fc3b97f13cec0ace4b5ec5041242550dfa23634b49294c34935b067c30` | 0.010414 | `3c4712f2e05c9b970c2e0397f44e945b392dfaa387809391eb83f443b9b2ed0d` |
| token / exchange | `60f7a065f20543dc24756c9d7f777a1aee6fe43a4a99c321d25cedf03e703bee` | 0.007259 | `9a5815d4afe7272341ab54da81fb73a1c44cc12a280c576534418edbd6201062` |
| token / burn | `480e4543bf787955d7fd1748d287e024ecfa50db1ab9d8b3031b41295e11764f` | 0.010412 | `ec7dc2634dc11a068d2e7d6b00ab8c6fadff0a6ea587b60c138da088abb81022` |
| payment / split-payment | `c9b0b794c4c0cf99417d5a0460db2f33170291dd342bb667358d2f1898dc93a2` | 0.003060 | `d7bc055e63148471510fe9f10d7b08208e59689159191c0ca6f05a73dedde331` |

Machine-readable public evidence: `.cache/public-transaction-evidence.json` and `.cache/public-acceptance-evidence.json`. These contain public transaction metadata only. Encrypted recovery files are private local QA artifacts and must not be published.

The final native split sent 0.0401665 tKAS to each of the other two example accounts, with a 0.00306 tKAS fee and no change. Both exact outputs were independently matched by transaction ID, index, amount and native script; see `.cache/public-split-outputs-evidence.json`. An earlier unsigned 0.01 + 0.01 review was correctly blocked by the network storage-mass limit. The interface now explains that error. No repeated or replacement transaction was submitted.

## Final funded-state visual and interaction review

The final static build passed **80 Chromium states**: escrow, treasury, prediction, proof, token, redeemed receipt, native payment, and two-recipient native payment at **320, 390, 768, 1024 and 1440 pixels**, in both themes. Each restored the encrypted QA recovery, rechecked actual Testnet-10 acceptance, and used the current browser modules. No page exception, horizontal overflow or private `/api/` request occurred. Additional checks covered over-cap payment rejection before review, account-switch display updates, keyboard application activation, and hiding the unrelated original-contract receipt in asset mode. The final token holder count is zero after burn; the issuer retains 900 unissued units. The receipt shows zero remaining claim.

Visual inspection of narrow dark token, tablet split-payment, and wide redeemed-receipt screenshots found two CSS issues beyond page-overflow checks: a narrow account selector escaped its inner panel, and the split checkbox inherited full-width input styling. Both were corrected, and all 80 states were rerendered successfully. The corrected narrow selector and tablet split controls were visually inspected again. Earlier live screenshots separately showed actual split receipt and minted/split token holdings. Not every generated screenshot was manually inspected.

The Safari fix selects the already verified direct Testnet-10 RPC endpoint instead of the SDK resolver's repeated failing probes and disconnects on page exit. The security reviewer separately verified 48 unfunded/recovery states in each of Chromium, Firefox and WebKit, 144 total. This final funded Chromium render includes that fix; funded transactions were not repeated across engines.

Evidence: `.cache/visual-review/public-funded/report.json` and its 80 screenshots; the earlier cross-browser evidence is `.cache/visual-review/public-browser/`. The small-output split rejection occurred before signing; changing payment inputs invalidates the outstanding review. All authorized live journeys are complete. Physical-device, assistive-technology, wallet-provider integration and production-security claims remain unverified.
