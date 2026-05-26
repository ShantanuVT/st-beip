'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Returns a debounced version of the callback.
 * The debounced callback delays invoking `fn` until `delay` ms
 * have elapsed since the last invocation.
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedFn;
}

/**
 * Returns a throttled version of the callback.
 * The throttled callback invokes `fn` at most once every `limit` ms.
 */
export function useThrottle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  const inThrottleRef = useRef(false);

  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottleRef.current) {
        fn(...args);
        inThrottleRef.current = true;
        setTimeout(() => {
          inThrottleRef.current = false;
        }, limit);
      }
    },
    [fn, limit]
  );

  return throttledFn;
}
