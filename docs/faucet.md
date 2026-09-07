# Testnet-10 demonstration faucet

The faucet is a separate Cloudflare Worker and Durable Object at
[the service endpoint](https://kaspa-demo-faucet.parker2017.workers.dev).
Worker version `e517f367-69f3-42cb-ba2a-4fef481b492d` was deployed and enabled
on September 6, 2026. Guided website revision `85414b4` is also deployed
(successful deployment run `34048299229`); all 138 expected live files matched.

The first online claim delivered exactly **10 tKAS** to a fresh browser session,
and the browser automatically observed the recipient output:
[8b6b70dd079091068953253edbda832a7c134474aa15ecb361ebe7d7f8640842](https://tn10.kaspa.stream/transactions/8b6b70dd079091068953253edbda832a7c134474aa15ecb361ebe7d7f8640842).
Repeating the same request returned the same accepted transaction. The live
status then reported one observed claim and zero pending claims.

The initial 50 tKAS reserve transfer is
[f584df46058a978290d0647161d6e627517bdd39906ae0c614a43d78ca203010](https://tn10.kaspa.stream/transactions/f584df46058a978290d0647161d6e627517bdd39906ae0c614a43d78ca203010).
After the first online claim passed, the approved **8,950 tKAS** refill was
submitted as
[980f69efe7bf37208e81a799faae194ba1f75cb1677941d4ad85da0a908a9b70](https://tn10.kaspa.stream/transactions/980f69efe7bf37208e81a799faae194ba1f75cb1677941d4ad85da0a908a9b70),
with a 0.002648 tKAS fee. Total reserve funding is **9,000 tKAS**. The subsequent
live status reported capacity for 898 further claims, one observed claim and
zero pending claims. These are point-in-time observations, not a guarantee of
future availability.

The operator's master wallet remains
local. Only a dedicated **Testnet-10-only** faucet key was installed as a
Cloudflare secret with explicit authorization. The worker cannot sign for the
visitor's three browser accounts or the operator's separate master wallet.

## Request and spending policy

`POST /api/faucet` accepts exactly `{address, requestId}`. The address must be a
canonical `kaspatest:` P2PK address. Request IDs are bounded to 16–80
alphanumeric or hyphen characters; the browser creates a UUID. Caller-supplied
amount, fee, transaction, network and signing fields are rejected. Bodies are
limited to 2 KB. Each eligible address receives exactly **10 tKAS** once; the
caller cannot choose another payout amount.

The policy permits at most eight ordinary inputs belonging to the faucet,
one 10 tKAS recipient output and positive change to the faucet. Duplicate
inputs, covenant inputs, redirected change, altered amounts and unexpected
transaction fields are rejected. Current fee estimates and consensus mass are
checked. The fee cannot exceed **0.01 tKAS**. Final signatures use SIGHASH_ALL.

The Durable Object serializes requests and atomically saves the signed
transaction, recipient and request-ID records, pending state and rate count
**before** submission. One unresolved transaction reserves the wallet; another
claim cannot construct a competing spend. Reusing an address returns its saved
claim. Reusing a request ID for a different address is rejected.

There are at most **20 new claims per client IP per UTC day** and **1,000 total
observed claims**, further bounded by the available reserve. IP rate keys use
an HMAC digest; raw IP addresses are not stored by this application. The
Cloudflare infrastructure still processes requests. Origin restrictions allow
the published site and the configured local development case, but are not
identity verification: direct clients can forge an Origin header. The reserve,
global cap and rate limit are the spending bounds, not a promise against all
abuse. `remainingClaims` is a conservative estimate, not a reservation.

## Observation, retries and pause

A submission response alone does not mark a claim accepted. The service checks
the exact faucet-change outpoint, amount, script version, script and absence of
a covenant at the Testnet-10 node. This is a node observation, not finality or
independent proof of node honesty. The browser separately checks its exact
10 tKAS recipient output.

An uncertain claim can retry only its original signed transaction, with the
same ID and outputs. There are at most **three total attempts**, at least
15 seconds apart. The attempt count and timestamp are persisted before each
retry. No replacement payment is generated. If all attempts remain uncertain,
the pending reservation remains and needs operator investigation; it must not
be cleared merely because a request timed out.

Setting `ENABLED=false` pauses new claims and retry broadcasts. Existing
observation and receipts remain readable. The worker's stored faucet address
must agree with the configured key; replacing the key without a deliberate
state migration fails closed.

`GET /api/status` exposes network, enabled/connected state, observed claim count,
pending count, remaining-claim estimate and fixed payout amount. Results may be
cached for 15 seconds. This endpoint contains no private keys or signed journal
bytes. The service uses the dedicated Testnet-10 WebSocket RPC configured in
`faucet/worker.mjs` and blocks wrong-network or unsynchronized responses.

## Browser session and evidence

The guided page creates three disposable keys and automatically saves encrypted
session recovery before sending. Its random recovery secret and encrypted
session are both in this tab's `sessionStorage`, so reload can recover it;
closing or clearing the tab can lose it. A password-protected file export is
optional. This convenience does **not** protect keys from same-origin script
compromise or XSS. It is an unaudited testnet playground, not a production wallet.

Seven unfunded policy/worker tests cover payout and fee limits, changed outputs,
input ownership, request validation, journal-before-submit ordering,
idempotency, exact-byte retry limits and observed-claim caps. The worker tests
use actual SDK transactions with mocked RPC/storage, not live faucet payouts.
Separately, 13 newly guided application transactions were observed using a
locally funded browser session supplied with 10 tKAS; their fees totaled about
0.230499 tKAS. That local run did not exercise the public faucet claim endpoint. The separate
online faucet check above has now passed. All six guided
scenarios then completed on the live website with a fresh wallet, the public
faucet and 13 independently observed application transactions; see
[the guided verification report](../design/GUIDED-APPS-REVIEW.md).

Local keys, development secrets and Wrangler state remain under ignored
`.local/`, `.dev.vars`, `.env` and `.wrangler/` paths. Never commit their
contents. Worker source, policy and non-secret deployment configuration belong
in `faucet/`; deployment credentials and faucet signing material do not.
