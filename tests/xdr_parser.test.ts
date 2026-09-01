import { describe, it, expect } from 'vitest';
import { Account, Keypair, TransactionBuilder, Operation, Networks } from '@stellar/stellar-sdk';
import { XdrParser } from '../src/utils/xdr_parser';

const TEST_PASSPHRASE = Networks.TESTNET;

function buildTestTxXdr(): string {
  const source = Keypair.random();
  const account = new Account(source.publicKey(), '100');
  const tx = new TransactionBuilder(account, { fee: '1000', networkPassphrase: TEST_PASSPHRASE })
    .addOperation(Operation.bumpSequence({ bumpTo: '101' }))
    .setTimeout(30)
    .build();
  return tx.toXDR();
}

describe('XdrParser.inspectXdr', () => {
  it('decodes a real transaction envelope and reports its real fields', () => {
    const xdr = buildTestTxXdr();
    const summary = XdrParser.inspectXdr(xdr, TEST_PASSPHRASE);

    expect(summary.isFeeBump).toBe(false);
    expect(summary.operationCount).toBe(1);
    expect(summary.fee).toBe('1000');
    expect(summary.sourceAccount).toMatch(/^G[A-Z0-9]{55}$/);
  });

  it('throws on an empty string rather than returning a fake summary', () => {
    expect(() => XdrParser.inspectXdr('', TEST_PASSPHRASE)).toThrow();
  });

  it('throws on garbage input rather than returning a fake summary', () => {
    expect(() => XdrParser.inspectXdr('not-real-xdr-at-all', TEST_PASSPHRASE)).toThrow();
  });
});
