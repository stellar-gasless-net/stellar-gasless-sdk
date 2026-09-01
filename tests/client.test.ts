import { describe, it, expect, vi, afterEach } from 'vitest';
import { GaslessClient } from '../src/client';

describe('GaslessClient.submitGaslessTransaction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the inner tx XDR and API key, and returns the parsed relay response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ success: true, hash: 'abc123' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new GaslessClient({ relayerUrl: 'https://relayer.example.test', dappApiKey: 'test-key' });
    const result = await client.submitGaslessTransaction('AAAA...xdr');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://relayer.example.test/v1/relay',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-API-Key': 'test-key' }),
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.innerTransactionXdr).toBe('AAAA...xdr');
    expect(result).toEqual({ success: true, hash: 'abc123' });
  });

  it('returns a clear error instead of throwing when the relayer responds with non-JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 502, text: async () => '<html>Bad Gateway</html>' })
    );

    const client = new GaslessClient({ relayerUrl: 'https://relayer.example.test', dappApiKey: 'test-key' });
    const result = await client.submitGaslessTransaction('AAAA...xdr');

    expect(result.success).toBe(false);
    expect(result.error).toContain('502');
  });

  it('returns a clear error instead of throwing when the network request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const client = new GaslessClient({ relayerUrl: 'https://relayer.example.test', dappApiKey: 'test-key' });
    const result = await client.submitGaslessTransaction('AAAA...xdr');

    expect(result.success).toBe(false);
    expect(result.error).toBe('network down');
  });
});
