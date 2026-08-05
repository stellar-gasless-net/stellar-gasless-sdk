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
   * Submit an inner transaction signed by user to relayer
   */
  async submitGaslessTransaction(innerTransactionXdr: string): Promise<RelayResponse> {
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

    return await response.json();
  }
}
