"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import dropin, { type Dropin } from "braintree-web-drop-in";

export type BraintreeDropInHandle = {
  /** Resolve the single-use Braintree nonce from the mounted Drop-in. */
  requestNonce: () => Promise<string>;
};

type Props = {
  /** Fired once the Drop-in is mounted and interactive. */
  onReady?: () => void;
  /** Fired with a user-facing message if the Drop-in fails to load. */
  onError?: (message: string) => void;
};

export const BraintreeDropIn = forwardRef<BraintreeDropInHandle, Props>(
  function BraintreeDropIn({ onReady, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<Dropin | null>(null);
    // Keep callbacks in refs so the mount effect can run exactly once without
    // re-initializing the Drop-in when the parent passes inline functions.
    const onReadyRef = useRef(onReady);
    const onErrorRef = useRef(onError);
    onReadyRef.current = onReady;
    onErrorRef.current = onError;

    const [status, setStatus] = useState<"loading" | "ready" | "error">(
      "loading"
    );

    useEffect(() => {
      let cancelled = false;

      async function init() {
        try {
          const res = await fetch("/api/catering/client-token");
          if (!res.ok) throw new Error(`token request failed: ${res.status}`);
          const { clientToken } = (await res.json()) as { clientToken: string };
          if (cancelled || !containerRef.current) return;

          const instance = await dropin.create({
            authorization: clientToken,
            container: containerRef.current,
          });

          if (cancelled) {
            await instance.teardown();
            return;
          }
          instanceRef.current = instance;
          setStatus("ready");
          onReadyRef.current?.();
        } catch (error) {
          console.error("[BraintreeDropIn] init error:", error);
          if (!cancelled) {
            setStatus("error");
            onErrorRef.current?.(
              "Could not load the payment form. Please refresh and try again."
            );
          }
        }
      }

      void init();

      return () => {
        cancelled = true;
        if (instanceRef.current) {
          void instanceRef.current.teardown();
          instanceRef.current = null;
        }
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        async requestNonce() {
          if (!instanceRef.current) {
            throw new Error("Payment form is not ready yet.");
          }
          const { nonce } = await instanceRef.current.requestPaymentMethod();
          return nonce;
        },
      }),
      []
    );

    return (
      <div className="space-y-2">
        <div ref={containerRef} aria-busy={status === "loading"} />
        {status === "loading" && (
          <p className="text-warm-gray text-sm">Loading secure payment form…</p>
        )}
        {status === "error" && (
          <p className="text-maroon text-sm">
            Could not load the payment form. Please refresh and try again.
          </p>
        )}
      </div>
    );
  }
);
