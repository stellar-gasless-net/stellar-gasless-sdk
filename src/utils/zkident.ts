import { Account, Contract, TransactionBuilder, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';

// stellar-sdk's own well-known placeholder source account for read-only simulation — never
// submitted anywhere, only used to build a syntactically valid transaction to simulate.
const SIMULATION_ACCOUNT = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

/** stellar-zklab/stellar-zkident's own real deployed testnet credential_verifier — pass this
 * as `credentialVerifierId` if you want to check against zkident's own ecosystem-wide
 * credentials rather than deploying your own instance of that contract. Not a default: this
 * SDK never silently checks our contract when a caller forgets to configure their own. */
export const STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID = 'CDLRSLHALMX6OU5IHWY6CKTROK3SYENEA75K6OWSZCPAW4EOTR2OZGSF';

export interface VerifiedCredentialCheck {
  /** Any deployed contract implementing stellar-zkident's credential_verifier interface
   * (`has_credential(user: Address, credential_type: String) -> bool`) — your own, or
   * STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID above. Required: there is no default, on
   * purpose — a dApp that forgot to configure this should get an obvious wrong answer, not a
   * silent check against someone else's contract. */
  credentialVerifierId: string;
  credentialType: string;
  /** @default 'https://soroban-testnet.stellar.org' */
  rpcUrl?: string;
  /** @default 'Test SDF Network ; September 2015' */
  networkPassphrase?: string;
}

/**
 * Real, read-only cross-contract check for whether `userAddress` holds a verified credential
 * of `options.credentialType` — the exact same has_credential() gate
 * stellar-zklab/stellar-zkident's own reputation_nft::mint() and sybil_resistant_faucet::claim()
 * use on-chain, and the exact same one stellar-gasless-relayer now uses server-side to tier
 * sponsorship budgets (see that repo's src/relayer/zkident.ts). Published here so ANY dApp
 * using this SDK can add the same Sybil-resistance check client-side too — for a UI hint, a
 * gated action, or their own server-side policy — without depending on our relayer at all.
 *
 * Builds and simulates (never submits) the invocation with a raw Soroban RPC `fetch`, the
 * same lightweight approach stellar-gasless-relayer's own equivalent function uses, rather
 * than pulling in stellar-sdk's heavier contract.Client (which would fetch and parse the
 * whole contract spec over the network just for one fixed, known method signature).
 *
 * Fails closed: any RPC error, malformed response, or network failure is treated as "not
 * verified" rather than thrown — a credential-check outage should degrade a caller's UI, not
 * crash it.
 */
export async function hasVerifiedCredential(userAddress: string, options: VerifiedCredentialCheck): Promise<boolean> {
  const rpcUrl = options.rpcUrl || 'https://soroban-testnet.stellar.org';
  const networkPassphrase = options.networkPassphrase || 'Test SDF Network ; September 2015';

  try {
    const account = new Account(SIMULATION_ACCOUNT, '0');
    const op = new Contract(options.credentialVerifierId).call(
      'has_credential',
      nativeToScVal(userAddress, { type: 'address' }),
      nativeToScVal(options.credentialType, { type: 'string' })
    );
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase }).addOperation(op).setTimeout(30).build();

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'simulateTransaction',
        params: { transaction: tx.toXDR() },
      }),
    });
    const body = await response.json();

    if (body.error) {
      throw new Error(body.error.message || 'Soroban RPC returned an error');
    }
    if (body.result?.error) {
      throw new Error(String(body.result.error));
    }
    const resultXdr = body.result?.results?.[0]?.xdr;
    if (!resultXdr) {
      throw new Error('Soroban RPC returned no result for has_credential simulation');
    }

    return Boolean(scValToNative(xdr.ScVal.fromXDR(resultXdr, 'base64')));
  } catch (err: any) {
    console.error(`[stellar-gasless-sdk] has_credential check failed for ${userAddress}, treating as unverified: ${err.message ?? err}`);
    return false;
  }
}
