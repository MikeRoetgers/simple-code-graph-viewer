/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true }),
  ],
  test: {
    environment: 'jsdom',
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname!, 'src/index.ts'),
      name: 'SimpleCodeGraphViewer',
      formats: ['es', 'cjs'],
      fileName: (format) => `simple-code-graph-viewer.${format === 'es' ? 'js' : 'cjs'}`,
    },
    cssFileName: 'style',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.some((n) => n.endsWith('.css'))) {
            return 'style.css';
          }
          return assetInfo.names?.[0] ?? '[name].[ext]';
        },
      },
    },
    sourcemap: true,
  },
});
