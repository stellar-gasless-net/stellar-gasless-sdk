# `@stellar-gasless/sdk`

TypeScript client SDK for integrating **Gasless Meta-Transactions** into Stellar & Soroban web applications.

## 📦 Installation

```bash
npm install @stellar-gasless/sdk @stellar/stellar-sdk
```

## 💡 Usage Example

```typescript
import { GaslessClient } from '@stellar-gasless/sdk';

const client = new GaslessClient({
  relayerUrl: 'https://relayer.stellar-gasless.net',
  dappApiKey: 'your-dapp-api-key',
});

// Submit user inner transaction without user paying gas
const result = await client.submitGaslessTransaction(signedInnerTxXdr);
console.log('Transaction submitted gaslessly! Hash:', result.hash);
```
