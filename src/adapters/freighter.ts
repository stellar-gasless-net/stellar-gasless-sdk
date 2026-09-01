// NOTE: signTransaction() is not implemented yet for any adapter in this SDK
// (Freighter, xBull, or Albedo) — only wallet detection and public-key retrieval
// exist so far. Getting an actual user signature on the inner transaction is
// still open work; see the repo's issue tracker.
export class FreighterAdapter {
  /**
   * Check if Freighter browser extension wallet is installed
   */
  static async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && (window as any).freighter !== undefined;
  }

  /**
   * Request public key from Freighter
   */
  static async getPublicKey(): Promise<string> {
    if (typeof window !== 'undefined' && (window as any).freighter) {
      return await (window as any).freighter.getPublicKey();
    }
    throw new Error('Freighter extension wallet is not installed.');
  }
}
