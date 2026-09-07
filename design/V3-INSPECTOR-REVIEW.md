# V3 mainnet transaction inspector review

Checked 2026-09-06 against the real public provider from Chromium at `http://127.0.0.1:8901/why-kaspa-matters#inspect`.

The inspector lives on **Use KAS**, not the introductory What is Kaspa page. V1 intentionally supplies an explorer link instead.

- Read-only mainnet transaction: `9214e910c66527fa658d2e0576ec51dfbeaafc06d3a25ba3bdd755e0c51b1833`.
- Selected from public mainnet block `b8e5423b93f53385414fbd98c43fd6bc2505f699307b7f989109a9dae6082f00`, returned by `https://api.kaspa.org/info/blockdag` and its block endpoint. Ordinary transaction, not coinbase.
- Browser lookup returned the exact ID and provider acceptance **Accepted**.
- Normalized inputs: 59,624,200 sompi; outputs: 59,307,700 sompi; fee: 316,500 sompi. Exact integer subtraction passed. Display: 0.596242 KAS input, 0.593077 KAS output, 0.003165 KAS fee.
- Invalid ID triggered native pattern validation, and the previously loaded result remained visible.
- The UI qualifies acceptance as one provider's observation and does not imply a wallet connection or settlement guarantee.

Evidence: `.cache/v3-inspector-live.json`. No funds, wallet, signing, or submission were involved.

## Deployed V3 verification

Public verification passed at 2026-09-06T18:51:12.704Z, following deployment d1d69ec (run 34052188335). The live Use KAS inspector returned the same exact mainnet transaction, amounts and fee. Invalid ID validation retained the result. Sources page and 2 linked historical PDFs returned HTTP 200. Evidence includes exact checked URLs and content types.

## Independent deployed Testnet-10 audit

At 2026-09-06T18:57:50.630Z, a separate read-only SDK connection to wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh found all 13 public V3 transaction IDs in accepted-chain history. Direct block retrieval independently decoded the creation payload as **Live garden token**, transaction 8b638f40f686704a0a1491d0b9b4b9d39283e6c19194877ccc5fe52d47736b7b. Total recorded fees: 23057400 sompi (0.230574 tKAS). Evidence: .cache/v3-independent-public-audit.json. No keys, signing, or funding used.
