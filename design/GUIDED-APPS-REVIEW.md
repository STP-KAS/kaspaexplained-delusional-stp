# Guided application review — September 6, 2026

## Flow

Create a fresh disposable wallet, click **Get 10 test coins**, and choose an example. Each clearly labeled main action signs, saves the exact transaction in the tab, and submits it within the displayed principal and fee limits. No wallet extension, backup download, or second signing button is required. Optional wallet details, backup, transaction details, and ordinary-transaction confirmation remain available.

The sequence is escrow → shared treasury → prediction → proof payout → token → backed receipt. Each example includes a forbidden action to try, an explanation of the missing condition, and a valid action. Next-example buttons follow completed steps. Example selection responds during network work and retains separate contract state. Pending transactions keep spending blocked while automatic checks look for node acceptance; they do not lock navigation.

## Actual Testnet-10 transactions from the local static UI

All six guided scenarios completed through **13 single-click transactions**, each subsequently found in the connected node's accepted-chain history. No manual observation click or recovery download was needed. The funding source for this run was a direct owner-authorized **10 tKAS** allocation, transaction `0a7f5b9fd79d08867bb69b5d9067a9fce221e0b7700a3c3267f95d940da10d3c`, exact output 0 verified at the browser wallet. Its separate funding fee was **0.002648 tKAS**. This run did **not** test the deployed faucet claim.

Application fees were **0.230499 tKAS**. Final native balances were Main **9.083607**, Second **0.19719**, and Third **0 tKAS**. Token contracts retain **0.488704 tKAS**, with **900 unissued units and 100 holder units**. Receipts were fully redeemed. Native balances, retained token value, and application fees reconcile exactly to the 10 tKAS allocation.

The four original forbidden-action checks were evaluated locally against the actual route's timing, required signers, or proof argument. Token inflation and receipt-claim reduction were rejected by their actual transaction builders. No invalid transaction was signed or broadcast, and no node rejection is claimed for those checks.

The independent read-only accepted-chain audit completed at 2026-09-06T17:06:17.077Z using `wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh`, starting from each transaction's recorded pre-submission checkpoint. No transaction was missing. These are node observations, not finality guarantees.

| Scenario / action | Transaction ID | Fee (tKAS) | Accepting block |
| --- | --- | ---: | --- |
| escrow / fund | `557f3111de4727eee2fc9d849c76582d721d578e43570cd761e96fb52cac5c58` | 0.002659 | `676763e756a1d65365d77901e10ab195da868e3f6ec6a85902d584e7a965418d` |
| escrow / release | `10308c4480d9ba6cde90b011235eeb6bf0e9e40a0bdbd1c20693bccda0d2bca8` | 0.002810 | `9d4ef2a2f1e784715037b584521e19adc7fe13d41d7d3badd0164b1f105e4a36` |
| treasury / fund | `9c306d7eb278ff17dccffb6de66b7a7a603e5a8ce7f9f43ed40fdc962faa1088` | 0.002659 | `31354cf42fcdc9a42e26c783f0623a19662acf64626e42d7e1f6fd80ae13c49d` |
| treasury / spend | `4b7cdbb2fa37f93447e1864b7c1c9ac708a3b951e347cb5cdf342fd322f06420` | 0.003462 | `b0feaa8b1c56a1f5c1f6ecebfd97892d56fa059487576a3ca18e7f03bd10fce4` |
| prediction / fund | `c8a4a1647a50af876181534adbc1ed8ffb3a8d087e43217795ed62687d3198dc` | 0.004379 | `2b2fd520a223a5a1fdf8583ce582869666d604157baa62bdaae38cecaa230953` |
| prediction / settle | `fddd559519f498533167b256a84b33e8e4c2196247a3d8b710d9e601811018cb` | 0.003527 | `4df2127715bc82fd3a80ee3b3562b804f58884ba9aa56b7afb3a3610b2542923` |
| proof / fund | `365de9cef2f163bea71adf5e0b2f99b885bc528f55877d87f7e3ab308abb3948` | 0.004379 | `2fda8dfad0c365a690a374ac710fc0928b6fa6ebc16c34419a0fa16f336cc9da` |
| proof / verify | `56cf22695c0702cd4f1ede8b8dca8c7895a6822caad73270d67ab6a54b10c635` | 0.181539 | `23e1bc3e72bde6cda56aee48667b05e12c3be9fca50efb6dba126ea92e6a2829` |
| token / create | `f4057ad2909973a4692b541d3b4913db4aeda2a948a45a00d57d50d83777346f` | 0.004413 | `7c951f2ce29d1a7bb31d8997a4f2dcc0f421f78dac466c925fe8337b557330d7` |
| token / mint | `ba8b93c7e9f0176d30fb1fc092697c1ef93f5b6376bc1b19f9541472b1850510` | 0.005816 | `4617f3d28bc2ce93422616272d5bfaeb169489223aa4085d9b3c5c8d66be9b66` |
| token / move | `492132acb660c42c861535e06955e5f12f84d2114de4ea76dc632115eef1a09e` | 0.005480 | `c6e2dc2ac966fba7502519523706eefc89d7e21b7c1ed1017f4da8ad8ab3dc46` |
| receipt / create | `3cc6fe6f561599ce114f413e5c6c502333312001d4827407210ae93b4be731c1` | 0.002693 | `a45f649436badc75b29265083d0dfdc4277182ff2a7180fa8b8b9ddedef8a6f5` |
| receipt / redeem-full | `098fac9810bf173fe658d40b71b05741f4b2219bf4b8ddc38b5f871c90f8cae2` | 0.006683 | `079f6785767afce4486d0ae423efd4f09b132de089ab1e8c58ff91c5cc1add6d` |

Evidence: `.cache/guided-public-transaction-evidence.json`, `.cache/guided-public-acceptance-evidence.json`, and screenshots of the token/receipt rejected-rule states. Encrypted recovery archives remain private local QA artifacts.

## Browser and recovery checks

Fresh-wallet checks passed 60 responsive states each in Chromium and WebKit, including automatic tab-session restoration, preservation of two prepared scenario slots, and selecting another example during a node operation. The permanent browser gate separately passed **168 unfunded states** across Chromium, Firefox and WebKit, including optional file backup and legacy restore compatibility. There were no mandatory downloads, browser exceptions, or page overflow in those checks.

The funded run exposed stale “Checking…” messages after completed balance/observation operations and queued navigation. Those feedback paths were corrected. Faucet handling now accepts a pending transaction response, verifies exact output 0, repeats only the same request ID, rejects a changed transaction ID, and permits one timed retry of that same request.

Final current-build, read-only responsive checks are recorded in `.cache/visual-review/guided-final/report.json`. Production-origin faucet funding and the complete online user journey require a separate post-deployment run; local node success does not establish them.

The final read-only pass covered **60 states**: all six completed scenarios at 320, 390, 768, 1024 and 1440 pixels in both themes. It restored the actual encrypted QA session, rechecked accepted-chain history, and made no faucet request or transaction. No exception, download or horizontal overflow occurred. Visual review found that older token observation flags had not been rechecked after restoring a session whose latest transaction was a receipt. Asset history refresh now rechecks those saved records; the completed-token guide survived restoration in the repeated 60-state pass. Narrow token, phone escrow and tablet receipt views were visually inspected. Source is frozen for deployment and the separate online journey.

## Deployed public run — completed

The deployed `85414b4` site at https://kaspaexplained.com/applications completed all six scenarios with a fresh visitor wallet and the actual **Get 10 test coins** faucet button. The faucet request `1cf5223b-061a-4e49-b0aa-3a2b5a3f04ae` returned transaction `8b6b70dd079091068953253edbda832a7c134474aa15ecb361ebe7d7f8640842` to `kaspatest:qr3gdawdegmt2krqnyx9sjdzsqlhchlxgl03vxkyypx0xzvdfyueus57h7zgz`. The browser automatically verified exact output 0 for 10 tKAS before any application spend.

All **13 application transactions** were found in accepted-chain history, independently rechecked at 2026-09-06T17:46:36.613Z. Automatic polling advanced each scenario without a manual Check or Refresh click. There were no observed browser runtime errors or download events. All six forbidden-action examples were blocked locally before signing; no invalid node broadcast is claimed.

A session interruption occurred after receipt creation. With explicit user approval, the same disposable test wallet was restored from its private encrypted QA recovery. Restoration automatically rechecked history; no faucet request or receipt creation was repeated. The receipt's claim-reduction challenge and full redemption then completed, and returning to Token still showed “Token scenario complete”.

Fees were **0.230499 tKAS**. Final balances: Main **9.083607**, Second **0.19719**, Third **0**; token contracts retain **0.488704 tKAS**. These plus fees reconcile exactly to 10 tKAS. Receipt backing was fully redeemed. This is a current node observation, not a finality guarantee or security audit.

| Scenario / action | Transaction ID | Fee (tKAS) | Accepting block |
| --- | --- | ---: | --- |
| escrow / fund | `a565693c4095539060a38982529323f875f87d0058e19fa4b99083203e651071` | 0.002659 | `3450f7ece0f7aafc0948e1d2e13505ac04e68067d2b991bec809add0b4ea1625` |
| escrow / release | `5af91adbf6e3e00d2ece7aac1f2ae359c87a30913b1cfb7594c7ff4538f9bdf0` | 0.002810 | `c7c20827068b1ef11b4fa1d6d0d7a316eef3af61dc937b7a38b1882b3978e973` |
| treasury / fund | `2ac5adc2418dfc3092e29bbd8ffcd3dea79f6b72def090fc6660ccb9d5abdbc0` | 0.002659 | `8e906cccf3385b92a3229234102fdec23a32e6e63353276e23f6d706f8d061d8` |
| treasury / spend | `c28827e674ee905a40b157c2dfa5911df6ffde9b4e4ca033b3f96a6c269b03d4` | 0.003462 | `92eb8c4d1977bde8bd223a9a95c0917bd8879cf11c143a270e9c21fd0a829958` |
| prediction / fund | `21db56a19344a00e54e47c37495fed580f8a67f51d43963dc5c6ed136d1c209f` | 0.004379 | `d126765fdd9c4da965c358db1fbf45103c1eddfb8296a6d69b913f2f9c49cc03` |
| prediction / settle | `bdf085cd645af3e0ec0fe2b1008e8e454ee9a870350440f920ce1bb112c1a294` | 0.003527 | `4106f25ae9eb1ad149edb4b7152baf8b01df097021aa1b5e06eaf070e2fec16c` |
| proof / fund | `c381b1c84034efb487542de489a2c9eea5decb7e70f9ccf0f1894759a56b617f` | 0.004379 | `b4300caaebc81aaea5405b5a8af587037e13a66b8a68e5847dee61dc29855f08` |
| proof / verify | `bfd6be03d6a054558a70ca688b7ff019109072d9e238116d8a8c65b2ebb8241d` | 0.181539 | `e3e67077289f12242779ff0dc87e6488c88df61dc34a8c9d40866b7585bb337d` |
| token / create | `4cf27d570baeca986db1a9ca2931f9e4694a8776e19ab2841c15101e3fcd9c25` | 0.004413 | `1d891718f6a8d3fcd1d9045745a704b450296709ee1ae968365f2cf2ba88891e` |
| token / mint | `4087ae0c1635b308116b45e5b857a4cf13d2234099d7b1f75f9e4d65fcedab4d` | 0.005816 | `d9169c230ec36a6e1e67e290d5341a49f379c669c38499ec71e0f10c0b005548` |
| token / move | `861e265aa43c7aeff30d9e42cb1765ab2e49bb012a3069b8dddce787829fb9c7` | 0.005480 | `73c8cfcc19c73b5573061d51e9632369fb12e573c9880ebf0a86e004c6418598` |
| receipt / create | `b8c818fdc6ea9a2572d0d420e4f402f6c26a8fdf827af081e1d5c02b5f24bf55` | 0.002693 | `90382a93d504503e59dd575a329824ce4719334c7dc15432ab1493eb097233cb` |
| receipt / redeem-full | `913ab06861d53563b477f27b35661ae87695e7b6c08b97c17e299ba5bbba2578` | 0.006683 | `a6808356a8e8e7ba79e73c478fbe3c2d843bdf470503df9167be3507bf20a272` |

Public evidence: `.cache/online-guided-transaction-evidence.json`, `.cache/online-guided-acceptance-evidence.json`; screenshots `.cache/online-guided-token-rule.png`, `.cache/online-guided-receipt-rule.png`, `.cache/online-guided-token-complete.png`, and `.cache/online-guided-receipt-complete.png`. Private encrypted recovery artifacts are not published.

## V3 named token — actual Testnet-10 predeployment verification

The local V3 browser created **Garden test token**, issued 100 units, rejected the extra-unit construction locally, and transferred those 100 units. All three transactions were accepted automatically. No additional faucet claim was made: this used the existing approved disposable test wallet, with freshly queried spendable outputs. Fees total **0.015784 tKAS**.

A separate read-only public-node `getBlocks` request retrieved the genesis transaction from block `d1092f75b277788ef65c1de6dc17de33a07a6fb78b3a7e818a6ade1fdbdcbeda` and decoded its actual payload as `{"protocol":"kaspa-explained-token","version":1,"name":"Garden test token"}`. This verification used the network-returned transaction rather than the local journal. The accepting block and containing block differ in Kaspa's DAG; both identifiers are recorded here intentionally.

The name and completed holdings survived an actual optional encrypted backup download and restoration in a fresh browser context. No browser runtime errors occurred. Imported names remain withheld until their exact genesis transaction is reobserved in accepted-chain history. Existing unnamed archives remain supported. Names are application metadata, not a claim of KCC standard compatibility; the covenant ABI is unchanged.

| Action | Transaction ID | Fee (tKAS) | Accepting block |
| --- | --- | ---: | --- |
| create | `e9c2c81ed312a2d9c53febdf73905cba70eb74e20cdf5191943782e2236b0e7e` | 0.004488 | `c9035d7c5e7a250297be7d42bf0c73314bda1e5717cde26687f37c507ec546a4` |
| mint | `a59a7bb44b90330c558514725e719831b4731fe161f6a92ad19696a9dfad98ec` | 0.005816 | `a07b68c8fc0c16200bd8d62ff31c81babb1437428691211f256b3168b8c59e31` |
| move | `b39592105e8bbb00ec3b2b022966ddfa42b6af30571adc74abf0841efa64874e` | 0.005480 | `8805355d4d7d7f7d5a891995d6ffa4308f48ac729526c6b956e09119627c66c7` |

Evidence: `.cache/named-token-transaction-evidence.json`, `.cache/named-token-acceptance-evidence.json`, `.cache/named-token-public-payload.json`, `.cache/named-token-browser-evidence.json`, and `.cache/named-token-restored-phone.png`. This subsection verifies the predeployment build against the real network; a separate deployed V3 run will follow.
