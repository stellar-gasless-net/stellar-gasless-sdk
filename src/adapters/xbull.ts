export class XBullAdapter {
  /**
   * Check if xBull wallet is available
   */
  static async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && (window as any).xBullWallet !== undefined;
  }
}
