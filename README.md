# ⚡ `@stellar-gasless/sdk`

[![npm version](https://img.shields.io/badge/npm-v1.0.0-cb3837.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-Hooks--Ready-61dafb.svg?style=for-the-badge&logo=react)](https://react.dev/)

Official Client SDK & Wallet Integration Toolkit for enabling **Gasless Meta-Transactions** and **Paymaster Fee Delegation** in Stellar & Soroban web applications.

---

## 🚀 Key Features

* **Zero-Gas User Onboarding**: Allows dApp users to execute smart contract calls without holding XLM native gas tokens.
* **React Hooks**: Pre-packaged `useGaslessTransaction` hook with built-in loading spinners and error state handling.
* **WebAuthn / Passkeys Adapter**: Sign Soroban authorization entries using browser-native TouchID / FaceID biometrics.
* **Stellar Wallet Adapters**: Plug-and-play wallet signers for Freighter and xBull extension wallets.
* **Resilient Relayer Failover**: Automatic fallback relayer endpoints if the primary relayer node is degraded.

---

## 📦 Installation

```bash
npm install @stellar-gasless/sdk @stellar/stellar-sdk
# or
yarn add @stellar-gasless/sdk @stellar/stellar-sdk
```

---

## 💡 Quickstart Integration

### 1. Initialize `GaslessClient`

```typescript
import { GaslessClient } from '@stellar-gasless/sdk';

const gaslessClient = new GaslessClient({
  relayerUrl: 'https://relayer.stellar-gasless.net',
  dappApiKey: 'st_gas_live_your_api_key_here',
});
```

### 2. React Hook Example (`Next.js` / `React`)

```tsx
import React from 'react';
import { useGaslessTransaction } from '@stellar-gasless/sdk';

export function MintNFTButton({ signedInnerTxXdr }: { signedInnerTxXdr: string }) {
  const { submit, isSubmitting, txHash, error } = useGaslessTransaction(gaslessClient);

  const handleGaslessMint = async () => {
    const result = await submit(signedInnerTxXdr);
    if (result?.success) {
      console.log('NFT Minted Gaslessly! Tx Hash:', result.hash);
    }
  };

  return (
    <div>
      <button onClick={handleGaslessMint} disabled={isSubmitting}>
        {isSubmitting ? 'Sponsoring Gas & Minting...' : 'Gasless Mint NFT (0 XLM)'}
      </button>

      {txHash && <p>Success! Hash: {txHash}</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}
```

### 3. Biometric Passkey Signing (`TouchID` / `FaceID`)

```typescript
import { PasskeyAdapter } from '@stellar-gasless/sdk';

// Trigger native browser biometric popup
const credential = await PasskeyAdapter.signChallenge(challengeHexPayload);
console.log('Signed with Passkey Biometrics:', credential);
```

---

## 📋 Wallet Compatibility Matrix

| Wallet / Signer | Gasless Signature Support | Adapter Module |
| :--- | :--- | :--- |
| **Passkeys / WebAuthn** | ✅ Native Biometrics (TouchID/FaceID) | `@stellar-gasless/sdk/passkey` |
| **Freighter Wallet** | ✅ Ed25519 Off-chain Intent | `@stellar-gasless/sdk/freighter` |
| **xBull Wallet** | ✅ Supported | `@stellar-gasless/sdk/xbull` |
| **Albedo / LOBSTR** | ✅ Supported | Via standard Horizon XDR payload |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
