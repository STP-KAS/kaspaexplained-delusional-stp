# Sprout Harbor: local review

Historical local-review record from 7 September 2026, retained with its subsequent publication update below. The initial preview observations predate production publication; they do not describe the current deployment. For the current economic route, use [the economy release notes](economy-release.md).

The guided town route connects buying supplies, restricting Pip’s budget, moving Sprout, coordinating the greenhouse and paying for a checked schedule. The first goal ends with a running greenhouse and a local habitat-supply action. That final care choice persists in encrypted recovery. Free play exposes the town’s contract actions and six legacy services. The optional Argent care workshop contains two separately compiled actor apps.

The mining workshop is a local simulation with no real mining, rewards or consensus evidence. Moss, Pip and Bolt can contribute or pause work; invalid payments are rejected even when their proposer supplies all modeled work. Changing a sealed candidate invalidates its toy commitment. Hashdag’s design arguments, work-before-selection, independent verification, bribery limits and real-time decentralization are explained with source links and explicit assumptions. The connected node supplies the separate real blockDAG display.

## Current review

Pip’s route now starts from concrete conflicts: the supplier wants payment first, Pip wants parts first, each backer controls a separate pledge, and a worker must provide a checkable answer. The window frame, water pump and seedlings are recognizable game parts. Cleanup returns sale deposits while keeping those parts for the greenhouse. Guided and free play show the current state, attempted action, accepted result and next goal. Result titles name what changed. The three backers show individual readiness and locked amounts; only an accepted release funds the greenhouse.

A delayed faucet payment resumes the selected route automatically; an unresolved saved transaction stops the route without an automatic submission or retry loop. The task panel can move aside, and the blockDAG panel can expand or collapse. Characters use stationary action cues instead of automatic trips through furniture; player movement respects room obstacles in normal and reduced-motion modes.

Activity is available from the game menu. It reconstructs saved transaction IDs, spent outpoints, amounts, outputs and contract state from public journal data. Its input → checks → output explanation distinguishes funding, payment and owner recovery, and separates observed outputs from accepted-chain evidence. Unchanged refreshes preserve expanded details. It includes town, asset, retained legacy and Argent records; it is not a network-wide explorer.

Transaction animation uses the real transaction ID and public input/output metadata. Pending events are emitted after saving signed bytes and before submission. A parcel enters an accepting block only after the connected node reports that block’s ID; output parcels then return. The positions and motion are illustrative, not a consensus trace or a finality guarantee.

## September 7 evidence

- **Synthetic browser flow:** all 20 guided steps at 1440 and 390 px, using the real UI and SDK signing with unfunded fixture UTXOs and mock RPC. Each run made 19 mock submissions; the rejected choice sent none. Local choices, delayed-faucet auto-start, first-goal completion and reload passed without page errors. Pending reload did not resubmit. See `v4-flow-local-regression.json`.
- **Conditional funding and recovery:** synthetic browser checks followed readiness from 0/3 through 3/3, kept readiness and greenhouse state unchanged while acceptance was pending, and changed the greenhouse only after release. Restoring free play at 2/3 readiness preserved the waiting third pledge and sent no transaction. Rejected overspend and schedule choices did not advance state.
- **Room movement:** collision checks passed in all five rooms with normal and reduced motion. These are browser checks, not physical-device performance evidence.
- **Fresh live shared-origin route:** a fresh wallet received 10 tKAS and completed all 20 steps through the shared browser origin. Nineteen distinct transactions have recorded accepting-block IDs; the oversized request has no transaction ID. Habitat supply and completed-state reload passed with no recorded errors. This is a new live run, separate from the earlier restoration below. See `v4-release-final-live-verification.json` (September 7, 06:59 UTC).
- **Existing live history:** restoration re-observed the route’s 19 previously accepted transactions, with zero pending. Those restored records are separate from the fresh 19-transaction run above. See `v4-browser-node-recheck.json`.
- **Inspector and layout:** desktop and narrow-browser checks passed for opening Activity, exact outpoints, pending wording, operation-specific refund explanations, focus return and no horizontal page overflow. Unchanged refreshes retained expanded details.
- **BlockDAG controls:** expand/collapse worked at 1440 and 390 px while 24 synthetic node events arrived; no wallet or submission was involved. See `v4-dag-controls-local-regression.json`.
- **Targeted checks:** V4 state/recovery tests passed 3/3; Argent protocol/recovery/spending-gate tests passed 6/6. Transaction-animation ordering was reviewed in source; the fresh live route separately establishes node-reported acceptance, not a measured frame-by-frame animation trace.

## Earlier verification

- General suite: 57 passing checks.
- V4, Argent recovery, mining, DAG and faucet suite: 34 passing checks.
- Public browser-wallet/recovery/signing suite: 23 passing checks plus the signing harness.
- Independently recompiled script VM: 72 cases passed across native V4, composed robot/market/vault and Argent; 41 adversarial transactions rejected.
- The existing guided route’s 19 Testnet transactions were independently accepted earlier. Current restoration re-observed all 19 with zero pending and did not replay any spend. See `v4-guided-browser-verification.json` and `v4-browser-node-recheck.json`.
- Final browser flow: Chromium at 1440 and 628 px, WebKit at 390 px. Restored wallet, first goal, local care, free play, unfunded Argent entry, generated source viewer, network explanations, mining commitment change and no horizontal page overflow. Desktop reload restored the local care completion. See `v4-final-browser-verification.json`.
- Mining browser branches and keyboard dialogs: invalid candidate, valid candidate, changed commitment, all participants paused, Escape dismissal and wallet focus containment at the same three widths. See `v4-workshop-browser-verification.json`.
- All six legacy service adapters were inspected without spending; actual 3D entry into Shared vault was exercised. Screenshots are in `.cache/visual-review/v4-final/` and `.cache/v4-service-entered.png`.
- Copy checks pass. The local faucet CORS origin was repaired and its worker deployed earlier; that is separate from the V4 site publication.

## Remaining live validation

The Argent app pair has passed VM, recovery and browser-entry checks, but its live Testnet lifecycle has not been verified. Public new funding and feeding remain disabled; recovery exits remain available. The legacy escrow lifecycle has not been rerun through the new world adapter. Earlier proposed escrow and Argent live validation was not completed; the current browser and funding checks do not close that gap.

Physical-device performance and independent multi-user participation have not been tested. The tour controls all three test keys. Game food/buildings and local mining are not claims of native consensus validation of outside facts. No ZK proof or KCC conformance is claimed.

## Follow-up usability verification, September 7

User review exposed an ambiguous habitat loop and guide ending. The final UI uses three numbered moves through distinct covenant-valid squares, visible Sprout identification, acceptance-only position and energy changes, disabled pending actions, and an explicit finished-session card. Restarting a finished session is optional and only reveals setup; it sends no transaction. Room and service navigation cannot silently leave an active guide. Final care is separate from contract completion, and the saved care state marks subsequent exploration as optional.

The static-only `check:v4:flows` gate passed the complete guide and bounded habitat lifecycle at desktop and mobile widths with mocked RPC and unfunded fixture inputs. It verifies navigation, pending duplicate prevention, completion, optional restarts and reload without new submissions. This is synthetic regression evidence; the earlier fresh live 19-transaction report remains separate. The full local V2 render gate passed 170 states after the touch-target fix. Mobile now starts with a compact live-block panel so the habitat stays visible. Animation defaults on, preserves explicit pause across visibility changes, respects reduced motion and makes no hidden model progress.

## Production verification, September 7

Release `88ee48d` deployed successfully in workflow `34101849128`. All 173 public files match the release. A production read-only restore at `/covenants` re-observed 19 accepted transactions and zero pending; the completed guide, five accomplishments and two food delivered/two remaining persist. No new transaction or faucet request was made. The shipped Activity inspector module matches the tested build. Use the canonical URL without a trailing slash.
