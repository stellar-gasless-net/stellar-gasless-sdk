# `@stellar-gasless/sdk` (`stellar-gasless-sdk`)

[![npm](https://img.shields.io/badge/npm-v1.0.0-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](./CONTRIBUTING.md)

**TypeScript client SDK for talking to a `stellar-gasless-relayer` instance: submit a signed inner transaction and get it relayed as a sponsored FeeBumpTransaction, plus a WebAuthn passkey signer and wallet-detection helpers.**

**Current status:** `GaslessClient.submitGaslessTransaction()`, `PasskeyAdapter.signChallenge()`, and — as of 2026-09-04 — `FreighterAdapter.signTransaction()` are implemented and tested. `FreighterAdapter` was rewritten to use the real `@stellar/freighter-api` package (it previously probed a raw, undocumented `window.freighter` global) and now supports the full connect → get address → sign flow, using the exact same call pattern already proven against a real connected wallet in this ecosystem's `stellar-zkstream`, `stellar-zkident`, and `soroban-yield-vault` frontends and `gasless-relayer-dashboard`. xBull and Albedo remain *detection only* — deliberately left as honest stubs rather than writing signing code against wallets this project has no way to test against. There is still no high-level "build a contract call and sign it in one line" helper; you build the inner transaction yourself, sign it with `FreighterAdapter.signTransaction()` (or your own signer), and hand the signed XDR to this SDK.

**Real, independently-verified end-to-end proof (2026-09-04):** [`examples/e2e-gasless-relay.mjs`](examples/e2e-gasless-relay.mjs) runs this SDK's actual built `GaslessClient` against a real running `stellar-gasless-relayer` instance and a real deployed contract (`stellar-zkident`'s `did_registry`) on Stellar testnet — the first time these three separate repos had ever been exercised together. It's fully reproducible and self-funding (no secrets to supply). Result, confirmed independently via Horizon rather than trusted from the script's own output: the relayer's configured sponsor account's balance dropped by the real network fee (`fee_account` in the Horizon transaction record), while the throwaway user account that built and signed the call never lost a stroop. Running it surfaced two real integration bugs, documented in the example's header comment:
- `AssembledTransaction#toXDR()` returns the *unsigned* transaction — you need `tx.signed.toXDR()` after `tx.sign()`, or the relayer (correctly) rejects the submission with `tx_bad_auth`.
- `AssembledTransaction`'s default timeout is computed from the local machine's clock; if it's behind real network time (measured ~8.5 minutes on the dev machine here) the transaction is already expired by submission time, producing a real `tx_too_late`. Pass a generous `timeoutInSeconds` explicitly instead of relying on the default — the same class of bug found earlier in `stellar-zkstream`'s frontend.

A third real bug was found and fixed on the relayer side during this same test: `stellar-gasless-relayer`'s error handling was surfacing Horizon's generic axios message (`"Request failed with status code 400"`) instead of the actual `result_codes` that explain what actually went wrong — see that repo's `src/index.ts` for the fix.

This repository houses the **Client SDK & Developer Integration Toolkit** for the [`stellar-gasless-net`](https://github.com/stellar-gasless-net) ecosystem.

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

### 1. `GaslessClient` (`src/client.ts`)
* **1-Line Transport**: Submits off-chain signed intents to the Relayer service over HTTP, handling auto-retry, status polling, and error parsing.

### 2. `PasskeyAdapter` (`src/adapters/passkey.ts`)
* **Browser WebAuthn Enclave**: Invokes the browser's WebAuthn `navigator.credentials.get()` (TouchID/FaceID/security key, whatever the platform authenticator is) to sign a challenge. Throws clearly if WebAuthn isn't available rather than failing silently.

### 3. Wallet Adapters (`src/adapters/`)
* **Freighter** (`freighter.ts`): `isAvailable()`, `getPublicKey()`, and `signTransaction(xdr, { networkPassphrase, address? })` are all implemented, backed by the real `@stellar/freighter-api` package.
* **xBull** (`xbull.ts`) / **Albedo** (`albedo.ts`): detection only (`isAvailable()`). No public-key or signing methods yet.

### 4. React Toolkit (`src/react/useGasless.ts`)
* **`useGaslessTransaction(client)` Hook**: takes a `GaslessClient` instance, exposes `{ submit, isSubmitting, error, txHash }`. `submit(signedInnerTxXdr)` expects a transaction you've already built and signed — see the usage example below.

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
- [ ] **xBull & Albedo wallet signing**: `signTransaction()` for these two — currently only detection exists. Left unimplemented rather than writing unverified code against wallets this project has no way to test against.
- [ ] **High-level execute helper**: a `{contractId, method, params}` → build + sign + submit convenience wrapper (not built yet; you currently build and sign the inner transaction yourself).
- [ ] **React Native & Flutter Adapters**: Mobile SDK adapters supporting mobile WebAuthn passkey enclaves.
- [ ] **Vue & Svelte Component Libraries**: Native hooks and wrappers for Vue 3 and Svelte.
- [ ] **Auto-Retry Failover Engine**: Multi-relayer endpoint failover routing.
