# V3 token naming: independent browser review

Local predeployment review, 6 September 2026. All 27 cases passed in Chromium, Firefox, and WebKit. No source changes were made in this review.

The harness loads the built `/applications` page and mounts its actual `public-assets-ui.mjs` component with the real browser SDK, compiled token template, transaction builder, and signature implementation. Funding UTXOs and accepted-chain responses are invented offline fixtures. The public application entry point is suppressed, all external requests are blocked, and no faucet or live submission is used. Therefore this verifies browser behavior and signed payload construction, not network acceptance.

## Cases checked in each engine

- The token creation field starts with `My token`.
- Default, Unicode (`Grüße 東京 🐎`), 40 ASCII characters, literal HTML-like text (`<img src=x onerror=alert(1)>`), and 30 emoji names survive creation review, the signed transaction payload, and holdings after stubbed acceptance.
- Enter activates the actual guided creation button. Names appear as text in both review and holdings; HTML-like text creates no image element.
- Accepted holdings remain within the page width at 320, 390, and 1440 px in light and dark themes. Long and HTML-like names were visually inspected in WebKit at 320 px and Firefox at 390 px, respectively.
- Forty-one ASCII characters, 31 emoji (exceeding the byte bound), and whitespace-only names are rejected before a transaction review is shown.
- Passing a named collection through the actual recovery validator clears node-observation evidence. The UI then displays `Token name awaiting node verification`, withholding the imported name from holdings.
- A signed legacy genesis with no name payload passes recovery validation and displays `Unnamed test token`.

This test exercises the recovery-state validator and restored UI directly; it does not repeat encrypted-file import/export, which belongs to the full application browser suite. The separate funded lifecycle check is also outside this harness. The screenshots show fixture acceptance and must not be presented as evidence of a real accepted transaction.

Evidence: `.cache/check-v3-naming-browser.mjs`, `.cache/visual-review/v3-naming/report.json`, and adjacent screenshots. Output: `engines: 3, cases: 27, passed: true`. No JavaScript errors or tested-width horizontal overflow were observed.
