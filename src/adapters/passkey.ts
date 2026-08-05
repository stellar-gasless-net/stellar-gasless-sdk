export interface PasskeyCredential {
  id: string;
  rawId: ArrayBuffer;
  response: {
    clientDataJSON: ArrayBuffer;
    authenticatorData: ArrayBuffer;
    signature: ArrayBuffer;
  };
}

export class PasskeyAdapter {
  /**
   * Request browser WebAuthn / Passkey biometric signature (TouchID / FaceID)
   */
  static async signChallenge(challengeHex: string): Promise<PasskeyCredential> {
    if (!navigator.credentials || !navigator.credentials.get) {
      throw new Error('WebAuthn Passkeys are not supported in this browser environment.');
    }

    const challengeBuffer = Uint8Array.from(Buffer.from(challengeHex, 'hex'));

    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge: challengeBuffer,
        userVerification: 'required',
        timeout: 60000,
      },
    })) as unknown as PasskeyCredential;

    return credential;
  }
}
