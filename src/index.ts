// React hooks (useGaslessTransaction, useVerifiedCredential) live under a separate
// '@stellar-gasless/sdk/react' subpath (see src/react/index.ts + package.json's "exports"),
// not re-exported here. They were originally exported from this same root entry point, but
// that meant require('@stellar-gasless/sdk') transitively loaded 'react' even for a plain
// Node/vanilla-JS consumer with no React installed at all — confirmed as a real, genuine
// MODULE_NOT_FOUND crash via an actual fresh `npm install` + `require()` smoke test, not a
// hypothetical. peerDependencies/peerDependenciesMeta marks react as optional; this split is
// what actually makes that true rather than contradicted by the code.
export * from './client';
export * from './adapters/passkey';
export * from './adapters/freighter';
export * from './adapters/xbull';
export * from './adapters/albedo';
export * from './utils/xdr_parser';
export * from './utils/zkident';
