# V1 release notes

Published September 6, 2026 at https://kaspaexplained.com from source revision
`6ef9f73`. The release coordinator confirmed successful Pages run `34041857828`.

Kaspa Explained has been rebuilt as a standalone educational site. Fifteen pages replace the older collection, with shared navigation, search, light and dark appearances, and interactive explanations that connect a changed input to a visible result.

The opening introduces sending money and network verification. The network illustration lets readers change delivery timing, select blocks, and inspect references. The Understand page follows a miner from choosing transactions through searching for valid work to independent node checks, explaining how work commits to block contents. Wallet lessons move through receiving, sending, and checking a payment. Mining examples distinguish network activity from an individual miner's chance of discovery. Spending-rule examples show why a transaction succeeds or fails. Money models connect reserves, collateral, and conditional payouts to the amounts they represent.

The build page separates a single conditional agreement from shared application execution. It also explains why a correct proof over selected inputs does not establish that every required request was included. Status pages distinguish active protocol rules, release candidates, prototypes, and research. Moving network values retain their observation date.

A new coordination example lets readers authorize conditional moves, choose individual group thresholds, preview a viable group, and change a balance before execution. A stale preview moves nothing; a valid execution moves the qualifying group together. Credits remain available before execution. This is a local educational model of revocable conditions, not deployed coordination-market infrastructure or an encryption protocol.

The release preserves both original Moose PDFs and author links. Seventy-eight compatibility routes redirect historical URLs, preserving supported sections and mapping retired section names. A single page registry supplies the build, search, and sitemap.

## Verification and limits

V1 route and artifact checks pass: its generated output contains the educational pages and required assets, without local-wallet interfaces, the local signing service, or the testnet SDK. Fresh educational model tests also pass. Browser evidence covers keyboard interactions, navigation, appearance persistence, model controls, rejection paths, deep links, and resets across Chromium, Firefox, and WebKit at the documented desktop and mobile viewport sizes.

The final render outcome and exact scope are recorded in `design/BROWSER-REVIEW.md`. Automated rendering checks page errors, horizontal overflow, and control dimensions. Manual review samples page types and revised layouts; it does not establish physical-device compatibility, screen-reader certification, learning outcomes, or review of every generated screenshot.

The September 6 source-link audit returned successful HTTP responses for 39 of 41 URLs. The two Kaspa Explorer URLs returned automated HTTP 403 responses and were checked directly in the browser by the coordinating reviewer. A reachable source is distinct from evidence that it supports a claim; the maintained claim registry records sources and readiness boundaries.

These are educational models. Their behavior is not a consensus proof, a performance benchmark, a financial forecast, or a deployable financial application. Experimental Testnet-10 applications remain a separate V2 release effort.

## Live verification

An independent browser spot-check of the deployed custom domain passed after
publication. The home page returned HTTP 200 at 390 and 1440 pixels in light
and dark appearances, with the expected opening, canonical URL and no horizontal
overflow or JavaScript page errors. All four screenshots were visually inspected.
The mobile menu reached Build, search returned two visible results for “mining”,
and `/application-layer#coordination` redirected to the existing coordination
section on `/build-on-kaspa`.

Keyboard Space authorized Ben and Cleo; Enter previewed three people and 90
credits, then executed the group and consumed its authorizations. The empty-group
path correctly moved nothing. Both original PDF links retained their labels,
returned HTTP 200, and reported `application/pdf`. Evidence is saved in
`design/live-v1/spot-check.json`, `design/live-v1/actions.json` and the four home
screenshots. This was a targeted post-publication check, not a repeat of the
full local browser matrix. The coordinator's complete live file/hash check is
separate evidence.
