# `@stellar-gasless/sdk` (`stellar-gasless-sdk`)

[![CI](https://github.com/stellar-gasless-net/stellar-gasless-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/stellar-gasless-net/stellar-gasless-sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/badge/npm-v1.0.0-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](./CONTRIBUTING.md)

**TypeScript client SDK for talking to a `stellar-gasless-relayer` instance: submit a signed inner transaction and get it relayed as a sponsored FeeBumpTransaction, plus a WebAuthn passkey signer and wallet-detection helpers.**

**Current status:** `GaslessClient.submitGaslessTransaction()`, `PasskeyAdapter.signChallenge()`, `FreighterAdapter.signTransaction()` (2026-09-04), and — as of 2026-09-07 — `XBullAdapter.signTransaction()` and `AlbedoAdapter.signTransaction()` are all implemented and tested. `FreighterAdapter` was rewritten to use the real `@stellar/freighter-api` package (it previously probed a raw, undocumented `window.freighter` global) and now supports the full connect → get address → sign flow, using the exact same call pattern already proven against a real connected wallet in this ecosystem's `stellar-zkstream`, `stellar-zkident`, and `soroban-yield-vault` frontends and `gasless-relayer-dashboard`. `XBullAdapter` and `AlbedoAdapter` were previously honest detection-only stubs; both now delegate to `@creit.tech/stellar-wallets-kit`'s individual module classes (not the full kit — see CONTRIBUTING.md for why) for their real connect/sign flows. **Breaking change:** `AlbedoAdapter.isAvailable()` changed from synchronous to `async`, to match the other two adapters' shape — anyone calling it directly needs to add `await`. There is still no high-level "build a contract call and sign it in one line" helper; you build the inner transaction yourself, sign it with an adapter's `signTransaction()` (or your own signer), and hand the signed XDR to this SDK.

**Real, independently-verified end-to-end proof (2026-09-04):** [`examples/e2e-gasless-relay.mjs`](examples/e2e-gasless-relay.mjs) runs this SDK's actual built `GaslessClient` against a real running `stellar-gasless-relayer` instance and a real deployed contract (`stellar-zkident`'s `did_registry`) on Stellar testnet — the first time these three separate repos had ever been exercised together. It's fully reproducible and self-funding (no secrets to supply). Result, confirmed independently via Horizon rather than trusted from the script's own output: the relayer's configured sponsor account's balance dropped by the real network fee (`fee_account` in the Horizon transaction record), while the throwaway user account that built and signed the call never lost a stroop. Running it surfaced two real integration bugs, documented in the example's header comment:
- `AssembledTransaction#toXDR()` returns the *unsigned* transaction — you need `tx.signed.toXDR()` after `tx.sign()`, or the relayer (correctly) rejects the submission with `tx_bad_auth`.
- `AssembledTransaction`'s default timeout is computed from the local machine's clock; if it's behind real network time (measured ~8.5 minutes on the dev machine here) the transaction is already expired by submission time, producing a real `tx_too_late`. Pass a generous `timeoutInSeconds` explicitly instead of relying on the default — the same class of bug found earlier in `stellar-zkstream`'s frontend.

A third real bug was found and fixed on the relayer side during this same test: `stellar-gasless-relayer`'s error handling was surfacing Horizon's generic axios message (`"Request failed with status code 400"`) instead of the actual `result_codes` that explain what actually went wrong — see that repo's `src/index.ts` for the fix.

This repository houses the **Client SDK & Developer Integration Toolkit** for the [`stellar-gasless-net`](https://github.com/stellar-gasless-net) ecosystem.

## Why this is a real SDK, not a wrapper around fixtures

- **The first time three separate repos in this ecosystem were exercised together.** `examples/e2e-gasless-relay.mjs` drives this SDK's actual built client against a real running `stellar-gasless-relayer` and a real deployed `stellar-zkident` contract — not three components independently unit-tested and assumed to work together.
- **Two real integration bugs found by actually running it**, not just passing unit tests — a signed-vs-unsigned XDR footgun in `AssembledTransaction#toXDR()`, and a local-clock-skew timeout bug. Both documented with the fix, not swept under the rug.
- **What were honest stubs are now real.** xBull and Albedo wallet adapters were detection-only, deliberately, until this project had a real way to verify signing against them without hand-rolling each wallet's own protocol — `@creit.tech/stellar-wallets-kit`'s individual module classes now provide that, real bridge-connect and popup-intent flows included.
- **Freighter signing is genuinely wired to the official `@stellar/freighter-api` package**, replacing an earlier version that probed an undocumented raw `window.freighter` global.

---

## Contents

- [SDK Integration Architecture](#sdk-integration-architecture)
- [Detailed Component Capabilities](#detailed-component-capabilities)
- [Full Code Integration Examples](#full-code-integration-examples)
- [Ecosystem](#ecosystem)
- [Contributing & CONTRIBUTING.md Guidelines](#contributing--contributingmd-guidelines)
- [Future Improvements & SDK Roadmap](#future-improvements--sdk-roadmap)

---

## SDK Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           @stellar-gasless/sdk Layer                            │
│                                                                                 │
│  ┌───────────────────────────┐                 ┌─────────────────────────────┐  │
│  │   PasskeyAdapter          │                 │    Browser Wallet Adapters  │  │
│  │ (WebAuthn TouchID/FaceID) │                 │ (Freighter / xBull / Albedo)│  │
│  └─────────────┬─────────────┘                 └──────────────┬──────────────┘  │
│                │                                              │                 │
│                └──────────────────────┬───────────────────────┘                 │
│                                       │                                         │
│                                       v                                         │
│                        ┌──────────────────────────────┐                         │
│                        │        GaslessClient         │                         │
│                        │   (HTTP Payload Transport)   │                         │
│                        └──────────────┬───────────────┘                         │
│                                       │                                         │
│                                       v                                         │
│                        ┌──────────────────────────────┐                         │
│                        │    useGasless Hook (React)   │                         │
│                        └──────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Capabilities

<details open>
<summary><strong>1. <code>GaslessClient</code> (<code>src/client.ts</code>)</strong></summary>

* **1-Line Transport**: Submits off-chain signed intents to the Relayer service over HTTP in a single request, with safe JSON/network error parsing so a malformed response or dropped connection comes back as a typed `{success: false, error}` instead of a thrown exception. No retry or polling logic yet — see roadmap.

</details>

<details open>
<summary><strong>2. <code>PasskeyAdapter</code> (<code>src/adapters/passkey.ts</code>)</strong></summary>

* **Browser WebAuthn Enclave**: Invokes the browser's WebAuthn `navigator.credentials.get()` (TouchID/FaceID/security key, whatever the platform authenticator is) to sign a challenge. Throws clearly if WebAuthn isn't available rather than failing silently.

</details>

<details open>
<summary><strong>3. Wallet Adapters (<code>src/adapters/</code>)</strong></summary>

* **Freighter** (`freighter.ts`): `isAvailable()`, `getPublicKey()`, and `signTransaction(xdr, { networkPassphrase, address? })` are all implemented, backed by the real `@stellar/freighter-api` package.
* **xBull** (`xbull.ts`) / **Albedo** (`albedo.ts`): `isAvailable()`, `getPublicKey()`, and `signTransaction()` are all implemented (2026-09-07), backed by `@creit.tech/stellar-wallets-kit`'s individual `xBullModule`/`AlbedoModule` classes — real bridge-connect (xBull) and popup-intent (Albedo) flows, not stubs. Note xBull's and Albedo's `isAvailable()` don't do real extension detection the way Freighter's does — see each adapter's own doc comment for why that's genuinely how those two wallets' connection models work, not a shortcut.

</details>

<details open>
<summary><strong>4. React Toolkit (<code>src/react/useGasless.ts</code>)</strong></summary>

* **`useGaslessTransaction(client)` Hook**: takes a `GaslessClient` instance, exposes `{ submit, isSubmitting, error, txHash }`. `submit(signedInnerTxXdr)` expects a transaction you've already built and signed — see the usage example below.

</details>

<details open>
<summary><strong>5. Verified-Credential Check (<code>src/utils/zkident.ts</code>, <code>src/react/useVerifiedCredential.ts</code>) — real, and usable against your own contract, not just ours</strong></summary>

* **The same real gate our own relayer uses, published for any dApp (2026-09-12).** `hasVerifiedCredential(userAddress, options)` makes a real, read-only cross-contract `has_credential(user, credential_type)` check — the exact one `stellar-zklab/stellar-zkident`'s `reputation_nft::mint()` and `sybil_resistant_faucet::claim()` use on-chain, and the exact one `stellar-gasless-relayer` now uses server-side to tier sponsorship budgets. It's exposed here so any dApp using this SDK can add the same Sybil-resistance check client-side too, without depending on our relayer at all.
* **Not hardcoded to our contract.** `credentialVerifierId` and `credentialType` are required arguments with no default — a dApp can point this at their own deployed `credential_verifier`-shaped contract, or at `STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID` (this repo's own real testnet instance) if they want to check against zkident's ecosystem-wide credentials instead. There's no default specifically so a caller who forgets to configure this gets an obvious wrong answer, not a silent check against someone else's contract.
* **Fails closed, on purpose.** Any RPC error, malformed response, or network failure is treated as "not verified," never thrown — a credential-check outage should degrade a caller's UI, not crash it. `useVerifiedCredential(options)` wraps the same check in the same `{checking, verified, error, check}` shape `useGaslessTransaction` already uses.

</details>

---

## Full Code Integration Examples

### Example 1: Submit Meta-Transaction via TypeScript Client
```typescript
import { GaslessClient } from '@stellar-gasless/sdk';

const gaslessClient = new GaslessClient({
  relayerUrl: 'https://your-relayer-domain.example', // your own deployed stellar-gasless-relayer
  dappApiKey: 'YOUR_DAPP_API_KEY',
});

// signedInnerTxXdr must already be built and signed by the user before this call.
const result = await gaslessClient.submitGaslessTransaction(signedInnerTxXdr);
console.log('Gasless Meta-Tx Hash:', result.hash);
```

### Example 1b: Sign With a Real Connected Freighter Wallet, Then Submit
```typescript
import { GaslessClient, FreighterAdapter } from '@stellar-gasless/sdk';

const networkPassphrase = 'Test SDF Network ; September 2015';
const address = await FreighterAdapter.getPublicKey(); // prompts Freighter for access

// Build `unsignedInnerTxXdr` yourself (e.g. via @stellar/stellar-sdk/contract's Client),
// with `address` as the transaction's source account — see examples/e2e-gasless-relay.mjs
// in this repo for a complete, runnable version of this exact flow.
const signedInnerTxXdr = await FreighterAdapter.signTransaction(unsignedInnerTxXdr, { networkPassphrase, address });

const gaslessClient = new GaslessClient({ relayerUrl: 'https://your-relayer-domain.example', dappApiKey: 'YOUR_DAPP_API_KEY' });
const result = await gaslessClient.submitGaslessTransaction(signedInnerTxXdr);
console.log('Gasless Meta-Tx Hash:', result.hash);
```

### Example 2: Request WebAuthn Passkey Biometric Signature
```typescript
import { PasskeyAdapter } from '@stellar-gasless/sdk';

// Prompt the browser's WebAuthn platform authenticator (TouchID/FaceID/security key)
const credential = await PasskeyAdapter.signChallenge(challengeHex);
console.log('Passkey Credential ID:', credential.id);
```

### Example 3: React Hook
```tsx
import { GaslessClient, useGaslessTransaction } from '@stellar-gasless/sdk';

const client = new GaslessClient({
  relayerUrl: 'https://your-relayer-domain.example',
  dappApiKey: 'YOUR_DAPP_API_KEY',
});

function GaslessSubmitButton({ signedInnerTxXdr }: { signedInnerTxXdr: string }) {
  const { submit, isSubmitting, txHash, error } = useGaslessTransaction(client);

  return (
    <button onClick={() => submit(signedInnerTxXdr)} disabled={isSubmitting}>
      {isSubmitting ? 'Submitting...' : 'Submit Gasless Tx'}
    </button>
  );
}
```

### Example 4: Gate a Feature on a Real Verified Credential
```tsx
import { useVerifiedCredential, STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID } from '@stellar-gasless/sdk';

function VerifiedOnlyAction({ userAddress }: { userAddress: string }) {
  // Point credentialVerifierId at your own deployed credential_verifier-shaped contract
  // instead, if you're not checking against stellar-zkident's own ecosystem credentials.
  const { check, verified, checking } = useVerifiedCredential({
    credentialVerifierId: STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID,
    credentialType: 'kyc_tier_2',
  });

  return (
    <div>
      <button onClick={() => check(userAddress)} disabled={checking}>
        {checking ? 'Checking...' : 'Check Verified Credential'}
      </button>
      {verified === true && <p>Verified — feature unlocked.</p>}
      {verified === false && <p>Not verified — this address holds no matching credential.</p>}
    </div>
  );
}
```

---

## Ecosystem

Part of **stellar-gasless-net**'s gasless meta-transaction protocol suite, alongside:
- [`soroban-gasless-contracts`](https://github.com/stellar-gasless-net/soroban-gasless-contracts) — the on-chain WASM contracts this SDK's `GaslessClient` ultimately triggers via a relayer
- [`stellar-gasless-relayer`](https://github.com/stellar-gasless-net/stellar-gasless-relayer) — the backend service this SDK submits signed transactions to
- [`gasless-relayer-dashboard`](https://github.com/stellar-gasless-net/gasless-relayer-dashboard) — an admin console with a real integration of this SDK's `GaslessClient` in its "Real Gasless Transaction" tab

**A real dependency outside stellar-gasless-net (2026-09-12).** `useVerifiedCredential`/`hasVerifiedCredential` (see §5 above) are a genuine runtime dependency on [`stellar-zklab/stellar-zkident`](https://github.com/stellar-zklab/stellar-zkident)'s `credential_verifier` interface — usable against zkident's own real deployed instance, or any dApp's own. This is the third real dependency across the two orgs this ecosystem is built from, alongside `stellar-zkident`'s own `sybil_resistant_faucet` and `stellar-gasless-relayer`'s sponsorship tiering.

---

## Contributing & `CONTRIBUTING.md` Guidelines

Please review our dedicated **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** guide before opening pull requests:
* **[SDK Contributor Guide](./CONTRIBUTING.md)**
* **[Security Disclosure Policy](./SECURITY.md)**

### Pull Request Checklist:
- [ ] Claim an issue tagged `good first issue`, `intermediate`, or `advanced`.
- [ ] Run `npm test` (vitest) and verify TypeScript compilation (`npm run build`).
- [ ] Follow Conventional Commits format (`feat: ...`, `fix: ...`, `docs: ...`).

---

## Future Improvements & SDK Roadmap

- [x] **Freighter wallet signing**: done 2026-09-04 — `FreighterAdapter.signTransaction()`.
- [x] **xBull & Albedo wallet signing**: done 2026-09-07 — `XBullAdapter`/`AlbedoAdapter.signTransaction()`, via `@creit.tech/stellar-wallets-kit`'s individual module classes.
- [ ] **High-level execute helper**: a `{contractId, method, params}` → build + sign + submit convenience wrapper (not built yet; you currently build and sign the inner transaction yourself).
- [ ] **React Native & Flutter Adapters**: Mobile SDK adapters supporting mobile WebAuthn passkey enclaves.
- [ ] **Vue & Svelte Component Libraries**: Native hooks and wrappers for Vue 3 and Svelte.
- [ ] **Auto-Retry Failover Engine**: Multi-relayer endpoint failover routing.
