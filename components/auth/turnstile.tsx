'use client';

import { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export function Turnstile({ siteKey, onSuccess, onError }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Wait for Turnstile script to load
    const renderTurnstile = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onSuccess,
          'error-callback': onError,
          theme: 'light',
          size: 'normal',
        });
      }
    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          renderTurnstile();
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey, onSuccess, onError]);

  return <div ref={containerRef} />;
}

