# Maintaining Kaspa Explained

Source lives in `src/`, `server/`, and `contracts/`. Generated output is disposable:
`npm run build:v1` creates standalone education in `dist-v1/`; `npm run build`
creates the current public site in `dist/`. Never edit generated HTML.

## Verify a change

- `npm run check`: current public build and offline model, transaction, local API, and wallet tests.
  First run `npm run setup:testnet` and `node scripts/build-public-templates.mjs`;
  the standalone V1 build does not install these dependencies.
- `npm run check:v1`: isolated static release and routes; no local wallet interfaces.
- `npm run check:render`: current V1 pages at 320, 390, 768, 1024, and 1440 pixels,
  both appearances, with reduced motion. Screenshots and layout findings go to
  `.cache/visual-review/dist-v1/`. Review images and actual interactions as well.
- `npm run check:contracts` and `npm run check:contracts:vm`: pinned compiler and
  exact contract execution. Neither spends test coins or proves node acceptance.
- `bash scripts/check-site.sh`: combined public offline checks, V1 artifact checks,
  and V1 rendering. It requires the public application setup above and installed Chromium.
- For the current town, run `npm run check:v4`, `npm run check:v4:vm`,
  `npm run check:economy` and `npm run check:v4:flows`. The economy browser
  regression uses the real SDK with synthetic RPC; it does not prove live acceptance.
- Run `node scripts/check-wrap-recorded-browser.mjs` for the static bridge
  evidence page, and `npm run check:copy` / `npm run check:posts` for copy.
- Consult the checked-in `.github/workflows/` files for the exact CI gates.
  A workflow that reuses verified contract artifacts is bounded by its source
  comparison and checksum checks; it is not permission to skip validation of
  changed contracts. Browser journeys require the relevant Playwright engines.


Browser journeys must cover keyboard, touch-sized controls, theme changes,
model resets, deep links, navigation, rejection, and recovery. A screenshot
matrix does not establish these behaviors. Record evidence in
`design/BROWSER-REVIEW.md` and release completion in `RELEASE-CHECKLIST.md`.

## Preview

`npm run serve` runs the loopback-only workshop server on port 8898. Check the existing
listener before starting another process. Stop its owning process normally;
never delete its wallet lock to bypass ownership. Restart after server edits.

`node scripts/static-preview.mjs` serves `dist-v1/` on port 8899 without wallet
or API access. Pass `dist` to inspect a generated public artifact without its signer.

## Source map

- `src/page-registry.mjs`, `src/pages.mjs`: page selection and content.
- `src/components.mjs`, `src/app.css`, `src/app.mjs`: shared objects and behavior.
- `src/models.mjs`, `src/network-diagram.mjs`: deterministic network illustrations.
- `src/money-*.mjs`: explicitly illustrative money models.
- `server/testnet.mjs`: private local wallet and operation queue.
- `server/submission-journal.mjs`: exact-transaction recovery and public projection.
- `src/legacy-routes.json`: historical destinations; update route tests with it.
- `content/x-posts.md`: independently maintained social copy.

## Evidence and publication

Keep protocol activation, draft conventions, compiler support, node acceptance,
and application readiness separate. Cite primary sources at the relevant claim.
Network snapshots retain their actual observation date. Real testnet evidence
records transaction IDs, accepting blocks, amounts, fees, versions, and limitations.

Private `.local/` and dependency `.cache/` directories never enter publication.
The local custodial signer must never be hosted publicly. Public artifacts need
release-specific checks and live route/asset verification. Publication permission
does not waive unfinished release requirements.
