import react from '@vitejs/plugin-react';
// Browser APIs in this visual harness use a separate fixture adapter.
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      'wxt/browser': fileURLToPath(new URL('./browser-fixture.ts', import.meta.url)),
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    watch: { awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 30 } },
  },
});
