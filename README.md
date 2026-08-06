# 📦 `@stellar-gasless/sdk` (`stellar-gasless-sdk`)

[![npm](https://img.shields.io/badge/npm-v1.0.0-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](./CONTRIBUTING.md)

**Official TypeScript Client SDK & React Integration Toolkit providing dApps with seamless 1-line gasless execution, WebAuthn Passkey biometric signers, and Freighter/xBull/Albedo wallet adapters.**

This repository houses the **Client SDK & Developer Integration Toolkit** for the [`stellar-gasless-net`](https://github.com/stellar-gasless-net) ecosystem.

---

## 🏛️ SDK Integration Architecture

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

## 🛠️ Detailed Component Capabilities

### 1. `GaslessClient` (`src/client.ts`)
* **1-Line Transport**: Submits off-chain signed intents to the Relayer service over HTTP, handling auto-retry, status polling, and error parsing.

### 2. `PasskeyAdapter` (`src/adapters/passkey.ts`)
* **Browser WebAuthn Enclave**: Invokes browser TouchID / FaceID biometric hardware (`secp256r1`) for 0-XLM signature generation without requiring extension downloads.

### 3. Extension Wallet Adapters (`src/adapters/`)
* **Unified Wallet Interfaces**: Provides standardized adapters for Freighter (`freighter.ts`), xBull (`xbull.ts`), and Albedo (`albedo.ts`).

### 4. React Toolkit (`src/react/useGasless.ts`)
* **`useGaslessTransaction` Hook**: Exposes reactive state (`loading`, `txHash`, `error`, `executeGaslessTx`) for instant dApp UI integration.

---

## 💻 Full Code Integration Examples

### Example 1: Submit Meta-Transaction via TypeScript Client
```typescript
import { GaslessClient } from '@stellar-gasless/sdk';

const gaslessClient = new GaslessClient({
  relayerUrl: 'https://relayer.stellar-gasless.net',
  dappApiKey: 'st_gas_live_e92a84b19f2a',
});

// Request 0-XLM gasless execution
const result = await gaslessClient.submitGaslessTransaction(signedInnerTxXdr);
console.log('Gasless Meta-Tx Hash:', result.hash);
```

### Example 2: Request WebAuthn Passkey Biometric Signature
```typescript
import { PasskeyAdapter } from '@stellar-gasless/sdk';

// Prompt browser TouchID / FaceID enclave
const credential = await PasskeyAdapter.signChallenge(challengeHex);
console.log('Passkey Credential ID:', credential.id);
```

---

## 🤝 Contributing & `CONTRIBUTING.md` Guidelines

Please review our dedicated **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** guide before opening pull requests:
* 📖 **[SDK Contributor Guide](./CONTRIBUTING.md)**
* 🛡️ **[Security Disclosure Policy](./SECURITY.md)**

### 📌 Pull Request Checklist:
- [ ] Claim an issue tagged `good first issue`, `intermediate`, or `advanced`.
- [ ] Run `npm test` and verify TypeScript compilation (`npm run build`).
- [ ] Follow Conventional Commits format (`feat: ...`, `fix: ...`, `docs: ...`).

---

## 🔮 Future Improvements & SDK Roadmap

- [ ] **React Native & Flutter Adapters**: Mobile SDK adapters supporting mobile WebAuthn passkey enclaves.
- [ ] **Vue & Svelte Component Libraries**: Native hooks and wrappers for Vue 3 and Svelte.
- [ ] **Auto-Retry Failover Engine**: Multi-relayer endpoint failover routing.
