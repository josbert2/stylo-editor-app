import { defineConfig } from 'vite';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite'

const NAMESPACE_PREFIX = process.env.NAMESPACE || 'tippy';


export default defineConfig({
  root: path.resolve('test/visual'),
  server: {
    port: 1234,
    // history fallback si usas router
    fs: { strict: false },
  },
  define: {
    __NAMESPACE_PREFIX__: JSON.stringify(NAMESPACE_PREFIX),
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  css: { devSourcemap: true },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  plugins: [
    tailwindcss(),
  ],
});
