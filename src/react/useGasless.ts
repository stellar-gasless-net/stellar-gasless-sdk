import { useState } from 'react';
import { GaslessClient, RelayResponse } from '../client';

// NOTE: This hook takes an already-built, already-signed inner transaction XDR —
// it does not (yet) build a contract invocation for you or get it signed by a
// connected wallet. A higher-level helper that takes {contractId, method, params}
// and handles building + wallet signing + submission in one call does not exist
// yet; it's on the roadmap, not shipped. Build the inner transaction yourself
// (e.g. via `Contract.call()` from @stellar/stellar-sdk) and get it signed
// (e.g. via PasskeyAdapter or a connected wallet) before passing it to submit().

export interface UseGaslessReturn {
  submit: (innerTxXdr: string) => Promise<RelayResponse | null>;
  isSubmitting: boolean;
  error: string | null;
  txHash: string | null;
}

export function useGaslessTransaction(client: GaslessClient): UseGaslessReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const submit = async (innerTxXdr: string): Promise<RelayResponse | null> => {
    setIsSubmitting(true);
    setError(null);
    setTxHash(null);

    try {
      const res = await client.submitGaslessTransaction(innerTxXdr);
      if (res.success && res.hash) {
        setTxHash(res.hash);
      } else {
        setError(res.error || 'Transaction relay failed');
      }
      return res;
    } catch (err: any) {
      setError(err.message || 'Network error during submission');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error, txHash };
}
