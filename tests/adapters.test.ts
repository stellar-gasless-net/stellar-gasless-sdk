import { describe, it, expect } from 'vitest';
import { FreighterAdapter } from '../src/adapters/freighter';
import { XBullAdapter } from '../src/adapters/xbull';
import { AlbedoAdapter } from '../src/adapters/albedo';
import { PasskeyAdapter } from '../src/adapters/passkey';

// These run in vitest's default Node environment (no `window`), so they exercise
// the real "not in a browser" code paths rather than a mocked-out happy path.

describe('wallet adapter detection outside a browser', () => {
  it('FreighterAdapter.isAvailable() is false with no window', async () => {
    expect(await FreighterAdapter.isAvailable()).toBe(false);
  });

  it('FreighterAdapter.getPublicKey() throws with no window instead of hanging or faking a key', async () => {
    await expect(FreighterAdapter.getPublicKey()).rejects.toThrow(/not installed/);
  });

  it('FreighterAdapter.signTransaction() throws with no window instead of hanging or faking a signature', async () => {
    await expect(
      FreighterAdapter.signTransaction('AAAAAgAAAAA=', { networkPassphrase: 'Test SDF Network ; September 2015' })
    ).rejects.toThrow(/not installed/);
  });

  it('XBullAdapter.isAvailable() is false with no window', async () => {
    expect(await XBullAdapter.isAvailable()).toBe(false);
  });

  it('AlbedoAdapter.isAvailable() is false with no window (Node, not a browser)', () => {
    expect(AlbedoAdapter.isAvailable()).toBe(false);
  });

  it('PasskeyAdapter.signChallenge() throws a clear error with no WebAuthn support', async () => {
    await expect(PasskeyAdapter.signChallenge('deadbeef')).rejects.toThrow(/WebAuthn/);
  });
});
