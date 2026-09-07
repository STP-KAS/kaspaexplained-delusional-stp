# Kaspa posts · September 2026

Editorial revision: September 5. Dates below are posting slots, not verification
dates. Whenever a day's post is requested, verify its changing claims against
current primary sources and revise the draft before returning it. If a claim
cannot be verified, flag it or omit it rather than present it as current. Source
lines are editorial notes, not part of the post. Longer posts need an account
that supports them; there is no editorial character quota.

## September 6

```text
If you want to follow DAGKnight, read KIP-2 alongside the implementation work.

The proposal explains the intended consensus design. The code lets you see how that design is being implemented. Neither a proposal nor a development branch tells you which rules mainnet is running.

For that, check releases and activation information too.

$KAS
```

Sources: https://raw.githubusercontent.com/kaspanet/kips/master/kip-0002.md, https://github.com/kaspanet/rusty-kaspa/commit/90e406f8a7c692b171294d8d26b0f83eff530a60, and https://github.com/kaspanet/rusty-kaspa/releases

## September 7

```text
Two honest miners find blocks at almost the same time. Neither has received the other’s block yet. Messages take time to travel.

In Kaspa, a later block can reference both. The parallel blocks become part of the same connected graph.

Consensus determines their order and which transactions are accepted.

$KAS
```

Sources: https://eprint.iacr.org/2018/104 and https://wiki.kaspa.org/en/kaspa. Verified September 7.

## September 8

```text
Spend an output in Kaspa and that output is consumed. So how do you follow a contract when its funds move into a new output?

KIP-20 gives covenants an identifier that valid successors can carry. Software can follow that continuity across transactions.

The spending rules still decide which successors are allowed. The ID is how you recognize the continuing covenant.

$KAS
```

Source: https://github.com/kaspanet/kips/blob/master/kip-0020.md

## September 9

```text
Two Kaspa API servers can give you different block counts without disagreeing about the ledger.

A node can prune old data. Its blockCount may reflect what that backend retains, rather than every block ever produced.

If you’re writing a dashboard, check what the field measures before labeling it “total blocks.”

$KAS
```

Sources: https://api.kaspa.org/info/blockdag and https://github.com/kaspanet/rusty-kaspa/blob/master/rpc/grpc/core/proto/rpc.proto

## September 10

```text
As Kaspa’s subsidy declines, keeping miner revenue steady takes some combination of more fees or a higher KAS price.

Cheaper electricity can help a miner’s profit. It does not replace revenue paid by the network.

At a constant KAS price, each KAS lost from the subsidy would need to be replaced by a KAS in fees to maintain the same network-wide revenue.

$KAS
```

Schedule source: https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/src/processes/coinbase.rs. The economic variables require current market, network, and pool data.

## September 11

```text
Curious how you would write an application for Kaspa? Argent’s examples are a place to look.

The repository includes a language, compiler, and runtime for building transactions, with examples that coordinate multiple contracts.

The README says it is not release-ready and needs more auditing and hardening. Useful code to study and experiment with while that work continues.

$KAS
```

Source: https://github.com/argent-lang/argent

## September 12

```text
Pruning helps a Kaspa node discard old history. New blocks keep arriving.

The node still has to receive, check, order, and store that incoming work. That takes bandwidth, processing power, memory, and database performance.

Disk usage is only part of the answer to “Can I run a node?”

$KAS
```

Sources: https://github.com/kaspanet/rusty-kaspa/releases/tag/v1.0.0 and https://github.com/kaspanet/kips/blob/master/kip-0014.md

## September 13

```text
The Kaspa question I keep coming back to: what will people choose to use it for?

A faster blockDAG and more capable spending rules give developers more to work with. Useful applications also need dependable wallets, understandable interfaces, and reasons for people to come back.

I want to see what people build, what breaks when others try it, and what survives that process.

$KAS
```

Sources: https://github.com/kaspanet/rusty-kaspa/releases/tag/v1.0.0, https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/src/processes/coinbase.rs, https://github.com/kaspanet/silverscript/releases, and https://api.kaspa.org/docs

## September 14

```text
For a more technical look at Kaspa application development, open the vProgs repository.

It covers scheduling transactions, executing programs, and managing state for provable computation. The project describes itself as an early-development prototype.

Read it to understand the design being explored.

$KAS
```

Source: https://github.com/kaspanet/vprogs

## September 15

```text
A vault holds 10,000 KAS. It allows withdrawals of up to 2,000 KAS, with a delay between them.

Someone gets the withdrawal key. Five permitted withdrawals later, the vault is empty. No spending rule was broken.

A withdrawal cap buys time. Keeping a permanent reserve requires another rule.

$KAS
```

Source: https://github.com/kaspanet/kips/blob/master/kip-0017.md

## September 16

```text
A loan can have a valid zero-knowledge proof and still be undercollateralized.

If the proof uses the wrong KAS price, it can correctly verify a calculation built on bad data.

That matters for Kaspa applications using Toccata’s proof-verification features. The network checks the proof. The application still needs a trustworthy source for prices and other outside information.

Before trusting “verified on-chain,” ask what was verified and where the inputs came from.

$KAS
```

Source: https://github.com/kaspanet/kips/blob/master/kip-0016.md

## September 17

```text
Someone posts a Kaspa GitHub link and says “it shipped.” Open the link.

Does it show a proposal, a development branch, a release, or an activation announcement?

Then check the software you use. If the feature needs wallet support, a node release alone won't put it in your wallet.

$KAS
```

Source: https://github.com/kaspanet/rusty-kaspa/releases

## September 18

```text
Kaspa launched on November 7, 2021 without a premine or public presale. There was no official coin allocation for founders, investors, a company, or a foundation. Coins entered circulation through mining.

That answers an important question about the launch. To understand ownership today, you also need to know what happened afterward: mining, buying, and selling.

$KAS
```

Sources: https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/core/src/config/genesis.rs and https://wiki.kaspa.org/en/prehistory

## September 19

```text
How can an application prove a calculation about Kaspa activity without making every node run the whole application?

It needs an agreed record of the activity the calculation used.

KIP-21 groups ordered activity into lanes and records a cryptographic commitment to each. That compact record lets a proof refer to the activity used in a calculation. The application defines what the calculation must prove.

This is one of the less visible pieces behind proof-based applications on Kaspa.

$KAS
```

Source: https://github.com/kaspanet/kips/blob/master/kip-0021.md

## September 20

```text
Kaspa’s subsidy falls in small monthly steps. After twelve steps, the rate is roughly half what it was.

There’s no four-year wait followed by one big cut. Each step follows the network’s progress, tracked by its DAA score. A calendar estimate is not an exact appointment.

$KAS
```

Source: https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/src/processes/coinbase.rs

## September 21

```text
Alice signs a payment to Bob. She signs another to Carol using the same coins.

Both signatures are genuine. Only one payment can spend those coins.

This is why a digital signature alone cannot solve double spending. The network also needs an agreed order for processing transactions.

$KAS
```

Source: https://bitcoin.org/bitcoin.pdf

## September 22

```text
A payment and a transaction carrying a proof both count as “one transaction.” They can ask very different amounts of work from a node.

Kaspa accounts for that work using transaction mass. Size, signatures, scripts, and stored outputs matter.

When you see a TPS comparison, look for the transaction being counted. Without it, you cannot tell whether the numbers are comparable.

$KAS
```

Source: https://github.com/kaspanet/kips/blob/master/kip-0009.md

## September 23

```text
Keeping two blocks does not mean accepting two payments that spend the same money.

Kaspa can retain concurrent blocks, then use the agreed ordering to resolve conflicting transactions inside them.

The blocks remain in the DAG. Only one of the conflicting payments can spend those coins.

$KAS
```

Source: https://eprint.iacr.org/2018/104

## September 24

```text
Trying Silverscript? Start with its testnet guidance before putting real KAS anywhere near an experiment.

The project recommends testnet-10 until stable v1. Its v1-rc1 release is experimental, so expect syntax and APIs to change.

$KAS
```

Source: https://github.com/kaspanet/silverscript/releases/tag/v1-rc1

## September 25

```text
You don’t have to change consensus rules to improve Kaspa compatibility.

Kaspa Compatibility Conventions (KCCs) describe how wallets, tools, and applications can work together. They give developers a shared place to work out how their software should cooperate.

A merged convention does not automatically change wallets. Each project still has to adopt it.

$KAS
```

Sources: https://github.com/kaspanet/kips and https://github.com/kaspanet/kccs

## September 26

```text
Ten times as many Kaspa blocks did not mean ten times as many new coins.

When Crescendo raised the target from one block per second to ten, the scheduled reward was divided among those blocks. Each received roughly a tenth of the previous share.

The small rounding detail: block rewards are rounded up to a whole sompi, the smallest KAS unit.

$KAS
```

Source: https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/src/processes/coinbase.rs

## September 27

```text
What could you actually do with a Kaspa covenant?

Design a vault that limits each withdrawal. Require the money to go to a particular address. Make the next output preserve the same spending rules.

Toccata added the protocol features for rules like these. The wallet or application still has to turn them into something you can use.

$KAS
```

Sources: https://github.com/kaspanet/rusty-kaspa/releases/tag/v2.0.0 and https://api.kaspa.org/info/blockdag

## September 28

```text
Kaspa’s history starts well before its 2021 launch.

The blockDAG research came first. There were venture-backed attempts to commercialize it and earlier launch plans that did not succeed. The public proof-of-work network came later.

That history is worth reading alongside the genesis record. “No premine” describes how the coins started, not how the project started.

$KAS
```

Sources: https://wiki.kaspa.org/en/prehistory and https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/core/src/config/genesis.rs

## September 29

```text
A payment appears in a block. Would you hand over a coffee? A car?

Kaspa targets a block every 100 milliseconds, giving transactions frequent opportunities for inclusion. A receiver can wait for more work to accumulate before accepting a larger payment.

The amount at risk matters. There is no universal number of seconds that makes every payment equally safe.

$KAS
```

Protocol source: https://github.com/kaspanet/kips/blob/master/kip-0014.md. Receiver policy is not a protocol constant.

## September 30

```text
Kaspa’s move from Go to Rust and its move to ten blocks per second were separate changes.

The Rust rewrite supplied the performance and storage foundation. Crescendo later changed the mainnet block target from one per second to ten.

Installing faster software and changing the network’s consensus rules are different steps, even when one makes the other practical.

$KAS
```

Sources: https://github.com/kaspanet/kaspad and https://github.com/kaspanet/rusty-kaspa/releases/tag/v1.0.0
