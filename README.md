# 📦 `@stellar-gasless/sdk` (`stellar-gasless-sdk`)

[![npm](https://img.shields.io/badge/npm-v1.0.0-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](./CONTRIBUTING.md)

**Official TypeScript Client SDK & React Integration Toolkit providing dApps with seamless 1-line gasless execution, WebAuthn Passkey biometric signers, and Freighter/xBull/Albedo wallet adapters.**

This package is the client-side SDK library for the [`stellar-gasless-net`](https://github.com/stellar-gasless-net) ecosystem.

---

## 🛠️ SDK Features & Adapters

* **`GaslessClient` (`client.ts`)**: Primary client interface handling payload submission, RPC failover, and status polling.
* **WebAuthn Passkey Adapter (`passkey.ts`)**: Browser-native WebAuthn TouchID / FaceID biometric signer adapter.
* **Browser Wallet Adapters**: Integrated adapters for Freighter (`freighter.ts`), xBull (`xbull.ts`), and Albedo (`albedo.ts`).
* **React Hooks (`useGasless.ts`)**: Ready-to-use `useGaslessTransaction` React hook for instant dApp UI integration.

---

## 🚀 Quick Usage Example

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

---

## 🤝 Contributing & Governance

Please read our enterprise contributor guidelines before submitting PRs:
* 📖 **[SDK Contributor Guide](./CONTRIBUTING.md)**
* 🛡️ **[Security Policy](./SECURITY.md)**
