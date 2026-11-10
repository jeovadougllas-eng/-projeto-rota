// Owner-approved Web/PWA release. Android builds and distribution are suspended.
process.env.ROTAMAPA_PUBLIC_RELEASE='1';
await import('./build-preview-runtime.mjs');
