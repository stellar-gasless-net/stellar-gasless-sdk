// Detection only — getPublicKey()/signTransaction() are not implemented yet.
// Freighter's adapter is the only one wired up that far so far.
export class XBullAdapter {
  /**
   * Check if xBull wallet is available
   */
  static async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && (window as any).xBullWallet !== undefined;
  }
}
