// Primary sources checked 2026-09-06. Specification status is not network activation.
export const V4_TECHNICAL_SOURCES=Object.freeze({
 hashdag:{label:'Hashdag essays · the author’s design arguments',url:'https://hashd.ag/'},
 kip10:{label:'KIP-10 · transaction fields',url:'https://github.com/kaspanet/kips/blob/master/kip-0010.md'},
 kip17:{label:'KIP-17 · covenant scripting',url:'https://github.com/kaspanet/kips/blob/master/kip-0017.md'},
 kip20:{label:'KIP-20 · covenant IDs',url:'https://github.com/kaspanet/kips/blob/master/kip-0020.md'},
 kip16:{label:'KIP-16 · ZK precompile',url:'https://github.com/kaspanet/kips/blob/master/kip-0016.md'},
 kcc1:{label:'KCC-1 · covenant layout and ABI (draft)',url:'https://github.com/kaspanet/kccs/blob/main/kcc-0001.md'},
 kcc2:{label:'KCC-2 · authority schemes (draft)',url:'https://github.com/kaspanet/kccs/blob/main/kcc-0002.md'},
 kcc20:{label:'KCC-20 · fungible tokens (draft)',url:'https://github.com/kaspanet/kccs/blob/main/kcc-0020.md'},
 silver:{label:'SilverScript · compiler used here',url:'https://github.com/kaspanet/silverscript/tree/c7d17a15ac88610d013ec9ffffa9520aeb69929b'},
 argent:{label:'Argent · experimental actor language',url:'https://github.com/argent-lang/argent/tree/d08e52dd1e18c9f7e9a2dc482048c2db31d25611'},
 dag:{label:'Rusty Kaspa · node implementation',url:'https://github.com/kaspanet/rusty-kaspa'}
});
export const V4_TECHNICAL_COMMON=Object.freeze({
 checked:'2026-09-06',
 toolchain:'These Testnet contracts are written in SilverScript and compiled to Kaspa Script. The node checks each spend.',
 covenant:'Each contract carries state in a spendable output. Its script restricts the next outputs; its covenant ID preserves the lineage.',
 argent:'The guided route uses hand-written SilverScript. The optional care workshop uses two Argent-generated actor apps, checked together in the local script VM. Live Testnet acceptance of that app pair has not yet been verified.',
 zk:'This world does not generate or verify ZK proofs. KIP-16 describes a separate proof-verification opcode.',
 conventions:'KCCs are application conventions, separate from consensus KIPs. No KCC-1, KCC-2 or KCC-20 conformance is claimed for these custom world contracts.',
 dag:'The world’s blocks and parent links come from the connected node. Their positions are illustrative. A parcel enters a block only after the node reports its transaction accepted.',
 sources:['silver','argent','kip10','kip17','kip20','dag'],
 relatedSources:['kip16','kcc1','kcc2','kcc20']
});
export const V4_TECHNICAL_MAP=Object.freeze({
 terrarium:{title:'A creature with enforceable moves',mechanism:'One state output becomes the next. The contract permits one adjacent square in a 3×3 grid and spends one energy.',enforced:'Owner signature, position bounds, one-step movement, energy decrease and fee cap.',boundary:'Creature animation, feeding and the wider ecosystem are a model.',contract:'contracts/public/v4-terrarium.sil',sources:['kip10','kip17','kip20','silver']},
 agent:{title:'A robot with a spending policy',mechanism:'The spending key can pay only the configured recipient, within the cap. A separate recovery key can revoke the budget.',enforced:'Payment destination, amount cap, preserved policy and a bounded fee. The market route also checks the configured market covenant ID.',boundary:'The robot is a visual role for a key and policy; autonomous intelligence is not enforced by consensus.',contract:'contracts/public/v4-agent.sil',sources:['kip10','kip17','kip20','silver'],relatedSources:['argent','kcc2']},
 market:{title:'One transaction closes the whole deal',mechanism:'Three assets change owners while the robot budget pays the seller. Both covenant groups check the same transaction.',enforced:'All three assets, buyer ownership, exact seller payment, budget policy and output bindings.',boundary:'These are custom asset vouchers. They do not claim KCC-20 fungible-token compatibility or Argent ICC execution.',contract:'contracts/public/v4-bundle.sil',additionalContracts:['contracts/public/v4-agent.sil'],sources:['kip10','kip17','kip20','silver'],relatedSources:['argent','kcc1','kcc20']},
 coordination:{title:'Three pledges, one release',mechanism:'Each account marks its pledge ready. All three ready outputs must then be spent together to pay the beneficiary.',enforced:'Three distinct owners, all readiness flags, member identities, destination and fee cap.',boundary:'The accounts are local demo keys. This does not establish three independent people or an external project outcome.',contract:'contracts/public/v4-launch.sil',sources:['kip10','kip17','kip20','silver']},
 computation:{title:'Find a schedule; the contract checks it',mechanism:'The browser searches assignments. The contract checks three distinct workers, a cost within the configured ceiling and the exact worker payment.',enforced:'The submitted assignment and reward are checked directly in Kaspa Script.',boundary:'This is a small transparent computation, with no ZK proof, oracle or general compute marketplace.',contract:'contracts/public/v4-compute.sil',sources:['kip10','kip17','kip20','silver'],relatedSources:['kip16']}
});
export function getV4TechnicalMap(kind){return V4_TECHNICAL_MAP[({bundle:'market',composed:'market',launch:'coordination',compute:'computation'}[kind]||kind)]||null;}

// Optional story explanations. These add no transactions or mining activity.
export const V4_WORLD_NETWORK=Object.freeze({
 title:'Why this town uses a shared network',
 line:'Pip, the seller and the backers need rules that none of them can change alone.',
 custody:Object.freeze({title:'A game operator could run this town.',line:'Here the question is who must be trusted with the coins and the deal.',detail:'A central server could reproduce the game. Kaspa gives this implementation shared spending rules and independently held keys, so the seller, robot or operator cannot authorize a spend that violates those rules. Other systems can pursue similar properties; this is not a claim that only Kaspa can build a town.',sources:['kip17','kip20']}),
 pow:Object.freeze({title:'Why proof of work?',line:'A miner commits to a candidate block before finding its winning proof.',detail:'Hashdag describes this as write-then-select: the block contents are committed by the header being hashed. Open competition for valid work avoids a protocol-appointed writer for each turn. A miner still chooses transactions and may withhold a block; this does not eliminate censorship or MEV. Security also depends on the honest-hashpower and network assumptions, not just electricity being spent.',sources:['hashdag','dag']}),
 realtime:Object.freeze({title:'Fast feedback from an open mining contest.',line:'More block events can sample the mining majority over a shorter interval.',detail:'Hashdag calls the aim real-time decentralization: bringing permissionless agreement closer to network timescales. Under a fixed minority-hashpower assumption, more samples can strengthen evidence sooner, subject to propagation and protocol rules. A short interval can still contain an adversarial majority. Increasing block frequency does not by itself make a rentable-majority attack cost more per hour. This screen shows connected-node observations, not a universal finality clock.',sources:['hashdag','dag']}),
 verification:Object.freeze({title:'Pip can check rules, not read minds.',line:'A full node checks signatures, work, ordering and valid state changes.',detail:'This browser asks a connected node and is not running a full node. A separately operated node can independently verify the network rules instead of relying only on a hosted service. An accepted pledge proves the contract’s readiness state, not a real delivery; an accepted schedule proves the checked numbers, not arbitrary outside truth. You control every role’s test key in this tour.',sources:['dag','kip17']}),
 participation:Object.freeze({title:'You can participate beyond the game.',line:'Running a node and mining do different jobs.',detail:'A separately run full node checks the rules and can serve applications. A miner uses separate mining software and suitable hardware to compete for valid proof of work. This page does neither and does not earn mining rewards. Hardware, operating costs, connectivity and mining concentration still matter; no device suitability or profitability is promised. The network should remain usable without permission from this site or its author.',sources:['hashdag','dag']}),
 readingNote:'The Hashdag essays explain design motivations and threat models. Historical proposals and target dates are not evidence of current network activation.'
});


export const V4_NETWORK_SCENES=Object.freeze({
 custody:{speaker:'Pip',question:'Could the town operator simply change who owns the parts?',action:'Ask who can change the deal',reply:'The operator can change this game’s display, but cannot make a node accept an unauthorized spend of your keys’ outputs. A central server could run the game; shared enforcement is the reason this version uses Kaspa.'},
 pow:{speaker:'Supplier',question:'Who gets to decide which payment is real?',action:'Follow a sealed candidate',reply:'Miners commit to candidate contents before finding a winning proof of work. Independent nodes still check the rules. Try changing a sealed payment in the local work model: the old toy receipt no longer matches. This does not mine a real block.'},
 realtime:{speaker:'Pip',question:'Must the shop stand still while everyone agrees?',action:'Watch the observed block web',reply:'Kaspa’s design aims for permissionless agreement close to network timescales. More work events can sample the mining majority sooner under the stated assumptions. First feedback is useful, but one observed block is not an unconditional finality guarantee.'},
 verification:{speaker:'Third backer',question:'The app says everyone is ready. Who checks that?',action:'Ask what a node proves',reply:'A node checks the signed readiness states and release rule. It does not prove delivery or anyone’s intentions. This browser asks a connected node; running a separate node can give you an independent check. You control all three demo accounts here.'},
 participation:{speaker:'Moss',question:'Can I help the network instead of only using the town?',action:'Compare running a node and mining',reply:'A separate node checks network rules. Separate mining software and hardware compete to produce valid work. The local mining workshop illustrates that competition; neither it nor this browser runs a full node, mines Kaspa or earns rewards.'}
});
