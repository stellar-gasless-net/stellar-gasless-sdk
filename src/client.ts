export interface GaslessConfig {
  relayerUrl: string;
  dappApiKey: string;
  networkPassphrase?: string;
}

export interface RelayResponse {
  success: boolean;
  hash?: string;
  error?: string;
}

export class GaslessClient {
  private config: GaslessConfig;

  constructor(config: GaslessConfig) {
    this.config = config;
  }

  /**
   * Submit an inner transaction signed by user to relayer with safe JSON parsing
   */
  async submitGaslessTransaction(innerTransactionXdr: string): Promise<RelayResponse> {
    try {
      const response = await fetch(`${this.config.relayerUrl}/v1/relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.dappApiKey,
        },
        body: JSON.stringify({
          innerTransactionXdr,
          dappApiKey: this.config.dappApiKey,
        }),
      });

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        return {
          success: false,
          error: `Non-JSON HTTP ${response.status} response from Relayer server: ${text.substring(0, 100)}`,
        };
      }
    } catch (networkError: any) {
      return {
        success: false,
        error: networkError.message || 'Failed to connect to Relayer endpoint',
      };
    }
  }
}
