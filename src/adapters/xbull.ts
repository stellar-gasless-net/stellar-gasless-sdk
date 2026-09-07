import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';

export interface XBullSignOptions {
  networkPassphrase: string;
  address?: string;
}

export class XBullAdapter {
  /**
   * Unlike Freighter, xBull has no injected browser global to synchronously detect — it
   * connects via a popup/bridge protocol (xBullWalletConnect), so "availability" really
   * means "we're in a browser and could attempt a connection," not "the extension is
   * definitely installed." stellar-wallets-kit's own xBullModule.isAvailable() reflects
   * this: it always resolves true once `window` exists. That's not a bug being worked
   * around here — it's genuinely how xBull's connection model works; an install prompt
   * only surfaces once getPublicKey() actually attempts to connect.
   */
  static async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return new xBullModule().isAvailable();
  }

  /**
   * Requests the connected account's public key from xBull via stellar-wallets-kit's
   * xBullModule — the real bridge-connect flow (xBullWalletConnect), not a stub. Uses
   * just the module class directly rather than the full StellarWalletsKit (which also
   * bundles a preact-based wallet-picker modal UI); this SDK is a library other apps
   * embed, so it shouldn't force a UI framework onto every consumer just to sign a
   * transaction. Note this means @creit.tech/stellar-wallets-kit becomes a real dependency
   * of this SDK — see this repo's CONTRIBUTING.md for that tradeoff.
   */
  static async getPublicKey(): Promise<string> {
    if (!(await XBullAdapter.isAvailable())) {
      throw new Error('xBull is not available in this environment.');
    }
    const { address } = await new xBullModule().getAddress();
    return address;
  }

  /**
   * Sign a transaction XDR with xBull, via the same real bridge-connect flow getPublicKey()
   * uses.
   */
  static async signTransaction(xdr: string, options: XBullSignOptions): Promise<string> {
    if (!(await XBullAdapter.isAvailable())) {
      throw new Error('xBull is not available in this environment.');
    }
    const { signedTxXdr } = await new xBullModule().signTransaction(xdr, {
      networkPassphrase: options.networkPassphrase,
      address: options.address,
    });
    return signedTxXdr;
  }
}
