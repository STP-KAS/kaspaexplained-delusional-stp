# V3 visual review — local predeployment evidence

Reviewed 6 September 2026 in the local V1 build. This records local checks; it does not establish deployment or performance on a physical iPhone.

## Mechanisms and visual states

Money and coordination completed all six guided steps at 320, 390, and 1440 px in both themes: 72 browser states, no JavaScript errors or horizontal overflow. The first mobile review found the desktop SVG lettering too small at 320 px. Dedicated compact mobile geometry replaced it, and the final source was rechecked through browser asset interception. The mobile layout preserves the paid/burned/waiting amounts, collateral/debt/health, pool payouts, participant balances, agreement state, and executed total.

Evidence: `.cache/visual-review/mechanisms-v3/report.json` and adjacent screenshots. Money and coordination model tests passed 9/9. This visual pass did not change their state calculations.

The flow review examined WebKit payment stage 3 at 390 px, Chromium transaction step 1 at 390 px, and WebKit competing-spend step 2 at 390 px. Sender, network, recipient, payment, change, fee, accepted, and already-spent labels remained readable and separated. The flow browser report records all payment, spending, transaction, vault, and mining steps at 390 and 1440 px in Chromium and WebKit. Evidence: `.cache/v3-flows/report.json` and adjacent screenshots.

Transaction ribbons use the same input, payment, and change amounts as the text. Review caught a minimum 2 px width that exaggerated very small payment/change values while the caption disclosed enlargement only for the fee. The coordinating agent removed that minimum. Current source now uses `112 × amount / 12.5` for payment and change; only the fee line is enlarged, as stated in both the visible note and accessible SVG description. The inspected screenshots precede this minor endpoint-width correction; source inspection verified the correction.

Network screenshots inspected: `.cache/visual-review/network-v3/320-dark-4.png` and `1440-light-2.png`. The compact parallel drawing retains labeled A/B/C/D blocks and explicit references; the desktop sequential drawing names the next block's reference and explains arrow direction. Packet positions are described as elapsed delivery, not physical distance. Small transaction-row marks are illustrative detail, with meaningful block relationships conveyed by readable labels.

## Accessibility and interaction scope

State meaning is available in text, not color alone: Accepted/Already spent, check/cross rule results, payment/change/fee labels, and named block references accompany visual styling. The network block source exposes button roles, tab stops, pressed state, and descriptive labels, with Enter and Space activation. The guided regression activates controls with the keyboard and checks the phone result and Continue positions. Its final log reports completed model walkthroughs, exact money payout, and 120 passing layout states (`.cache/v3-guided-final.log`).

Reduced-motion handling stops replay and jumps explicit replay to the final state. Automatic network replay is skipped for coarse pointers, reduced motion, hidden documents, and data-saving connections. Leaving the visible area or hiding the document stops replay. This was a focused source and browser review, not a complete screen-reader audit or formal accessibility certification.

## Bounded performance check

A 390 × 844 touch viewport was tested in WebKit and Chromium with a 6× CPU slowdown. Home, money, coordination, and payment walkthroughs were exercised. Chromium handler times were 2.3–16.8 ms and the measured next-animation-frame delay was at most 16.8 ms. One 70 ms initial home-load task was observed; the other tested routes recorded no long tasks. WebKit handlers measured 1–5 ms and next-frame delay at most 15 ms. WebKit does not provide the same Long Tasks API, so its empty list is not evidence of zero long tasks.

All four pages recorded zero idle DOM mutations in a 700 ms observation after interaction. With normal motion enabled, the coarse-pointer home network recorded zero mutations over 1.2 seconds in both engines, consistent with automatic replay being disabled on touch devices. The required first two home, money, and coordination steps kept both their result and Continue button in view in both engines. Later money rows in the raw performance report intentionally still point at the first panel's hidden payout selector and are not later-panel visibility failures.

Evidence: `.cache/visual-review/mechanisms-v3/perf-phone.json`. These measurements are local engine emulation on this computer. They do not reproduce the CPU, GPU, memory pressure, thermal state, Safari version, or network of the user's older iPhone. Smooth physical-device behavior remains unverified.
