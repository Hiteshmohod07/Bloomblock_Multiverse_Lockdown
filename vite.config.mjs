import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const workspace = fileURLToPath(new URL('./', import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL('./client', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react(), tailwindcss()],
  build: { outDir: fileURLToPath(new URL('./web-dist', import.meta.url)), emptyOutDir: true },
  server: { host: '127.0.0.1', port: 5174, fs: { allow: [workspace] } },
});
