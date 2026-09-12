import { useState } from 'react';
import { hasVerifiedCredential, VerifiedCredentialCheck } from '../utils/zkident';

export interface UseVerifiedCredentialReturn {
  checking: boolean;
  verified: boolean | null;
  error: string | null;
  check: (userAddress: string) => Promise<boolean>;
}

/**
 * React convenience wrapper around utils/zkident.ts's hasVerifiedCredential — same real
 * on-chain check, exposed as {checking, verified, error, check(address)} so a dApp can gate
 * UI (a button, a higher spend limit, an unlocked feature) on a real verified credential in
 * a couple of lines, the same shape useGasless.ts's hook already gives submit().
 */
export function useVerifiedCredential(options: VerifiedCredentialCheck): UseVerifiedCredentialReturn {
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async (userAddress: string): Promise<boolean> => {
    setChecking(true);
    setError(null);
    try {
      // hasVerifiedCredential itself never throws — it fails closed to false on any RPC
      // error. This try/catch only guards against something genuinely unexpected, kept for
      // the same defensive reasons useGasless.ts's submit() wraps its own call.
      const result = await hasVerifiedCredential(userAddress, options);
      setVerified(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Credential check failed');
      setVerified(false);
      return false;
    } finally {
      setChecking(false);
    }
  };

  return { checking, verified, error, check };
}
