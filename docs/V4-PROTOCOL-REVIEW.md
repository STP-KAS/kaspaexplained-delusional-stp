# V4 independent protocol review

Reviewed 2026-09-06. These checks distinguish local consensus-script execution from acceptance by a public node.

## Verified locally

- `node scripts/v4-composed-fixtures.mjs --check-vm`: 21 transactions, 9 valid and 12 deliberately invalid, evaluated by the pinned native Rust VM. Covers agent payment and recovery, a single transaction with market and agent covenant groups, wrong payee, over-cap payment, wrong signatures, output rebinding and altered voucher owner. Evidence: `.cache/v4-composed-fixtures/vm.log`.
- The composed plan has four covenant inputs, three transferred market outputs, a seller payment at output 3 and a residual policy budget at output 4. Its serialized size and transient mass make the default fee approximately 2.986 million sompi, close to the 3 million policy cap; raising the fee rate can correctly prevent construction.
- `node --test tests/public-v4-state.test.mjs`: actual SDK recovery maps mixed outputs correctly, removes spent cells independent of journal order, rejects duplicate journals, and clears restored acceptance claims until fresh node observation.
- `node --test tests/v4-dag-view.test.mjs`: node-observed DAG data and lifecycle checks. The spatial DAG creates edges only for observed child/parent hashes; transaction parcels enter a block only when an accepting block ID is supplied with accepted status. Actual Three smoke checked acceptance gating, completed-ID deduplication and disposal.

## Boundaries

Vault relative-sequence fixtures verify script constraints, including rejection of sequence 99 against a required 100. They do not establish public-node elapsed-DAA maturity.

The guided route uses hand-written SilverScript. The optional care workshop now integrates two separately compiled Argent actors at revision `d08e52dd1e18c9f7e9a2dc482048c2db31d25611`, with a separate encrypted history. Their native ICC transaction passed 18 local VM cases, including 11 adversarial rejections. Its browser entry and source viewer were checked, but live Testnet acceptance has not been tested. See `docs/newdesign/ARGENT-INTEGRATION.md` for compiler provenance and the exact boundary.

DAG positions and motion are illustrative. Hashes and parent relationships come from node observations. Public acceptance should be reported only with current node evidence; local VM success alone is insufficient.
