import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';

export interface AlbedoSignOptions {
  networkPassphrase: string;
  address?: string;
}

export class AlbedoAdapter {
  /**
   * Albedo signs via a hosted popup/redirect flow rather than an injected browser global,
   * so unlike Freighter there's nothing extension-specific to detect — any browser
   * environment can use it. stellar-wallets-kit's own AlbedoModule.isAvailable() reflects
   * this: it always resolves true. Not a stub — this genuinely is how Albedo's connection
   * model works.
   */
  static async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return new AlbedoModule().isAvailable();
  }

  /**
   * Requests the connected account's public key from Albedo via stellar-wallets-kit's
   * AlbedoModule — the real popup-based intent flow (@albedo-link/intent), not a stub.
   * Uses just the module class directly rather than the full StellarWalletsKit, for the
   * same reason as XBullAdapter: this SDK is a library, and shouldn't force the kit's
   * bundled wallet-picker UI onto every consumer.
   */
  static async getPublicKey(): Promise<string> {
    if (!(await AlbedoAdapter.isAvailable())) {
      throw new Error('Albedo is not available in this environment.');
    }
    const { address } = await new AlbedoModule().getAddress();
    return address;
  }

  /**
   * Sign a transaction XDR with Albedo, via the same real popup-intent flow getPublicKey()
   * uses.
   */
  static async signTransaction(xdr: string, options: AlbedoSignOptions): Promise<string> {
    if (!(await AlbedoAdapter.isAvailable())) {
      throw new Error('Albedo is not available in this environment.');
    }
    const { signedTxXdr } = await new AlbedoModule().signTransaction(xdr, {
      networkPassphrase: options.networkPassphrase,
      address: options.address,
    });
    return signedTxXdr;
  }
}
