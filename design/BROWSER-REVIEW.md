# Browser review

September 6, 2026. Current local V1 review; nothing in this report establishes deployment, physical-device testing, or learning outcomes. This replaces the earlier intermediate report.

## Final responsive render

A fresh `npm run build:v1` followed by `npm run check:render` finished at **2026-09-06 14:07:06 UTC**: **150 states, zero automated findings**. Coverage is all 15 V1 pages at 320, 390, 768, 1024, and 1440 CSS pixels, in light and dark themes, with reduced motion. The run checks HTTP status, page JavaScript errors, horizontal overflow, and button/input/select/summary dimensions of at least 43 pixels. It saves full-page PNGs and the machine-readable report under `.cache/visual-review/dist-v1/`.

This is not a claim that a person inspected all 150 PNGs. During the design pass, manually inspected screenshots covered all 15 page types: homepage, What is Kaspa, Why Kaspa matters, Using KAS, skeptical case, mining, building, status, KIPs, history, sources, Moose, playground, money, and search, plus the 404 page. The final run's 768px playground and 320px money screenshots were inspected again after the last layout corrections. Earlier screenshots preceded those two narrowly scoped CSS changes.

## Corrections driven by browser review

- The first homepage heading pushed the mechanism too far down. Reduced its scale and moved the running scene ahead of secondary controls. Replay/pause now sits in the experiment label, visible in the first screen at the sampled 320, 390, 628, 768, 1024, and 1280 widths.
- Graph text became too small when wide SVG geometry was squeezed into a narrow scene. Added compact geometry, increased object labels, and removed the compact drawing's height cap. Measured minimum visible SVG font scale was approximately 13–16 CSS pixels at those six sampled widths, without horizontal overflow.
- The tablet playground left a tall empty column beside the graph. The inspector now stacks below the stage through 900px. Rechecked the final 768px PNG: controls, explanation, and model assumptions are separate and readable.
- At 320px, the money flow's desktop arrangement compressed amounts and arrows. It now becomes labeled rows through 600px. Rechecked the final 320px PNG: amounts, reserve legend, and explanatory text remain readable.
- Wallet lessons now show the wallet object before its explanation on phones, and a compact two-column arrangement at 600–760px. The 628px browser check showed the example and its explanation together.
- Small standalone controls found by the render check received a 44px minimum width. The final run found none below its checked threshold.

## Direct interaction evidence

These checks used the local Chrome browser during implementation, in addition to source/model tests:

- Wallet lesson Continue changed Receive to Send and moved focus to the Send step. Arrow-key step navigation also worked.
- Changing network delivery presets changed the selected control, reference relationship, and explanation. Graph blocks are selectable and have inspection text; timing can be scrubbed directly, and exact message delay is editable.
- Money prediction selection changed a $100 locked pool to $100 for Yes and $0 for No. Direct `/money#prediction` navigation selected that panel. Browser Back restored the prediction mode and selected outcome after a mode change.
- Setting the borrowing price to 1 produced a 0.150 health factor, a marker at 5% of its scale, and the liquidation-eligible explanation. The visible marker follows the calculation.
- The owner separately reported successful newcomer/technical/existing-user journeys across Chromium, Firefox, and WebKit at 390, 768, and 1440 widths, and verified that introductory motion runs once. That is owner-provided evidence, not a second independent execution by this reviewer.

The relevant model, network diagram, money model, route, and acceptance tests passed during this design pass (16 tests). The owner's release gate remains authoritative for the final combined source state.

## Reference application and scope

Fresh rendered reference checks during this pass included Apple's macOS galleries, Ethereum's working wallet lesson, Bitcoin's alternating diagram/text sections, and the local XemX composition-library interaction. Ethereum's Receive action advanced the phone example from step 1/7 to 2/7; XemX's control changed its shared object, readout, and caption. The separate visual-reference document records additional agent observations. Its intermediate “remaining review” statements are historical and should not be read as the status of this report.

Applied changes include uneven section scale, compact interior introductions, the Receive → Send → Verify lesson, selectable tradeoff and evidence stages, a mining field beside its controls, reserve and collateral visuals tied to model values, and a single prediction pool with the chosen outcome highlighted. Network blocks have SVG top faces and depth, readable relationships, direct selection, and adjacent inspection. This is a richer interactive SVG illustration, not a 3D rendering or a production-consensus simulation. Numeric changes alter visible objects and explanations; controls are not decorative.

No new actionable layout blocker was found in the final sampled images. Physical phones/tablets, assistive-technology operation, and a person reviewing every one of the 150 screenshots remain unverified. Automated dimensions and engine journeys do not establish those claims.

## Frozen V1 release verification

A fresh final matrix completed at **2026-09-06T14:48:51.021Z** against the frozen
V1 artifact built at 14:45:17 UTC: **150 states, zero automated findings**.
This supersedes the 14:07 automated matrix and an intermediate mixed-build
run. The public page source was unchanged throughout this final run.

The release reviewer inspected the final 320px and 1440px light-theme build
page images after the new agreement/shared-execution/proof-input explanation
was added. Both layouts preserve the new text and section hierarchy without
clipping or overlap. Prior page-type and interaction evidence above continues
to apply; this does not claim manual inspection of all 150 final images.

## Interview-driven changes after the freeze

The coordinator reopened V1 after the 14:48:51 matrix to revise the homepage
and add the work/content explanation to Understand. The earlier matrix is
therefore evidence for the previous artifact, not the final release.

At 2026-09-06T14:55:03.960Z, targeted Chromium checks completed for both changed
pages at 320, 390, 768, and 1440 pixels in light and dark appearances with
reduced motion: 16 states, no page errors or horizontal overflow. Manually
inspected screenshots covered both pages at 320px light and 1440px dark.
The homepage headline and supporting explanation fit; the work sequence
remains readable with clear row separation. Screenshots and report are in
`.cache/visual-review/interview-pages/`. The full combined matrix must run
after the coordination interaction has been integrated.

The PoW paragraph was checked against Rusty Kaspa v2.0.1: body validation
recomputes the transaction Merkle root and compares it with the header;
header hashing includes that root; the PoW calculation derives its state
from that header and checks the nonce result against the target. Sources:
[body validation](https://github.com/kaspanet/rusty-kaspa/blob/v2.0.1/consensus/src/pipeline/body_processor/body_validation_in_isolation.rs),
[header hash](https://github.com/kaspanet/rusty-kaspa/blob/v2.0.1/consensus/core/src/hashing/header.rs),
[PoW calculation](https://github.com/kaspanet/rusty-kaspa/blob/v2.0.1/consensus/pow/src/lib.rs).

## Final combined matrix with coordination

Completed **2026-09-06T15:05:20.693Z**: **150 states, zero automated findings**
after the homepage, work/content section, and coordination model were
integrated. The final run began after the 15:00:52 UTC artifact build.
This supersedes the earlier pre-coordination matrix for release evidence.

The first combined pass flagged only checkbox icon dimensions in the new
coordination section. Direct browser checks confirmed that each containing
label is the activation target: 212 by 50 CSS pixels at 320px and 525 by 50
at 1440px. Clicking the label toggled its checkbox. The verifier now measures
a visible, pointer-enabled containing label for checkbox/radio inputs; it
continues measuring other controls themselves. No public layout change was
needed. The corrected full pass found no errors.

Manual review covered the coordination section at 320px and 1440px in both
themes, including actual viewport captures after label activation. Controls,
participant conditions, group feedback, and the educational-model boundary
remain readable. This extends prior page-type review rather than asserting
manual inspection of every final full-page PNG.

## Publication candidate after final wording pass

The final combined matrix completed at **2026-09-06T15:13:58.938Z** against
the artifact built at 15:11:09 UTC: **150 states, zero automated findings**.
This is the latest matrix, superseding the 15:05 run after the final wording
pass. The reviewer also inspected the new opening at 320px light and 1440px
dark: its headline, proof-of-work explanation, and first network illustration
fit without clipping or overlap. Images are
`.cache/visual-review/final-opening-320-light.png` and
`.cache/visual-review/final-opening-1440-dark.png`.
