# Full reading: supplied hashdag essay collection

Read September 6, 2026. Entire supplied collection, lines 1–1306, including
the historical proposals, footnotes, governance essays, and philosophical
fragments. The long output around lines 768–917 was reread separately after
truncation. Public origin located at https://hashd.ag/; Project Staghunt PDF
is https://hashd.ag/project-staghunt-six-pager.pdf.

This is a reading and argument map. A founder's argument is evidence of his
reasoning, not by itself a proof, a current protocol specification, or a
verified deployment. Historical prices, hashrate shares and target dates must
not be republished as current measurements.

## Central correction to the site

The current site explains parallel blocks, payment bookkeeping, and generic
risks but understates why those mechanisms were pursued. The source's central
project is permissionless, sovereign money operating on Internet timescales,
with an application environment that makes the decentralization useful.
Speed is a property of that design, not an independent scoreboard. A DAG is
the concurrency problem's representation; the ordering protocol is the
solution. Preserve the honest-majority and network assumptions when explaining
the gain. Do not substitute enthusiasm for this causal explanation.

## Argument map and implications

### Staghunt and the Oxford address (1–311)

Distinguish a prisoner's dilemma (profitable unilateral defection) from a
stag hunt (cooperation stable once reached, but moving alone is risky).
Better communication cannot itself bind actions. Assurance contracts express
conditional commitments: act only if a sufficiently large compatible group
acts. Participants may have different thresholds. The mechanism looks for a
subset whose members' conditions are jointly satisfied, rather than merely
counting everyone or using one common threshold.

The proposed system requires coordinated atomicity, opaque accumulation,
capital multiplexing, and composability. Multiplexing means the same capital
can support mutually exclusive intentions until one executes; it does not
allow the capital to be spent twice. Commitments can be withdrawn before
activation in the described design. Opacity protects even the initial signal
of willingness, not merely transaction values. It also makes ordinary social
proof and progress counters inappropriate. Designated-verifier proofs are
proposed to permit selective, deniable communication; do not call them
literally unleakable. Continuous solver computation, its payment mechanism,
encrypted evaluation and the formation/execution gap remain engineering work.

The ambition is voluntary association without a central coordinator, including
liquidity migration and platform bootstrapping. It is not simply crowdfunding,
another prediction market, or a current native Kaspa feature. A public
demonstration can show mutually conditional action, but must not pretend a
transparent fixed-threshold contract implements private Staghunt. Political
examples illustrate the author's philosophy; they need not become the site's
editorial agenda.

### February 2026: RTD, architecture and purpose (312–575)

Fair-launch funding and ambitious research create a practical tension:
responsibility must be taken without a central owner guaranteeing success.
Research, implementation, sustainable development funding and products are
connected. Generic cloned products do not establish Kaspa's distinctive use.

Real-time decentralization (RTD) is the proposed distillation: rapid sampling
of the honest mining majority, bringing censorship resistance and consensus
closer to network timescales. It is more than a fast receipt. A short window
can still contain a malicious sample majority; probability depends on mining
share, window length, block rate and propagation. The exponential sampling
claim must not become a universal finality formula.

The text distinguishes PoW's write-then-select from PoS's select-then-write
optionality. Explain the cryptographic commitment to content before finding
a winning proof, and what discretion remains; do not infer absence of MEV or
that every possible PoS construction has identical behavior.

GHOSTDAG uses a predetermined latency bound, and increasing block rate can
increase its confirmation penalty. DAGKNIGHT's prospective distinction is
responsiveness without that fixed latency parameter while retaining a
sub-half adversarial threshold in its model. Partial synchrony protects
safety for previously confirmed transactions under the stated conditions;
it does not guarantee progress during a network partition. The essay's
Q3 2026/2027 targets are dated ambitions, not evidence of activation.

Covenants supply spending restrictions and bounded, loop-free computation.
They enable useful native assets, wallets, vaults and proof verification,
but do not themselves provide a shared-state DeFi environment. The intended
scaling direction separates execution from verification while preserving
cohesive application composability and shared asset use. vProgs and proposed
enshrinement must be described according to actual current evidence.

The optional miner-oracle/TangVM proposals rely on external-world agreement,
an execution scheduler, advance bidding, and triggered state transitions.
They are application research, not facts that PoW validates arbitrary outside
events or that a contract autonomously wakes up. The essay embeds an LLM
verdict about no-slashing security: this is not an independent proof. The
honest-consensus assumption does not automatically justify every external
oracle incentive and input model.

### April 2025 identity and governance (602–698)

A central brand headquarters can become a social gatekeeper even with
well-intentioned maintainers. Decentralization includes the social graph and
credible independence from particular personalities, not only protocol
mechanics. Disagreement, independent builders and users who distrust the
founder should be compatible with participation. The author explicitly
credits Ethereum and distinguishes social concentration from an empty
binary label of centralization.

Implication: the site should articulate and test Yonatan's arguments while
remaining visibly independent. Do not impersonate him, imply endorsement,
make him an infallible authority, or turn the site into official headquarters.

### May 2021: syncing and historical verification (699–767)

The author's optimization target is current consensus agreement and useful
money, not requiring every new participant to replay all old transactions.
Pruning, proof of work, and UTXO commitments address different tasks. A
commitment authenticates a supplied state against an agreed header; it does
not independently prove every historical transition was valid. Historical
auditability and protecting users against current invalid spends must remain
distinct. Today's precise pruning/sync implementation needs current code
verification; this prelaunch SPV description is not automatically current.

Trust-minimizing infrastructure does not require ordinary people to distrust
every service or personally audit everything. Full nodes and independent
observers matter, but node count alone is not a complete sovereignty metric.
The essay's political and normative judgments should remain attributable.

### December 2020 confirmation and mining (768–868)

This is a major missing explanation. Two confirmation threat models differ:
under a defensible fixed minority-hashpower assumption, additional block
events provide additional evidence against a competing history; with readily
rentable majority hashpower, merely increasing event frequency does not
increase the rental cost per hour or exhaust an attack budget faster.

Specialized capital, market illiquidity, manufacturing/procurement delays,
opportunity costs and ongoing expenditure all belong in the economic
discussion. The essay argues committed CapEx supports the honest-majority
assumption and that electricity consumption alone is an inadequate model.
It does not prove installed hardware value is a guaranteed attack cost or
that ASICs eliminate rental markets, capture, theft, financing or censorship.

Separate the macroeconomic argument for an honest majority from the protocol
proof that assumes it. Byzantine adversaries in such proofs are not merely
profit maximizers. Zero ongoing work versus arbitrarily small positive work
is an important conceptual distinction in the author's argument, not an
invitation to describe PoS simply as costless or unsupported.

First inclusion matters in ordinary UX even when the recipient's release
policy waits longer. A coffee, a known counterparty, a shipment delivered
later, and an exchange withdrawal need not have one confirmation policy.
Fast feedback should not be dismissed because it is not absolute finality.
The text also argues valid nonconflicting DAG transactions can survive
ordering differences. This needs precise current validity/dependency scope,
not a promise that every observed transaction is forever accepted.

### Historical launch proposals and origins (869–957, 1125–1280)

Early documents describe plans that were subsequently abandoned or changed:
ASIC presales, hashrate-triggered scarcity and deliberately random gamenet
rewards. Do not conflate these proposals with the eventual no-premine/no-token-
presale launch. Explain actual launch facts, early mining advantages, the
November incident, rebasing and later monetary-rule changes with dates and
primary evidence. A polished retrospective myth would contradict this source.

GHOST is not GHOSTDAG. A graph alone does not confer safety; ordering and
reward rules determine it. PHANTOM generalizes longest-chain reasoning, while
GHOSTDAG is a practical approximation, not the exact computationally difficult
optimization. Faster blocks can reduce reward variance and propagation-based
advantages without guaranteeing egalitarian mining outcomes.

### March 2020 composability (958–1040)

Reusing code or calling open APIs is not the distinctive DeFi property.
Synchronous access to shared state permits an atomic bundle of state changes:
all succeed or all fail. Cross-zone messages and independent settlement
introduce intermediate states, delay and assumptions. Show this difference
with an actual all-or-nothing transaction. The historical predictions about
Ethereum fragmentation are arguments, not settled facts about today's market.

### 2023 ASIC/optical PoW and 2022 DAGKNIGHT/funding (1041–1124)

Permissionless entry and the absence of protocol-amplified concentration
matter more than making a hashrate pie chart look equal. Capital barriers
still exist. The CapEx-heavy argument explains why ASIC maturity can be part
of the intended design rather than a betrayal of it. Optical PoW is a
researched direction, not a claim that existing Kaspa ASICs use photons or
that the network consumes negligible energy. The historical NiceHash share
is obsolete as a current measurement.

DAGKNIGHT scalability includes header/reference growth and propagation costs;
increasing BPS indefinitely is not free. Flexcaps and stealth transactions
were possibilities, not released features. Development grants and businesses
funding an open kernel are proposed sustainability routes, without an assured
central roadmap.

### Poetry and final cultural fragments (577–601, 1281–1306)

Read in full. They supply personality, philosophical context and a critique
of trust-hostile culture. They are not technical protocol claims. The useful
product consequence is legibility to ordinary people, voluntary cooperation,
and trust boundaries people can actually use. Copying the political rhetoric
or poem would not improve an independent Kaspa explanation.

## Concrete redesign directions

1. Lead with rapid permissionless consensus and explain its consequences.
2. Replace a generic PoW definition with content commitment, open competition,
   majority sampling, and the relevant economic assumptions.
3. Add a threat-model experiment: fixed minority race versus rentable majority,
   with block rate and elapsed time visibly doing different jobs.
4. Make GHOSTDAG versus DAGKNIGHT a causal latency/safety explanation with dated
   availability, rather than another speed roadmap.
5. Explain pruning as an explicit verification tradeoff with current mechanics.
6. Connect UTXO covenants, atomic transactions and future shared-state execution
   without conflating them.
7. Add conditional-coordination education that makes the lone-mover problem
   visible, and label missing opacity/solver guarantees precisely.
8. Keep useful first-feedback UX, meaningful recovery and human-readable
   transaction effects; do not force ordinary visitors to become cryptographers.
9. Explain social independence, actual launch history and development funding
   without claiming the founder owns or guarantees the network.
10. Preserve approachable entrances but make depth accessible throughout the
    site's copy, visual models, applications and source links.
