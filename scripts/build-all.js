import { build } from 'vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { rimraf } from 'rimraf';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const NAMESPACE_PREFIX = process.env.NAMESPACE || 'tippy';

const banner = `/**!
* tippy-like-boilerplate v${pkg.version}
* MIT License
*/`;

await rimraf('dist');
await rimraf('headless/dist');

const builds = [
  {
    input: 'build/base-umd.js',
    output: 'dist/tippy.umd.js',
    format: 'umd',
    minify: false,
    env: 'development',
  },
  {
    input: 'build/bundle-umd.js',
    output: 'dist/tippy-bundle.umd.js',
    format: 'umd',
    minify: false,
    env: 'development',
    extractCSS: 'dist/tippy.css',
  },
  {
    input: 'build/base-umd.js',
    output: 'dist/tippy.umd.min.js',
    format: 'umd',
    minify: true,
    env: 'production',
  },
  {
    input: 'build/bundle-umd.js',
    output: 'dist/tippy-bundle.umd.min.js',
    format: 'umd',
    minify: true,
    env: 'production',
    extractCSS: 'dist/tippy.css',
  },
  {
    input: 'build/base.js',
    output: 'dist/tippy.esm.js',
    format: 'es',
    minify: false,
    env: 'development',
    extractCSS: 'dist/tippy.css',
  },
  {
    input: 'build/headless.js',
    output: 'headless/dist/tippy-headless.esm.js',
    format: 'es',
    minify: false,
    env: 'development',
  },
  {
    input: 'build/base.js',
    output: 'dist/tippy.cjs.js',
    format: 'cjs',
    minify: false,
    env: 'development',
    extractCSS: 'dist/tippy.css',
  },
  {
    input: 'build/headless.js',
    output: 'headless/dist/tippy-headless.cjs.js',
    format: 'cjs',
    minify: false,
    env: 'development',
  },
  {
    input: 'build/headless-umd.js',
    output: 'headless/dist/tippy-headless.umd.js',
    format: 'umd',
    minify: false,
    env: 'development',
  },
  {
    input: 'build/headless-umd.js',
    output: 'headless/dist/tippy-headless.umd.min.js',
    format: 'umd',
    minify: true,
    env: 'production',
  },
];

for (const buildConfig of builds) {
  const config = defineConfig({
    build: {
      lib: {
        entry: resolve(buildConfig.input),
        formats: [buildConfig.format],
        fileName: () => buildConfig.output.split('/').pop(),
        name: buildConfig.format === 'umd' ? 'tippy' : undefined,
      },
      outDir: buildConfig.output.split('/').slice(0, -1).join('/') || 'dist',
      emptyOutDir: false,
      minify: buildConfig.minify ? 'terser' : false,
      sourcemap: true,
      cssCodeSplit: false,
      rollupOptions: {
        external: ['@popperjs/core'],
        output: {
          banner: buildConfig.minify ? undefined : banner,
          globals: { '@popperjs/core': 'Popper' },
          exports: buildConfig.format === 'cjs' ? 'named' : 'auto',
          ...(buildConfig.extractCSS && {
            assetFileNames: 'tippy.css',
          }),
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {},
      },
    },
    define: {
      __NAMESPACE_PREFIX__: JSON.stringify(NAMESPACE_PREFIX),
      'process.env.NODE_ENV': JSON.stringify(buildConfig.env),
    },
  });

  await build(config);
}