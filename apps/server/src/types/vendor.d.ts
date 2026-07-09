// Type shims for modules whose @types packages may not resolve in all environments.
// speakeasy and qrcode have @types packages, but adding shims here ensures builds
// succeed even if the workspace-level hoisting doesn't reach the package node_modules.

declare module 'speakeasy' {
  interface GenerateSecretOptions {
    length?: number;
    name?: string;
    issuer?: string;
  }

  interface SecretResult {
    ascii: string;
    base32: string;
    hex: string;
    qr_code_ascii?: string;
    qr_code_hex?: string;
    qr_code_base32?: string;
    google_auth_qr?: string;
    otpauth_url?: string;
  }

  interface TotpVerifyOptions {
    secret: string;
    token: string;
    encoding?: 'ascii' | 'base32' | 'hex';
    window?: number;
  }

  interface TotpOptions {
    secret: string;
    encoding?: 'ascii' | 'base32' | 'hex';
  }

  export function generateSecret(options?: GenerateSecretOptions): SecretResult;

  export const totp: {
    generate(options: TotpOptions): string;
    verify(options: TotpVerifyOptions): boolean;
  };
}

declare module 'qrcode' {
  export function toDataURL(text: string, options?: Record<string, unknown>): Promise<string>;
  export function toString(text: string, options?: Record<string, unknown>): Promise<string>;
}
