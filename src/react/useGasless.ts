import { useState } from 'react';
import { GaslessClient, RelayResponse } from '../client';

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
