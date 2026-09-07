// Twenty story steps; nineteen signed transactions and one local rejected request.
// Fictional motives do not change contract capabilities. This wallet controls every demo key.
export const V4_LIVE_ROLES=Object.freeze({Main:'You · seller, budget recovery and project beneficiary',Second:'Pip · your robot, buyer and paid worker',Third:'Third backer',explanation:'You control all three accounts in this test wallet. tKAS are test coins. The story gives the accounts different roles.'});
export const V4_LIVE_PURPOSE=Object.freeze({title:'Direct Pip, your robot, and supply Sprout’s habitat.',line:'You direct Pip, your robot helper, as it trades and organizes the greenhouse. Suppliers, backers and workers want their own guarantees. Help them agree on rules they can enforce, then bring the harvest to Sprout.',boundary:'Testnet checks signed coin transfers and contract states. Parts, buildings, food and production are game rules. Neither a payment nor an approval proves a physical delivery or an honest person.'});
export const V4_LIVE_STORY=Object.freeze([
  {
    "id": "shop",
    "kind": "market",
    "title": "Your robot Pip needs parts.",
    "line": "You direct Pip, the robot helping build Sprout’s greenhouse. First, play the supplier: put three parts up for sale from your account. Pip will buy them from its separate purse.",
    "button": "Put the parts up for sale",
    "networkKey": "custody",
    "chapterName": "Trade",
    "objective": "Get the greenhouse’s parts ready.",
    "connection": "The greenhouse cannot start without all three parts.",
    "dialogue": {
      "speaker": "You · supplier",
      "line": "I have all three parts. How do I know Pip will pay?"
    },
    "contract": "contracts/public/v4-bundle.sil",
    "expected": {
      "kind": "bundle",
      "operation": null,
      "accepted": true
    },
    "why": "You control every test-wallet role, including the supplier. This setup creates three custom sale vouchers with refundable deposits. Their covenant enforces the sale; greenhouse parts are the game’s interpretation.",
    "effect": {
      "attempt": "Put all three parts under the sale agreement",
      "after": "Three parts are available under the sale rule",
      "next": "Give Pip a purse to buy the parts"
    },
    "resultTitle": "The three parts are up for sale."
  },
  {
    "id": "budget",
    "kind": "agent",
    "title": "Give Pip room to act, with a clear limit.",
    "line": "Give Pip a separate purse for the shopping trip. You will direct its payments, but its key can pay only your supplier account, up to 0.05 tKAS each time. Your recovery key can return unused coins.",
    "button": "Give Pip a limited purse",
    "networkKey": null,
    "chapterName": "Trade",
    "objective": "Let Pip buy supplies safely.",
    "connection": "Pip can pay the supplier, but each purchase must stay within your limit.",
    "dialogue": {
      "speaker": "Pip",
      "line": "Let me handle the shopping. You can keep the recovery key."
    },
    "challenge": {
      "label": "Give Pip the whole wallet?",
      "reply": "That would give Pip powers this shopping trip does not need. A restricted purse lets it act within your agreement while you retain a separate recovery key.",
      "localOnly": true
    },
    "contract": "contracts/public/v4-agent.sil",
    "expected": {
      "kind": "agent",
      "operation": null,
      "accepted": true
    },
    "why": "Pip may ask for more or send misleading messages. Its key still cannot override the spending policy. Your recovery key has a separate power to close the budget.",
    "effect": {
      "attempt": "Lock a capped spending purse for Pip",
      "after": "Pip can pay the named supplier within its cap",
      "next": "Try a request that breaks the cap"
    },
    "resultTitle": "Pip has its own limited purse."
  },
  {
    "id": "overspend",
    "kind": "agent",
    "title": "Pip asks for more than you agreed.",
    "line": "Pip asks to pay 0.10 tKAS, twice its 0.05 tKAS cap. Try the request. The app will stop it before signing; this attempt costs no fee.",
    "button": "Try Pip’s oversized request",
    "networkKey": null,
    "chapterName": "Trade",
    "objective": "Keep control of the shopping money.",
    "connection": "A request from Pip is not permission to ignore your limit.",
    "dialogue": {
      "speaker": "Pip",
      "line": "The supplier is in a hurry. Can I spend twice the limit just this once?"
    },
    "contract": "contracts/public/v4-agent.sil",
    "expected": {
      "kind": "agent",
      "operation": null,
      "accepted": false,
      "localReject": true
    },
    "why": "This click demonstrates the app’s precheck. It does not submit an invalid transaction to the node.",
    "action": "request",
    "choice": {
      "id": "Pip",
      "amount": 8
    },
    "effect": {
      "attempt": "Ask to spend twice the cap",
      "after": "The app rejects the request before signing",
      "next": "Make a payment that fits the agreement"
    },
    "resultTitle": "The oversized request was stopped."
  },
  {
    "id": "pay",
    "kind": "agent",
    "title": "The supplier wants proof of payment.",
    "line": "Send the supplier a 0.05 tKAS preparation payment from Pip’s purse. Check the node’s acceptance report. This payment prepares the order; buying the parts is a separate exchange next.",
    "button": "Ask Pip to pay the supplier",
    "networkKey": "pow",
    "chapterName": "Trade",
    "objective": "Start the shopping trip within the rule.",
    "connection": "The supplier receives this payment; Pip still has money for the complete parts set.",
    "dialogue": {
      "speaker": "You · supplier",
      "line": "“Payment sent” is easy to say. Show me the transaction."
    },
    "challenge": {
      "label": "Accept Pip’s “paid” message?",
      "reply": "A message cannot establish payment. Inspect the signed transaction and the connected node’s acceptance report. This browser still depends on that node; a separate full node can check independently.",
      "localOnly": true
    },
    "contract": "contracts/public/v4-agent.sil",
    "expected": {
      "kind": "agent",
      "operation": 0,
      "accepted": true
    },
    "why": "Pip cannot use its spending key to change the recipient or lift its cap. The connected node checks the signature and continuing budget; this browser is not itself a full node.",
    "effect": {
      "attempt": "Pay the supplier within the cap",
      "after": "Supplier receives 0.05 tKAS; Pip keeps the remainder",
      "next": "Exchange the complete parts set and payment"
    },
    "resultTitle": "Pip paid within the limit."
  },
  {
    "id": "buy",
    "kind": "market",
    "title": "“Pay first.” “Parts first.”",
    "line": "Exchange another 0.05 tKAS from Pip’s purse for all three parts vouchers. Payment and ownership must change together, so neither side has to go first.",
    "button": "Buy the parts with Pip",
    "networkKey": "realtime",
    "chapterName": "Trade",
    "objective": "Supply the greenhouse.",
    "connection": "The town can now count these three parts toward construction.",
    "consequence": "The town can now count these three parts toward construction.",
    "dialogue": {
      "speaker": "Pip",
      "line": "I want the parts. You want payment. Let us make both happen together."
    },
    "challenge": {
      "label": "Ask Pip to pay first?",
      "reply": "Pip refuses: the supplier might keep both the coins and the parts. The supplier faces the opposite risk. Atomic exchange makes the on-chain payment and voucher ownership change together or not at all.",
      "localOnly": true
    },
    "contract": "contracts/public/v4-bundle.sil",
    "expected": {
      "kind": "composed",
      "operation": 1,
      "accepted": true
    },
    "why": "The seller must not keep both the payment and the parts, and Pip must not take the parts without paying. All asset rules and the budget rule check the same transaction: the complete deal passes or none of it does.",
    "additionalContracts": [
      "contracts/public/v4-agent.sil"
    ],
    "effect": {
      "attempt": "Exchange all three parts and seller payment together",
      "after": "Pip owns all three vouchers; seller receives 0.05 tKAS",
      "next": "Return the refundable deposits from the finished sale"
    },
    "resultTitle": "Pip got the parts. The supplier got paid."
  },
  {
    "id": "parts-refund",
    "kind": "market",
    "title": "The deal is done. Free Pip’s deposits.",
    "line": "The parts are bought. Close their sale vouchers to return the locked deposits to Pip. The greenhouse keeps the parts in its game inventory.",
    "button": "Return the parts’ deposits",
    "networkKey": null,
    "chapterName": "Trade",
    "objective": "Free coins no longer needed for shopping.",
    "connection": "Closing the vouchers releases their deposits. The game’s acquired parts remain available for the greenhouse.",
    "consequence": "Closing the vouchers releases their deposits. The game’s acquired parts remain available for the greenhouse.",
    "contract": "contracts/public/v4-bundle.sil",
    "expected": {
      "kind": "bundle",
      "operation": 2,
      "accepted": true
    },
    "why": "The current owner retires the on-chain vouchers and releases their deposits. Retaining purchased parts afterward is a separate game-inventory rule, not continuing ownership of retired on-chain assets.",
    "dialogue": {
      "speaker": "Pip",
      "line": "The purchase is finished. I do not need to leave these coins locked up."
    },
    "effect": {
      "attempt": "Finish the sale and free Pip’s deposits",
      "after": "Their remaining deposits return to Pip",
      "next": "Close Pip’s unused shopping purse"
    },
    "resultTitle": "Pip’s parts deposits are back."
  },
  {
    "id": "recover",
    "kind": "agent",
    "title": "Pip’s shopping access can end.",
    "line": "Shopping is finished. Use your recovery key to return Pip’s unused purse to your account and end its spending access.",
    "button": "Bring the spare coins home",
    "networkKey": null,
    "chapterName": "Trade",
    "objective": "Finish the shopping trip.",
    "connection": "Your recovery key closes the purse; Pip does not need continuing access to those coins.",
    "contract": "contracts/public/v4-agent.sil",
    "expected": {
      "kind": "agent",
      "operation": 1,
      "accepted": true
    },
    "why": "Recovery uses a separate key. Pip’s spending key cannot invoke this route.",
    "action": "revoke",
    "dialogue": {
      "speaker": "Pip",
      "line": "I have what we need. You can close my shopping purse now."
    },
    "effect": {
      "attempt": "Use your recovery key to close the purse",
      "after": "The remaining purse returns to your account",
      "next": "Visit Sprout and see its energy reserve"
    },
    "resultTitle": "Pip’s purse is closed. Spare coins are home."
  },
  {
    "id": "habitat",
    "kind": "terrarium",
    "title": "Sprout cannot live on promises.",
    "line": "Test a movement rule: each accepted move keeps Sprout’s identity, changes one adjacent square and spends one energy. Three steps use the reserve; then close the session and return its deposit.",
    "button": "Start Sprout’s visit",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "See the habitat’s need for supplies.",
    "connection": "Each permitted step uses one energy. A dependable food supply is the town’s larger goal.",
    "contract": "contracts/public/v4-terrarium.sil",
    "expected": {
      "kind": "terrarium",
      "operation": null,
      "accepted": true
    },
    "why": "A state output records position and energy. Its covenant restricts which successor may replace it.",
    "dialogue": {
      "speaker": "Sprout",
      "line": "People keep promising food. When will the greenhouse actually be ready?"
    },
    "effect": {
      "attempt": "Fund Sprout’s movement session",
      "after": "Sprout starts at square 1,1 with three energy",
      "next": "Walk toward the greenhouse site"
    },
    "resultTitle": "Sprout’s movement session is open."
  },
  {
    "id": "move-1",
    "kind": "terrarium",
    "title": "Follow Sprout toward the site.",
    "line": "Take the first of three steps. Once the node accepts the move, Sprout changes square and its energy falls from three to two. Then continue to step two.",
    "button": "Move Sprout · step 1 of 3",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "Help Sprout move safely.",
    "connection": "The next position must be adjacent to the last one.",
    "dialogue": {
      "speaker": "Sprout",
      "line": "Come along. I can show you where we need the greenhouse."
    },
    "contract": "contracts/public/v4-terrarium.sil",
    "expected": {
      "kind": "terrarium",
      "operation": 0,
      "accepted": true
    },
    "why": "The node checks adjacency, grid bounds, identity and the exact energy decrease.",
    "effect": {
      "attempt": "Move one adjacent square",
      "after": "Step 1 of 3 complete; Sprout has two energy left",
      "next": "Keep walking toward the site"
    },
    "resultTitle": "Step 1 of 3 complete. Two energy left."
  },
  {
    "id": "move-2",
    "kind": "terrarium",
    "title": "The old energy cannot be spent twice.",
    "line": "Take the second of three steps. Once accepted, Sprout changes square and its energy falls from two to one. The earlier state cannot be reused to restore spent energy.",
    "button": "Move Sprout · step 2 of 3",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "Notice the approaching shortage.",
    "connection": "The same movement rule follows Sprout into its next state.",
    "contract": "contracts/public/v4-terrarium.sil",
    "expected": {
      "kind": "terrarium",
      "operation": 0,
      "accepted": true
    },
    "why": "KIP-10 gives the script transaction fields to inspect. KIP-17 supplies the covenant restrictions, and KIP-20 preserves the covenant identity as position and energy change.",
    "dialogue": {
      "speaker": "Sprout",
      "line": "One energy left. We should get the backers together."
    },
    "effect": {
      "attempt": "Spend the next movement state",
      "after": "Step 2 of 3 complete; Sprout has one energy left",
      "next": "Use the last energy of this visit"
    },
    "resultTitle": "Step 2 of 3 complete. One energy left."
  },
  {
    "id": "move-3",
    "kind": "terrarium",
    "title": "Sprout has reached its limit.",
    "line": "Take the third and final step. Once accepted, Sprout has zero energy and this walk is finished. Return the visit’s deposit next, then help Pip fund the greenhouse.",
    "button": "Move Sprout · step 3 of 3",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "Turn the shortage into a building goal.",
    "connection": "The greenhouse is the town’s supply project. It does not automatically refill this completed on-chain movement state.",
    "consequence": "The greenhouse is the town’s supply project. It does not automatically refill this completed on-chain movement state.",
    "dialogue": {
      "speaker": "Sprout",
      "line": "I cannot go farther on this reserve. The town needs a food supply."
    },
    "contract": "contracts/public/v4-terrarium.sil",
    "expected": {
      "kind": "terrarium",
      "operation": 0,
      "accepted": true
    },
    "why": "Every spend must satisfy the current state. An earlier state cannot be spent again.",
    "effect": {
      "attempt": "Take the last permitted step",
      "after": "Sprout has zero energy in this movement session",
      "next": "Close the visit and organize the backers"
    },
    "resultTitle": "Step 3 of 3 complete. The walk is finished."
  },
  {
    "id": "habitat-refund",
    "kind": "terrarium",
    "title": "Close the visit and keep moving.",
    "line": "The three-step walk is finished. Return its remaining deposit to your account. Sprout stays in town; the greenhouse’s backers come next.",
    "button": "Return Sprout’s deposit",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "Free the deposit for the next part of the project.",
    "connection": "Closing this movement session returns its remaining test coins; it does not restore its energy.",
    "contract": "contracts/public/v4-terrarium.sil",
    "expected": {
      "kind": "terrarium",
      "operation": 1,
      "accepted": true
    },
    "why": "The contract has an owner-signed exit. Closing the state releases the remaining value.",
    "dialogue": {
      "speaker": "Pip",
      "line": "We can finish this agreement and use the spare coins elsewhere."
    },
    "effect": {
      "attempt": "Close the movement session",
      "after": "The remaining deposit returns; energy is not refilled",
      "next": "Create three conditional project pledges"
    },
    "resultTitle": "Sprout’s visit is closed. Deposit returned."
  },
  {
    "id": "factory",
    "kind": "coordination",
    "title": "No backer wants to pay alone.",
    "line": "The parts are ready. You, Pip and a third backer will fund the greenhouse together. Lock three separate pledges now; each backer must approve before the money can leave.",
    "button": "Bring the backers together",
    "networkKey": null,
    "chapterName": "Build",
    "objective": "Bring the greenhouse’s backers together.",
    "connection": "The project must wait until all three contributions are ready.",
    "dialogue": {
      "speaker": "Third backer",
      "line": "I will join a complete project. I will not hand over my money and hope the others follow."
    },
    "challenge": {
      "label": "Let one backer pay now?",
      "reply": "The project could take that contribution while everyone else walks away. Keep each pledge under its rule until all three ready contributions can release together.",
      "localOnly": true
    },
    "contract": "contracts/public/v4-launch.sil",
    "expected": {
      "kind": "launch",
      "operation": null,
      "accepted": true
    },
    "why": "A beneficiary must not collect early just because two backers agree. Each key controls a separate pledge; release requires all three ready states. You control all three test keys here.",
    "effect": {
      "attempt": "Create three separate project pledges",
      "after": "All three deposits are locked; none is ready",
      "next": "Each backer must sign before the pool can release"
    },
    "resultTitle": "Three pledges are locked. Approvals come next."
  },
  {
    "id": "approve-main",
    "kind": "coordination",
    "title": "Your pledge is ready. The pool still waits.",
    "line": "Approve your own pledge. That makes one of three backers ready. All the money stays locked until Pip and the third backer approve too.",
    "button": "Approve your contribution",
    "networkKey": null,
    "chapterName": "Build",
    "objective": "Add the first commitment.",
    "connection": "One of three backers is ready. The money still waits.",
    "contract": "contracts/public/v4-launch.sil",
    "expected": {
      "kind": "launch",
      "operation": 0,
      "accepted": true
    },
    "why": "Only this pledge’s owner may sign its readiness change.",
    "dialogue": {
      "speaker": "Pip",
      "line": "One commitment helps, but it is not permission to take the whole pool."
    },
    "challenge": {
      "label": "Let the beneficiary collect now?",
      "reply": "The first approval does not unlock the pool. The release requires all three distinct ready pledges and the agreed beneficiary. This question changes no transaction.",
      "localOnly": true
    },
    "effect": {
      "attempt": "Sign your pledge’s readiness",
      "after": "Your pledge is ready; two signatures are still needed",
      "next": "Get Pip’s approval; the whole pool remains locked"
    },
    "resultTitle": "The first pledge is ready."
  },
  {
    "id": "approve-pip",
    "kind": "coordination",
    "title": "Pip joins. Two signatures are not three.",
    "line": "Approve Pip’s pledge with Pip’s key. Two of three backers are now ready; the third backer still controls the last decision. The money stays locked.",
    "button": "Let Pip approve its pledge",
    "networkKey": null,
    "chapterName": "Build",
    "objective": "Add the second commitment.",
    "connection": "Two of three backers are ready. One decision remains.",
    "dialogue": {
      "speaker": "Pip",
      "line": "I brought the parts and I will back the build. The last pledge is still someone else’s decision."
    },
    "contract": "contracts/public/v4-launch.sil",
    "expected": {
      "kind": "launch",
      "operation": 0,
      "accepted": true
    },
    "why": "The release rule requires three distinct owners and all three readiness flags.",
    "challenge": {
      "label": "Sign for the third backer?",
      "reply": "Pip’s key cannot approve the third pledge. That owner must authorize its own readiness change. You control all three demo accounts, but their contract permissions remain separate.",
      "localOnly": true
    },
    "effect": {
      "attempt": "Sign Pip’s pledge only",
      "after": "Two pledges are ready; the third still waits",
      "next": "Get the third backer’s own approval"
    },
    "resultTitle": "Pip’s pledge is ready."
  },
  {
    "id": "approve-third",
    "kind": "coordination",
    "title": "The last backer wants the delivery ready.",
    "line": "The last backer wants the parts delivery ready. If the game shows a shortage, restore it first. Then approve the third pledge. This approval makes the pool ready to release; it does not release the money yet.",
    "button": "Approve the last pledge",
    "networkKey": "verification",
    "chapterName": "Build",
    "objective": "Complete the group’s commitment.",
    "connection": "Readiness records these accounts’ approvals, not a promise that a real building exists.",
    "contract": "contracts/public/v4-launch.sil",
    "expected": {
      "kind": "launch",
      "operation": 0,
      "accepted": true
    },
    "why": "Readiness is a signed contract state. It does not prove a delivery or other outside event.",
    "dialogue": {
      "speaker": "Third backer",
      "line": "I will wait if the delivery is missing. Nobody else can sign my pledge."
    },
    "effect": {
      "attempt": "Sign the third pledge’s readiness",
      "after": "All three pledges are ready, but still locked",
      "next": "Release all three together to the beneficiary"
    },
    "resultTitle": "The third pledge is ready."
  },
  {
    "id": "factory-pay",
    "kind": "coordination",
    "title": "Release the complete agreement.",
    "line": "All three backers approved. Release their pledges together to your account, the agreed project beneficiary. In the game, that funding and Pip’s parts build the greenhouse.",
    "button": "Fund the greenhouse together",
    "networkKey": null,
    "chapterName": "Build",
    "objective": "Turn parts and commitments into a working place.",
    "connection": "The greenhouse is built in the game. Its production still needs an effective work schedule.",
    "consequence": "The greenhouse is built in the game. Its production still needs an effective work schedule.",
    "contract": "contracts/public/v4-launch.sil",
    "expected": {
      "kind": "launch",
      "operation": 1,
      "accepted": true
    },
    "why": "Transaction introspection (KIP-10) and covenant rules (KIP-17) check all three ready members and the beneficiary; KIP-20 identifies the related state lineage. The greenhouse is a game consequence, not a building the node inspected.",
    "dialogue": {
      "speaker": "Pip",
      "line": "Everyone agreed. The recipient and all three pledges are in the same payment."
    },
    "effect": {
      "attempt": "Spend all three ready pledges in one payment",
      "after": "The beneficiary receives the pool less the fee",
      "next": "Organize the greenhouse’s work schedule"
    },
    "resultTitle": "The greenhouse is funded."
  },
  {
    "id": "compute",
    "kind": "computation",
    "title": "“Job done” is not enough to get paid.",
    "line": "The greenhouse is built but needs a work schedule. Lock a 0.05 tKAS reward for an answer that fits the job rules. Pip gets paid only when its answer passes.",
    "button": "Offer a reward for a valid schedule",
    "networkKey": null,
    "chapterName": "Work",
    "objective": "Get production moving.",
    "connection": "The reward is paid only for an assignment the contract can check.",
    "dialogue": {
      "speaker": "Greenhouse keeper",
      "line": "I will pay for an answer that fits the rules. A confident claim is not an answer."
    },
    "challenge": {
      "label": "Pay a worker who just says “done”?",
      "reply": "A claim could hide a bad schedule. Make payment conditional on the submitted assignment satisfying the job rules. The node checks these numbers, not work performed outside the game.",
      "localOnly": true
    },
    "contract": "contracts/public/v4-compute.sil",
    "expected": {
      "kind": "compute",
      "operation": null,
      "accepted": true
    },
    "why": "This small problem can be checked directly by the contract. No ZK proof is used.",
    "effect": {
      "attempt": "Fund a reward for a valid assignment",
      "after": "The scheduling reward is locked under its check",
      "next": "Choose distinct workers within the cost limit"
    },
    "resultTitle": "The schedule reward is locked."
  },
  {
    "id": "compute-pay",
    "kind": "computation",
    "title": "Check Pip’s answer before paying.",
    "line": "Assign a different worker to each of the three jobs, keeping the total cost at six or less. Submit the schedule. If it passes, Pip receives 0.05 tKAS and the game greenhouse can produce food.",
    "button": "Check the schedule and pay Pip",
    "networkKey": null,
    "chapterName": "Work",
    "objective": "Make the greenhouse ready to supply the habitat.",
    "connection": "The checked schedule improves production in the game; the worker reward is a real test-coin payment.",
    "consequence": "The checked schedule improves production in the game; the worker reward is a real test-coin payment.",
    "dialogue": {
      "speaker": "Pip",
      "line": "Here is my answer. If it fits the agreed rules, I want the agreed payment."
    },
    "contract": "contracts/public/v4-compute.sil",
    "expected": {
      "kind": "compute",
      "operation": 0,
      "accepted": true
    },
    "why": "A worker claiming “job done” is not enough. The node checks the submitted assignment and reward rule before paying Pip. It checks these numbers, not whether someone performed a job outside the game.",
    "effect": {
      "attempt": "Check the submitted assignment and worker payment",
      "after": "The accepted schedule pays Pip 0.05 tKAS",
      "next": "Recover the spare job deposit, then deliver food"
    },
    "resultTitle": "Pip’s schedule passed. Pip was paid."
  },
  {
    "id": "compute-refund",
    "kind": "computation",
    "title": "Pip has a working greenhouse. Sprout needs the food.",
    "line": "Pip has been paid and the greenhouse is running. Return the job’s spare deposit to your account. Then deliver two game food to Sprout to finish the town’s first goal.",
    "button": "Recover the spare job coins",
    "networkKey": "participation",
    "chapterName": "Work",
    "objective": "Finish with a running greenhouse and a supplied habitat.",
    "connection": "Your next care action completes the game goal. Closing the job alone does not feed Sprout.",
    "consequence": "Your next care action completes the game goal. Closing the job alone does not feed Sprout.",
    "dialogue": {
      "speaker": "Sprout",
      "line": "The greenhouse is ready. Bring the food to my habitat."
    },
    "contract": "contracts/public/v4-compute.sil",
    "expected": {
      "kind": "compute",
      "operation": 1,
      "accepted": true
    },
    "why": "The owner signs the exit. Node-reported acceptance is evidence of this test-coin transition. The game can now check whether the greenhouse is running and the habitat has supplies.",
    "effect": {
      "attempt": "Close the completed job",
      "after": "The remaining job deposit returns to your account",
      "next": "Deliver two game food to Sprout’s habitat"
    },
    "resultTitle": "The spare job coins are back. Food is next."
  }
].map(step=>Object.freeze(step)));
export const V4_LIVE_TECHNOLOGY=Object.freeze({
 title:'What made these actions enforceable?',
 covenant:'The rules travel with the outputs holding your test coins. Every spend must satisfy them.',
 silverScript:'SilverScript is the language used to write these rules; its compiler produces the Kaspa Script checked by nodes.',
 argent:'Argent adds actor and cross-app abstractions above SilverScript. This tour does not execute Argent-generated contracts.',
 zk:'ZK can let a contract verify a proof of a larger computation. This three-job example is checked directly and uses no ZK proof.',
 pow:'Miners commit to candidate block contents before finding a valid proof of work. Nodes still check every transaction’s rules.',
 realtime:'Frequent block events can provide useful feedback sooner under the protocol’s mining-majority and network assumptions. One observed block is not unconditional finality.',
 verification:'This browser queries a connected node. Running a separate full node lets you check consensus rules independently; neither node proves an outside delivery or an honest person.',
 participation:'Mining and running a node are separate optional activities outside this browser. This tour does neither.',
 sourceKeys:['kip17','kip20','silver','argent','kip16','hashdag','dag'],
 sourceModule:'v4-technical-map.mjs'
});
