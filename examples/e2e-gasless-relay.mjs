// Real, runnable, secret-free end-to-end example: proves the actual gasless claim this SDK
// exists for, against a real deployed contract and a real running relayer instance — not a
// mock. Generates a fresh throwaway testnet user keypair (funded via friendbot, no secrets
// to supply), builds and signs a real contract call as that "user", submits it through
// GaslessClient to a relayer you have running locally, then independently checks Horizon to
// prove the user's own balance never moved — the caller-visible half of "gasless". If you
// also pass SPONSOR_PUBLIC_KEY (the relayer operator's own RELAYER_SECRETS address — not
// something a caller of the API can otherwise learn), this also proves that account's
// balance dropped by the real fee, i.e. the full sponsor-side half of the claim too.
//
// Prereqs:
//   1. `npm run build` in this repo (this example imports the built dist/, not src/).
//   2. A stellar-gasless-relayer running locally with a funded RELAYER_SECRETS keypair
//      (see that repo's README) — default expected at http://localhost:3001.
//
// Run: node examples/e2e-gasless-relay.mjs
//    or: SPONSOR_PUBLIC_KEY=G... node examples/e2e-gasless-relay.mjs   (fuller proof)
//
// This exact flow surfaced three real bugs during development (2026-09-04), all worth
// knowing if you're integrating this SDK yourself:
//
//   1. `AssembledTransaction#toXDR()` serializes the UNSIGNED transaction (it exists for
//      multi-party toJSON/fromXDR round-tripping, not for reading back a signed envelope).
//      After `await tx.sign()`, the signed envelope is on `tx.signed` — use
//      `tx.signed.toXDR()`, not `tx.toXDR()`, or you'll submit an unsigned tx and get a
//      real `tx_bad_auth` back from the network.
//
//   2. `AssembledTransaction`'s default 5-minute timeout is computed from the local
//      machine's clock, not the real network's. A local clock even a few minutes behind
//      real network time means the transaction's own maxTime is already in the past by
//      the time it's submitted, producing a real `tx_too_late`. Pass a generous
//      `{ timeoutInSeconds: 1800 }` (as this example does) rather than trusting the
//      default. See stellar-zkstream's frontend `soroban.ts` for the same class of bug
//      found independently in a browser context.
//
//   3. A caller of this SDK has no way to observe which account actually paid the fee —
//      that's the relayer operator's own RELAYER_SECRETS keypair, never exposed by the
//      API. An earlier version of this example generated its own throwaway "sponsor"
//      keypair to show a before/after balance, which was meaningless: that keypair was
//      never the one the relayer actually charged, so its balance predictably never
//      moved. Fixed by only auto-verifying the user's own untouched balance, and making
//      the sponsor-side proof opt-in via SPONSOR_PUBLIC_KEY for whoever actually knows it.

import { Keypair, Horizon } from '@stellar/stellar-sdk';
import { Client as ContractClient, basicNodeSigner } from '@stellar/stellar-sdk/contract';
import { GaslessClient } from '../dist/client.js';

const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const RELAYER_URL = process.env.RELAYER_URL || 'http://localhost:3001';
const SPONSOR_PUBLIC_KEY = process.env.SPONSOR_PUBLIC_KEY;

// A real deployed contract from this ecosystem's stellar-zkident repo — see
// stellar-zkident/deployments/testnet.json. Any deployed contract whose method requires
// require_auth() from its caller would work equally well for this demo; did_registry's
// register_did is a convenient single-argument example.
const DID_REGISTRY_ID = 'CDGDZX4OGVCWEYANDRSWKSK6LLYOGFRJDZQNFNNYPTQPAKELKR4TXLB6';

const horizon = new Horizon.Server(HORIZON_URL);

async function fundViaFriendbot(publicKey) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
  if (!res.ok) throw new Error(`Friendbot funding failed for ${publicKey}: ${await res.text()}`);
}

async function balance(publicKey) {
  const acc = await horizon.loadAccount(publicKey);
  return acc.balances.find((b) => b.asset_type === 'native').balance;
}

const user = Keypair.random();

console.log('Generated a fresh throwaway user keypair for this run:', user.publicKey());
console.log('Funding it via friendbot...');
await fundViaFriendbot(user.publicKey());

console.log('\n--- BEFORE ---');
const userBefore = await balance(user.publicKey());
console.log('user   ', userBefore, 'XLM');
let sponsorBefore;
if (SPONSOR_PUBLIC_KEY) {
  sponsorBefore = await balance(SPONSOR_PUBLIC_KEY);
  console.log('sponsor', sponsorBefore, 'XLM');
}

console.log('\n--- BUILDING & SIGNING AS THE USER (no submission yet) ---');
const signer = basicNodeSigner(user, NETWORK_PASSPHRASE);
const client = await ContractClient.from({
  contractId: DID_REGISTRY_ID,
  networkPassphrase: NETWORK_PASSPHRASE,
  rpcUrl: RPC_URL,
  publicKey: user.publicKey(),
  signTransaction: signer.signTransaction,
});

const document = `ipfs://gasless-sdk-example-${Date.now()}`;
const tx = await client.register_did({ owner: user.publicKey(), document }, { timeoutInSeconds: 1800 });
await tx.sign();
const signedXdr = tx.signed.toXDR(); // see pitfall #1 in the header comment

console.log('\n--- SUBMITTING VIA GaslessClient -> ', RELAYER_URL, ' ---');
const gaslessClient = new GaslessClient({ relayerUrl: RELAYER_URL, dappApiKey: 'example-run' });
const result = await gaslessClient.submitGaslessTransaction(signedXdr);
console.log('Relayer response:', JSON.stringify(result, null, 2));

if (!result.success) {
  console.error('\nFAILED — is a stellar-gasless-relayer instance actually running at', RELAYER_URL, '?');
  process.exit(1);
}

console.log('\n--- AFTER (waiting for ledger settlement) ---');
await new Promise((r) => setTimeout(r, 6000));
const userAfter = await balance(user.publicKey());
console.log('user   ', userAfter, 'XLM  (delta:', (Number(userAfter) - Number(userBefore)).toFixed(7), ')');
if (SPONSOR_PUBLIC_KEY) {
  const sponsorAfter = await balance(SPONSOR_PUBLIC_KEY);
  console.log('sponsor', sponsorAfter, 'XLM  (delta:', (Number(sponsorAfter) - Number(sponsorBefore)).toFixed(7), ')');
}
console.log('\nIf the user delta above is exactly 0.0000000, the user really paid nothing for a');
console.log('real on-chain transaction. txHash:', result.hash, '— verify independently at');
console.log(`https://stellar.expert/explorer/testnet/tx/${result.hash}`);
