import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(import.meta.dirname!, 'src/standalone'),
  publicDir: resolve(import.meta.dirname!, 'fixtures'),
  build: {
    outDir: resolve(import.meta.dirname!, 'dist/standalone'),
    emptyOutDir: true,
  },
  server: { open: true },
});
