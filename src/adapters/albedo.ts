export class AlbedoAdapter {
  /**
   * Albedo signs via a hosted popup/redirect flow rather than an injected
   * browser global, so unlike Freighter/xBull there's nothing extension-specific
   * to detect — any browser environment can use it. signChallenge()/signTransaction()
   * are not implemented yet.
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined';
  }
}
