# V3 public education verification

Verified `https://kaspaexplained.com` on 6 September 2026, completed at 18:52 UTC. The coordinating release check identified deployed revision `d1d69ec`, successful deployment run `34052188335`, and 143 matching HTTP/SHA-256 artifact checks before this browser run began. This review independently tested the public site after that confirmation.

## Public browser results

The read-only `.cache/check-live-v3-education.mjs` suite passed **432 guided states** across Chromium, Firefox, and WebKit, at 390 and 1440 px, in light and dark themes. It exercised:

- Network: all four steps in the playground and home demonstration.
- Competing spends: both steps.
- Transaction payment/change/fee: all three steps.
- Mining: all three steps.
- Vault rules: all four steps.
- Payment lifecycle: all four steps.
- Money: all six steps, ending with an exact $100 Yes payout.
- Coordination: all six steps, ending with Ana, Ben, and Cleo moving 90 imaginary credits together.

The suite activated Continue using keyboard Enter, verified completion controls, found no page JavaScript errors or tested-width horizontal overflow, and checked that the first two home, money, and coordination results and Continue controls remained in the 390 × 844 viewport.

Evidence: `.cache/visual-review/live-v3-education/report.json` and screenshots in that directory. Recorded output: `base: https://kaspaexplained.com, states: 432, engines: 3, passed: true`.

## Visual inspection of public pages

Inspected the actual public Chromium desktop home at the sequential-block step, WebKit phone money at the final payout, and Firefox phone coordination at completion. Focused WebKit phone screenshots additionally checked the full coordination result and final parallel network geometry. Main labels, amounts, branch references, and result text were legible; the compact diagrams showed the relevant state without clipping. Desktop home retained clear separation between explanation and reference diagram. Mobile payout showed $0 locked, Yes $100, and No $0 from one $100 pool. Coordination displayed the executed 90-credit total and remaining balances alongside consumed permissions.

Key screenshots: `chromium-desktop-home.png`, `webkit-money.png`, `firefox-group.png`, `webkit-phone-detail-group.png`, and `webkit-phone-detail-home.png`. Additional desktop money and group captures are in the same directory.

## Sources and original books

The public `/sources` page loaded with its Sources and verification, Primary references, and What a claim needs sections. The `/moose` page exposed both original PDF links. Direct public requests to `/carnot-local-brownian-global.pdf` and `/the-instrument.pdf` each returned HTTP 200, `application/pdf`, and a valid `%PDF-` file signature. This checks availability and link targets; it does not claim a new page-by-page review of the books.

## Limits

These were real public education-page checks in desktop browser engines with phone-sized viewports. They did not exercise a physical older iPhone, prove its GPU/thermal performance, or send testnet transactions. Funded application, recovery, and artifact-integrity evidence is maintained by the separate release checks. No source edits were made during this public review.
