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
