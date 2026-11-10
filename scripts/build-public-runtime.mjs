// The owner authorized publishing the complete release in this conversation.
// Reuse the strict public allowlist; include only the verified current Android update.
process.env.ROTAMAPA_PUBLIC_RELEASE='1';
await import('./build-preview-runtime.mjs');
