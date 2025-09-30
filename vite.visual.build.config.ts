import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: path.resolve('test/visual'),
  publicDir: false,
  build: {
    outDir: path.resolve('test/visual/dist'),
    emptyOutDir: false,
    sourcemap: true,
    cssCodeSplit: false,            // 1 solo CSS
    rollupOptions: {
      input: path.resolve('test/visual/tests.js'),
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: (asset) =>
          asset.name?.endsWith('.css') ? 'bundle.css' : 'assets/[name][extname]',
        // formato final es ES; si necesitas <script nomodule>, usa UMD en lib build
      },
    },
  },
});
