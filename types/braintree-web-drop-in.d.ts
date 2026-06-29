/**
 * Minimal ambient type shim for braintree-web-drop-in.
 * The package ships no TypeScript declarations; this shim provides just enough
 * for BraintreeDropIn.tsx to compile cleanly.
 */
declare module "braintree-web-drop-in" {
  export interface Dropin {
    requestPaymentMethod(): Promise<{ nonce: string }>;
    teardown(): Promise<void>;
  }

  export interface CreateOptions {
    authorization: string;
    container: HTMLElement | string;
  }

  const dropin: {
    create(options: CreateOptions): Promise<Dropin>;
  };

  export default dropin;
}
