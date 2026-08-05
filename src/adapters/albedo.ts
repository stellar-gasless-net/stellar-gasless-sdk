export class AlbedoAdapter {
  /**
   * Check if Albedo wallet is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined';
  }
}
