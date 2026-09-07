// Economic story; legacy route remains available for saved wallets.
export const V4_ECONOMY_STORY=Object.freeze([
  {
    "id": "shop",
    "kind": "market",
    "title": "The town needs a food supply.",
    "line": "Build a greenhouse that can sell food. Start as its supplier: offer three parts. Pip will buy the complete set using a purse with a spending limit.",
    "button": "Put the parts up for sale",
    "networkKey": "custody",
    "chapterName": "Trade",
    "objective": "Start a business that can feed the town.",
    "connection": "Parts become a greenhouse; its harvest becomes something people can buy.",
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
    "line": "Give Pip a shopping purse. Its key can pay the named supplier at most 0.05 tKAS per purchase. The next trade must deliver all three part vouchers and payment together.",
    "button": "Give Pip a limited purse",
    "networkKey": null,
    "chapterName": "Trade",
    "objective": "Let Pip buy supplies safely.",
    "connection": "You set the spending rule; Pip buys the supplies within it.",
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
      "next": "Buy the complete parts set within the cap"
    },
    "resultTitle": "The oversized request was stopped."
  },
  {
    "id": "buy",
    "kind": "market",
    "title": "Buy the supplies, with payment and ownership together.",
    "line": "Buy all three greenhouse part vouchers for 0.05 tKAS from Pip’s restricted purse. Ownership and payment change together in one transaction.",
    "button": "Buy the parts with Pip",
    "networkKey": "realtime",
    "chapterName": "Trade",
    "objective": "Get all three parts for the greenhouse.",
    "connection": "The supplier receives 0.05 tKAS and Pip receives every part voucher in one accepted transaction.",
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
      "next": "Pool the greenhouse investment"
    },
    "resultTitle": "Pip’s purse is closed. Spare coins are home."
  },
  {
    "id": "factory",
    "kind": "coordination",
    "title": "Pool the investment for the greenhouse.",
    "line": "You, Pip and a third backer must all approve before the three pledges can pay the greenhouse. This wallet supplies the test coins and controls every role; the signatures demonstrate the shared condition.",
    "button": "Bring the backers together",
    "networkKey": null,
    "chapterName": "Build",
    "objective": "Fund the business only when all three agree.",
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
    "title": "Approve the first investment.",
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
    "title": "Add Pip’s agreement to the project.",
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
    "title": "Get the final backer’s agreement.",
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
    "connection": "Accepted funding builds the greenhouse in the game. It still needs a production schedule before a harvest is available.",
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
    "title": "The greenhouse has a paid job for Pip.",
    "line": "Offer Pip 0.1 tKAS for a valid work schedule. The agreement checks three distinct workers and a total cost of at most six before paying. The greenhouse grows three food crates in the game when the schedule is accepted.",
    "button": "Post the 0.1 tKAS scheduling job",
    "networkKey": null,
    "chapterName": "Work",
    "objective": "Pay for useful work, then bring a harvest to market.",
    "connection": "Pip will use these exact earnings to buy the harvest.",
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
    "title": "Finish the job. Pip earns its own spending money.",
    "line": "Assign one worker to each job. The node checks the complete schedule and pays Pip 0.1 tKAS only if it fits. That payment will fund Pip’s next purchase.",
    "button": "Check the work and pay Pip 0.1 tKAS",
    "networkKey": null,
    "chapterName": "Work",
    "objective": "Earn the money for the next trade.",
    "connection": "Work creates income; the greenhouse now has a harvest to sell.",
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
      "attempt": "Check the schedule and pay the worker",
      "after": "Pip receives 0.1 tKAS; three game food crates are ready",
      "next": "Return the unused job deposit, then sell the harvest"
    },
    "resultTitle": "Pip’s schedule passed. Pip was paid."
  },
  {
    "id": "compute-refund",
    "kind": "computation",
    "title": "Pip has a working greenhouse. Sprout needs the food.",
    "line": "Pip has earned its wage. Return the unused scheduling deposit to your account, then put the greenhouse harvest on sale.",
    "button": "Recover the spare job coins",
    "networkKey": "participation",
    "chapterName": "Work",
    "objective": "Recover unused capital before the next trade.",
    "connection": "The returned deposit belongs to the employer. Pip keeps its separate wage for the harvest purchase.",
    "consequence": "Next, the greenhouse offers three food crates for sale.",
    "dialogue": {
      "speaker": "Pip",
      "line": "I earned the wage. Now I can buy the harvest."
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
      "next": "Offer the greenhouse harvest for sale"
    },
    "resultTitle": "The spare job coins are back. Food is next."
  },
  {
    "kind": "market",
    "contract": "contracts/public/v4-bundle.sil",
    "chapterName": "Spend the earnings",
    "networkKey": "custody",
    "objective": "Turn work income into customer spending.",
    "why": "Three custom crop vouchers change ownership together with the agreed payment. Food production is a game rule. This browser controls both demonstration accounts.",
    "id": "crop-shop",
    "title": "The greenhouse has a harvest to sell.",
    "line": "Put three food vouchers on sale for 0.03 tKAS in total. Pip can buy them with the exact coins earned from its completed job.",
    "button": "Offer three food crates for 0.03 tKAS",
    "action": "crop-shop",
    "expected": {
      "kind": "bundle",
      "operation": null,
      "accepted": true
    },
    "connection": "The business sells what it produced. Pip becomes its customer.",
    "effect": {
      "attempt": "Create three crop sale vouchers",
      "after": "Three game food crates are available for 0.03 tKAS",
      "next": "Pip spends its job earnings"
    },
    "resultTitle": "The harvest is on sale."
  },
  {
    "kind": "market",
    "contract": "contracts/public/v4-bundle.sil",
    "chapterName": "Spend the earnings",
    "networkKey": "custody",
    "objective": "Turn work income into customer spending.",
    "why": "Three custom crop vouchers change ownership together with the agreed payment. Food production is a game rule. This browser controls both demonstration accounts.",
    "id": "crop-buy",
    "title": "Pip spends its earnings in the town.",
    "line": "Buy the three crop vouchers for 0.03 tKAS using Pip’s exact 0.1 tKAS wage output. The greenhouse receives the price; Pip receives the vouchers and keeps the change after the network fee.",
    "button": "Buy the harvest with Pip’s earnings",
    "action": "crop-buy",
    "expected": {
      "kind": "bundle",
      "operation": 0,
      "accepted": true
    },
    "connection": "The same test coins now move from employer to worker to local business. No hidden top-up funds this purchase.",
    "effect": {
      "attempt": "Spend Pip’s wage on the complete harvest",
      "after": "Greenhouse earns 0.03 tKAS; Pip owns all three food vouchers",
      "next": "Carry Pip’s purchase to the food store"
    },
    "resultTitle": "Pip’s earnings became the greenhouse’s revenue."
  },
  {
    "id": "habitat",
    "kind": "terrarium",
    "title": "The purchased harvest needs a delivery.",
    "line": "Sprout carries Pip’s three food crates from the greenhouse gate to the town food store. Start its delivery state. Each accepted step advances the marked route and uses one energy.",
    "button": "Load Sprout’s three food crates",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "Deliver the food that Pip bought.",
    "connection": "Movement now has a destination and cargo. Kaspa checks the movement state; the game interprets arrival as delivery.",
    "contract": "contracts/public/v4-terrarium.sil",
    "expected": {
      "kind": "terrarium",
      "operation": null,
      "accepted": true
    },
    "why": "A state output records position and energy. Its covenant restricts which successor may replace it.",
    "dialogue": {
      "speaker": "Sprout",
      "line": "Pip bought the food. I can carry it to the store."
    },
    "effect": {
      "attempt": "Start the harvest delivery",
      "after": "Sprout has three game food crates and a three-step route",
      "next": "Walk to the marked delivery route"
    },
    "resultTitle": "Sprout’s movement session is open."
  },
  {
    "id": "move-1",
    "kind": "terrarium",
    "title": "Leave the greenhouse with the harvest.",
    "line": "Move one square along the delivery route. Sprout is carrying Pip’s purchased food; 3 steps remain before the food store.",
    "button": "Carry the food · step 1 of 3",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "Deliver three purchased food crates.",
    "connection": "The transaction carries Sprout’s next position and energy. Cargo and the destination are game rules, not proof of a physical shipment.",
    "dialogue": {
      "speaker": "Sprout",
      "line": "The crates are coming with me along the marked route."
    },
    "contract": "contracts/public/v4-terrarium.sil",
    "expected": {
      "kind": "terrarium",
      "operation": 0,
      "accepted": true
    },
    "why": "The node checks adjacency, grid bounds, identity and the exact energy decrease.",
    "effect": {
      "attempt": "Carry the food one adjacent square",
      "after": "Sprout is 1 of three steps along the delivery route",
      "next": "Continue toward the food store"
    },
    "resultTitle": "Delivery step 1 accepted."
  },
  {
    "id": "move-2",
    "kind": "terrarium",
    "title": "Carry the harvest around the path.",
    "line": "Move one square along the delivery route. Sprout is carrying Pip’s purchased food; 2 steps remain before the food store.",
    "button": "Carry the food · step 2 of 3",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "Deliver three purchased food crates.",
    "connection": "The transaction carries Sprout’s next position and energy. Cargo and the destination are game rules, not proof of a physical shipment.",
    "contract": "contracts/public/v4-terrarium.sil",
    "expected": {
      "kind": "terrarium",
      "operation": 0,
      "accepted": true
    },
    "why": "KIP-10 gives the script transaction fields to inspect. KIP-17 supplies the covenant restrictions, and KIP-20 preserves the covenant identity as position and energy change.",
    "dialogue": {
      "speaker": "Sprout",
      "line": "The crates are coming with me along the marked route."
    },
    "effect": {
      "attempt": "Carry the food one adjacent square",
      "after": "Sprout is 2 of three steps along the delivery route",
      "next": "Continue toward the food store"
    },
    "resultTitle": "Delivery step 2 accepted."
  },
  {
    "id": "move-3",
    "kind": "terrarium",
    "title": "Bring the food into the town store.",
    "line": "Take the last adjacent step to the marked food store. Once accepted, the game records all three purchased crates as delivered.",
    "button": "Deliver the food · final step",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "Deliver three purchased food crates.",
    "connection": "The transaction carries Sprout’s next position and energy. Cargo and the destination are game rules, not proof of a physical shipment.",
    "consequence": "The greenhouse is the town’s supply project. It does not automatically refill this completed on-chain movement state.",
    "dialogue": {
      "speaker": "Sprout",
      "line": "The food store is here. Let’s finish the delivery."
    },
    "contract": "contracts/public/v4-terrarium.sil",
    "expected": {
      "kind": "terrarium",
      "operation": 0,
      "accepted": true
    },
    "why": "Every spend must satisfy the current state. An earlier state cannot be spent again.",
    "effect": {
      "attempt": "Carry the food one adjacent square",
      "after": "Three game food crates delivered to the store",
      "next": "Return the delivery deposit"
    },
    "resultTitle": "The purchased food reached the town store."
  },
  {
    "id": "habitat-refund",
    "kind": "terrarium",
    "title": "Delivery complete. Recover the route deposit.",
    "line": "The food has reached the store in the game. Close Sprout’s movement contract and return its remaining test-coin deposit.",
    "button": "Return Sprout’s deposit",
    "networkKey": null,
    "chapterName": "Care",
    "objective": "Finish the order and recover unused capital.",
    "connection": "Deposits secure the temporary contract state. They are separate from Pip’s wage and the harvest price.",
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
      "next": "Close the delivered crop vouchers"
    },
    "resultTitle": "Sprout’s visit is closed. Deposit returned."
  },
  {
    "kind": "market",
    "contract": "contracts/public/v4-bundle.sil",
    "chapterName": "Complete the order",
    "networkKey": "custody",
    "objective": "Turn work income into customer spending.",
    "why": "Three custom crop vouchers change ownership together with the agreed payment. Food production is a game rule. This browser controls both demonstration accounts.",
    "id": "crop-refund",
    "title": "Close the delivered order.",
    "line": "The purchased food is in the town store. Close its three vouchers and return their refundable state deposits to Pip. These returned deposits are not wages, profit or extra food.",
    "button": "Close the order and return voucher deposits",
    "action": "crop-refund",
    "expected": {
      "kind": "bundle",
      "operation": 2,
      "accepted": true
    },
    "connection": "The town has food, the greenhouse has sales revenue, and Pip has earned and spent money.",
    "effect": {
      "attempt": "Close the delivered crop vouchers",
      "after": "Order complete; refundable voucher deposits returned",
      "next": "See the money trail or take the next food order"
    },
    "resultTitle": "One economic cycle is complete."
  }
]);
// A repeat order reuses the accepted work, purchase and delivery steps.
export const V4_ECONOMY_REPEAT=Object.freeze(V4_ECONOMY_STORY.slice(V4_ECONOMY_STORY.findIndex(step=>step.id==='compute')));
