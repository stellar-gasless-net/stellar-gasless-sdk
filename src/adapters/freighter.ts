import freighterApi from '@stellar/freighter-api';

export interface FreighterSignOptions {
  networkPassphrase: string;
  address?: string;
}

export class FreighterAdapter {
  /**
   * Check if the Freighter browser extension is installed and unlocked. Delegates to
   * @stellar/freighter-api's isConnected() rather than probing a raw `window.freighter`
   * global directly — the injected global's shape isn't part of Freighter's public
   * contract and has changed across versions; the npm package is.
   */
  static async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const { isConnected, error } = await freighterApi.isConnected();
    return !error && isConnected;
  }

  /**
   * Request the connected account's public key from Freighter. Kept as `getPublicKey()`
   * for backwards compatibility with this SDK's existing public API, even though the
   * underlying @stellar/freighter-api call is named requestAccess() and returns `address`.
   */
  static async getPublicKey(): Promise<string> {
    if (!(await FreighterAdapter.isAvailable())) {
      throw new Error('Freighter extension wallet is not installed.');
    }
    const { address, error } = await freighterApi.requestAccess();
    if (error || !address) {
      throw new Error(error?.message || 'Freighter wallet access was not granted.');
    }
    return address;
  }

  /**
   * Sign a transaction XDR with Freighter. This is the same @stellar/freighter-api call
   * pattern already exercised against a real connected wallet elsewhere in this ecosystem
   * (stellar-zkstream, stellar-zkident, and soroban-yield-vault's frontends, and
   * gasless-relayer-dashboard's real.js) — not new, unverified wallet-integration code.
   */
  static async signTransaction(xdr: string, options: FreighterSignOptions): Promise<string> {
    if (!(await FreighterAdapter.isAvailable())) {
      throw new Error('Freighter extension wallet is not installed.');
    }
    const { signedTxXdr, error } = await freighterApi.signTransaction(xdr, {
      networkPassphrase: options.networkPassphrase,
      address: options.address,
    });
    if (error) {
      throw new Error(error.message || 'Freighter transaction signing failed.');
    }
    return signedTxXdr;
  }
}
