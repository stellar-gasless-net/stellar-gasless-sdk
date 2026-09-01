import { TransactionBuilder, FeeBumpTransaction, Transaction } from '@stellar/stellar-sdk';

export interface XdrSummary {
  sourceAccount: string;
  fee: string;
  operationCount: number;
  isFeeBump: boolean;
  sequence?: string;
}

export class XdrParser {
  /**
   * Actually decode a base64 transaction envelope XDR (not just inspect the raw string)
   * and pull out the fields a dApp typically wants to show the user before they sign.
   * Throws if the string isn't a valid transaction envelope for the given network.
   */
  static inspectXdr(xdrString: string, networkPassphrase: string): XdrSummary {
    if (!xdrString) {
      throw new Error('Invalid XDR string payload: empty');
    }

    const tx = TransactionBuilder.fromXDR(xdrString, networkPassphrase);

    if (tx instanceof FeeBumpTransaction) {
      return {
        sourceAccount: tx.feeSource,
        fee: tx.fee,
        operationCount: tx.innerTransaction.operations.length,
        isFeeBump: true,
      };
    }

    const innerTx = tx as Transaction;
    return {
      sourceAccount: innerTx.source,
      fee: innerTx.fee,
      operationCount: innerTx.operations.length,
      isFeeBump: false,
      sequence: innerTx.sequence,
    };
  }
}
