# Actual Argent integration

The optional workshop ships source and compiled artifacts. Public-origin creation and feeding are gated; loopback supports separately authorized testing. A complete live five-transaction Argent lifecycle remains unverified. The local results below are compiler/VM evidence, not live acceptance.

Two separately compiled Argent applications use native closed inter-contract communication (ICC):

- `contracts/public/argent-habitat/warden.ag`: WardenApp owns a food allowance. Its `feed` entry observes an independently deployed CreatureApp by covenant ID, reads its state with the imported compiled template, and requires the exact remote successor.
- `contracts/public/argent-habitat/creature.ag`: CreatureApp requires the controlling Warden covenant to be co-spent and its owner signature. It increases energy by at most three and preserves its entire coin deposit.

One feed transaction spends both app outputs and creates both successors. Warden food decreases by the chosen amount; Creature energy increases by precisely that amount. Warden pays the transaction fee. A balance update in one app without the corresponding transition in the other is rejected. Both actors offer owner-signed retirement. The browser restricts retirement to the owner's native address and a 0.03 tKAS fee cap; the generated retirement entry itself grants the owner control of the remaining value.

## Provenance and validation

The pinned Argent compiler is revision `d08e52dd1e18c9f7e9a2dc482048c2db31d25611`. It compiles the checked-in `.ag` sources into generated SilverScript and portable artifacts. The generated `.sil` files are copied unchanged; they are not hand-authored substitutes.

`node scripts/build-public-argent.mjs` regenerates the app package and records source SHA-256 hashes. `src/public-argent-templates.json` contains both compiled app artifacts, native ABI, Argent routes/hidden-witness metadata and compiler provenance. Warden's import commits to CreatureApp's generated template.

`node scripts/argent-fixtures.mjs --check-vm` passed 18 deterministic unfunded fixtures: seven valid transactions and eleven adversarial rejections. The independent Rust test recompiles generated SilverScript, compares complete SDK unlock bytes with its native ABI encoder, executes the scripts, and checks mass. Positive routes include both genesis transactions, repeated ICC feeding and both refunds. Invalid routes include either missing owner signature, excessive/zero feed, excess credited energy, food not deducted, a foreign covenant, a wrong template witness, owner redirection and reduced Creature value.

At fee rate 100, the exact feed fixture costs 754,200 sompi (0.007542 tKAS), with storage mass 4,977 and script units 110,433 / 102,309. A synchronized live node must still confirm current fees and acceptance. Five Node tests cover exact signed recovery, reviewed-metadata mutation, forged histories, duplicate funding and surviving-output reconstruction after refund.

## Browser host API

Import `createPublicArgentUI` and `validatePublicArgentState` from `src/public-argent-ui.mjs`. Keep its encrypted history in a separate `session.argent`; do not insert Argent journals into V4 activity.

The host supplies:

- `context()` returning `{sdk,rpc,owners,addresses,call,argentTemplates?}`.
- `getState()` / `saveState(value)` for encrypted `session.argent`.
- `action(fn,label)`, `ensureWallet()`, `nodeInfo()`, `refresh()`, `fail(message)` and `sign(tx,index,{owner})`.
- `pending()` for unresolved transactions in other app families, excluding this Argent controller.
- Optional `onChange(view)` for rendering and `onObserved(evidence)` for an accepted transition in the world.

The controller returns `load()`, `view()`, `run(action)`, `check()`, `retry()`, `pending()`, `hasUnaccepted()` and `render()`.

`run` actions are `create-warden`, `create-creature`, `feed`, `retire-creature`, and `retire-warden`. Omitting the action uses `view().nextAction`. Each creation locks 0.25 tKAS. The normal full flow is two creations, one or more feeds, then both retirements. Creature genesis uses the already-created Warden's covenant ID, so initialization has no circular identifier dependency.

The controller journals signed bytes before submission. Its retry path only reconstructs those exact bytes. Restore clears cached observation flags; call `check()` to obtain fresh evidence before spending. `view()` reports amounts as sompi strings, food, energy, status, pending state, exact accepted transaction IDs and the latest evidence.

Serve these modules and `src/public-argent-templates.json` under `/assets/`. Preserve `session.argent` whenever other examples replace session state; validate it during recovery after templates load. All spending families must include `argent.pending()` in their shared pending guard. Include `argent.hasUnaccepted()` and `argent.check()` in automatic observation. Hook world animation to accepted `onObserved` events rather than creation of an unsigned plan.
