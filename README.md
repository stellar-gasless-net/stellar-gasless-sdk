# `@stellar-gasless/sdk` (`stellar-gasless-sdk`)

[![npm](https://img.shields.io/badge/npm-v1.0.0-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](./CONTRIBUTING.md)

**TypeScript client SDK for talking to a `stellar-gasless-relayer` instance: submit a signed inner transaction and get it relayed as a sponsored FeeBumpTransaction, plus a WebAuthn passkey signer and wallet-detection helpers.**

**Current status:** `GaslessClient.submitGaslessTransaction()` and `PasskeyAdapter.signChallenge()` are implemented and tested. The Freighter/xBull/Albedo adapters currently only *detect* whether those wallets are present (Freighter also fetches a public key) — none of them can sign a transaction yet. There is no high-level "build a contract call and sign it in one line" helper; you build and sign the inner transaction yourself before handing it to this SDK.

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

### 3. Wallet Detection Adapters (`src/adapters/`)
* **Freighter** (`freighter.ts`): `isAvailable()` and `getPublicKey()` are implemented. No `signTransaction()` yet.
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

- [ ] **Wallet signing**: `signTransaction()` for Freighter, xBull, and Albedo — currently only detection/public-key retrieval exists.
- [ ] **High-level execute helper**: a `{contractId, method, params}` → build + sign + submit convenience wrapper (not built yet; you currently build and sign the inner transaction yourself).
- [ ] **React Native & Flutter Adapters**: Mobile SDK adapters supporting mobile WebAuthn passkey enclaves.
- [ ] **Vue & Svelte Component Libraries**: Native hooks and wrappers for Vue 3 and Svelte.
- [ ] **Auto-Retry Failover Engine**: Multi-relayer endpoint failover routing.
