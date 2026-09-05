# Contributing to `@stellar-gasless/sdk`

Thank you for contributing to **`@stellar-gasless/sdk`**! 📦

This repository contains the official **TypeScript Client Library and React Integration Toolkit** enabling dApp frontends to interact seamlessly with Stellar Gasless Network.

---

## 📋 Table of Contents

1. [Ecosystem Overview](#-ecosystem-overview)
2. [Local Setup & Build](#-local-setup--build)
3. [SDK Library Architecture](#-sdk-library-architecture)
4. [Contributor Workflow](#-contributor-workflow)
5. [Code Style & Testing Requirements](#-code-style--testing-requirements)
6. [Git Commit Guidelines](#-git-commit-guidelines)

---

## 🏛️ Ecosystem Overview

`@stellar-gasless/sdk` provides client abstractions for Web3 frontends:

```
[ Next.js / React dApp ] ──► [ @stellar-gasless/sdk ] ──► [ Gasless Relayer ]
```

* 📜 [**`soroban-gasless-contracts`**](https://github.com/stellar-gasless-net/soroban-gasless-contracts)
* ⚡ [**`stellar-gasless-relayer`**](https://github.com/stellar-gasless-net/stellar-gasless-relayer)
* 📦 **`stellar-gasless-sdk`** (This Repo)
* 🖥️ [**`gasless-relayer-dashboard`**](https://github.com/stellar-gasless-net/gasless-relayer-dashboard)

---

## 🛠️ Local Setup & Build

### 1. Prerequisites
- **Node.js**: v20+
- **npm**: v10+

### 2. Setup
```bash
git clone https://github.com/YOUR-USERNAME/stellar-gasless-sdk.git
cd stellar-gasless-sdk
npm install
```

### 3. Build SDK Bundle
```bash
npm run build
```

---

## 📂 SDK Library Architecture

```
src/
├── adapters/
│   ├── passkey.ts      # WebAuthn TouchID / FaceID biometric signer
│   ├── freighter.ts    # Freighter extension wallet adapter
│   ├── xbull.ts        # xBull extension wallet adapter
│   └── albedo.ts       # Albedo web wallet adapter
├── react/
│   └── useGasless.ts   # React hook for transaction submission (no context provider yet — pass a GaslessClient directly)
├── utils/
│   └── xdr_parser.ts   # Decodes a real transaction envelope XDR into a summary
├── client.ts           # Core GaslessClient class
└── index.ts            # Public module exporter
```

---

## 🧪 Code Style & Testing Requirements

- Maintain strict TypeScript typing where practical (some browser wallet globals still need `any` since there are no official types).
- Keep React hooks reactive and clean.
- Run tests and compilation verification before opening a PR:
  ```bash
  npm test
  npm run build
  ```
CI runs both on every push and PR — see `.github/workflows/ci.yml`.

---

## 📝 Git Commit Guidelines

Follow **Conventional Commits**:
- `feat: add Albedo wallet adapter`
- `fix: handle network timeout error in GaslessClient`
- `docs: add Next.js integration guide`
