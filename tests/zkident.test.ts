import { describe, it, expect, vi, afterEach } from 'vitest';
import { StrKey, nativeToScVal } from '@stellar/stellar-sdk';
import { hasVerifiedCredential, STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID } from '../src/utils/zkident';

const USER = 'GAUZ4T6UT7XMGOL6WYPWWSYPZQ7ZLILCAS2ROYCH5ILHHOWQYUGVRTAB';

function rpcResultFor(value: boolean) {
  return {
    jsonrpc: '2.0',
    id: 1,
    result: { results: [{ xdr: nativeToScVal(value).toXDR('base64') }] },
  };
}

describe('hasVerifiedCredential', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when the configured credential_verifier reports has_credential = true', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => rpcResultFor(true) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await hasVerifiedCredential(USER, {
      credentialVerifierId: STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID,
      credentialType: 'kyc_tier_2',
    });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.method).toBe('simulateTransaction');
  });

  it('returns false when the configured credential_verifier reports has_credential = false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => rpcResultFor(false) }));

    const result = await hasVerifiedCredential(USER, {
      credentialVerifierId: STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID,
      credentialType: 'kyc_tier_2',
    });

    expect(result).toBe(false);
  });

  it('works against any caller-supplied credential_verifier contract, not just the zkident default', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => rpcResultFor(true) });
    vi.stubGlobal('fetch', fetchMock);

    // A real, checksum-valid contract strkey derived from an arbitrary fixed byte pattern —
    // a hand-typed "CAAAA...AAA" string fails StrKey's own checksum validation, since
    // contract addresses aren't just any 56-character string starting with C.
    const someOtherDappsVerifier = StrKey.encodeContract(Buffer.alloc(32, 7));
    const result = await hasVerifiedCredential(USER, {
      credentialVerifierId: someOtherDappsVerifier,
      credentialType: 'some_other_dapps_credential',
    });

    expect(result).toBe(true);
  });

  it('fails closed to false (not thrown) when Soroban RPC returns a JSON-RPC error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: async () => ({ jsonrpc: '2.0', id: 1, error: { code: -32602, message: 'boom' } }) })
    );

    await expect(
      hasVerifiedCredential(USER, { credentialVerifierId: STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID, credentialType: 'kyc_tier_2' })
    ).resolves.toBe(false);
  });

  it('fails closed to false (not thrown) when the network request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(
      hasVerifiedCredential(USER, { credentialVerifierId: STELLAR_ZKIDENT_TESTNET_CREDENTIAL_VERIFIER_ID, credentialType: 'kyc_tier_2' })
    ).resolves.toBe(false);
  });
});
