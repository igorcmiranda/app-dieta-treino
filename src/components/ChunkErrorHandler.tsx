"use client";

import { useEffect } from 'react';

const CHUNK_RELOAD_KEY = 'fitai_chunk_reload_once';

function isChunkLoadErrorMessage(message: string) {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('chunkloaderror') ||
    text.includes('loading chunk') ||
    text.includes('failed to fetch dynamically imported module')
  );
}

export function ChunkErrorHandler() {
  useEffect(() => {
    const tryReload = () => {
      if (typeof window === 'undefined') return;
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      const message = event?.message || '';
      if (isChunkLoadErrorMessage(message)) {
        tryReload();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = (event.reason?.message || event.reason || '').toString();
      if (isChunkLoadErrorMessage(reason)) {
        tryReload();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
