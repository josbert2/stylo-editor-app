import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import cssOnly from 'rollup-plugin-css-only';
import replace from 'rollup-plugin-replace';
import sass from 'rollup-plugin-sass';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import pkg from './package.json'; // ← ajustado a la raíz

const NAMESPACE_PREFIX = process.env.NAMESPACE || 'tippy';

const plugins = {
  babel: babel({ extensions: ['.js', '.ts'] }),
  replaceNamespace: replace({
    __NAMESPACE_PREFIX__: NAMESPACE_PREFIX,
  }),
  replaceEnvProduction: replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  replaceEnvDevelopment: replace({
    'process.env.NODE_ENV': JSON.stringify('development'),
  }),
  minify: terser(),
  resolve: resolve({ extensions: ['.js', '.ts'] }),
  // Nota: cssOnly no compila SCSS. Usamos SASS para compilar y además extraer a archivo.
  css: cssOnly({ output: false }),
  json: json(),
  tailwindDev: postcss({
    plugins: [
      require('tailwindcss'),
      require('autoprefixer'),
    ],
    inject: true, // Inyecta CSS directamente en el JS
    extensions: ['.css'],
  }),
};

// Plugins comunes prod (sin CSS)
const prodCommonPlugins = [
  plugins.replaceNamespace,
  plugins.resolve,
  plugins.json,
];

// ⚠️ Cambiamos: para “bundle” usamos SASS con output a archivo
const pluginConfigs = {
  base: [plugins.babel, ...prodCommonPlugins],
  bundle: [
    plugins.babel,
    ...prodCommonPlugins,
    // compila SCSS importado desde entradas “bundle”
    sass({ output: 'dist/tippy.css' }),
  ],
  umdBase: [plugins.babel, plugins.replaceEnvDevelopment, ...prodCommonPlugins],
  umdBaseMin: [
    plugins.babel,
    plugins.replaceEnvProduction,
    ...prodCommonPlugins,
    plugins.minify,
  ],
  umdBundle: [
    plugins.babel,
    plugins.replaceEnvDevelopment,
    ...prodCommonPlugins,
    sass({ output: 'dist/tippy.css' }),
  ],
  umdBundleMin: [
    plugins.babel,
    plugins.replaceEnvProduction,
    ...prodCommonPlugins,
    plugins.minify,
    sass({ output: 'dist/tippy.css' }),
  ],
};

const banner = `/**!
* tippy-like-boilerplate v${pkg.version}
* MIT License
*/`;

const commonUMDOutputOptions = {
  globals: { '@popperjs/core': 'Popper' },
  format: 'umd',
  name: 'tippy',
  sourcemap: true,
};

const prodConfig = [
  {
    input: 'build/base-umd.js',
    plugins: pluginConfigs.umdBase,
    external: ['@popperjs/core'],
    output: {
      ...commonUMDOutputOptions,
      file: 'dist/tippy.umd.js',
      banner,
    },
  },
  {
    input: 'build/bundle-umd.js',
    plugins: pluginConfigs.umdBundle,
    external: ['@popperjs/core'],
    output: {
      ...commonUMDOutputOptions,
      file: 'dist/tippy-bundle.umd.js',
      banner,
    },
  },
  {
    input: 'build/base-umd.js',
    plugins: pluginConfigs.umdBaseMin,
    external: ['@popperjs/core'],
    output: {
      ...commonUMDOutputOptions,
      file: 'dist/tippy.umd.min.js',
    },
  },
  {
    input: 'build/bundle-umd.js',
    plugins: pluginConfigs.umdBundleMin,
    external: ['@popperjs/core'],
    output: {
      ...commonUMDOutputOptions,
      file: 'dist/tippy-bundle.umd.min.js',
    },
  },
  {
    input: 'build/base.js',
    plugins: pluginConfigs.bundle, // ← genera dist/tippy.css
    external: ['@popperjs/core'],
    output: {
      file: 'dist/tippy.esm.js',
      format: 'esm',
      banner,
      sourcemap: true,
    },
  },
  {
    input: 'build/headless.js',
    plugins: pluginConfigs.base,
    external: ['@popperjs/core'],
    output: {
      file: 'headless/dist/tippy-headless.esm.js',
      format: 'esm',
      banner,
      sourcemap: true,
    },
  },
  {
    input: 'build/base.js',
    plugins: pluginConfigs.bundle, // ← genera dist/tippy.css
    external: ['@popperjs/core'],
    output: {
      file: 'dist/tippy.cjs.js',
      format: 'cjs',
      exports: 'named',
      banner,
      sourcemap: true,
    },
  },
  {
    input: 'build/headless.js',
    plugins: pluginConfigs.base,
    external: ['@popperjs/core'],
    output: {
      file: 'headless/dist/tippy-headless.cjs.js',
      format: 'cjs',
      exports: 'named',
      banner,
      sourcemap: true,
    },
  },
  {
    input: 'build/headless-umd.js',
    plugins: pluginConfigs.umdBase,
    external: ['@popperjs/core'],
    output: {
      ...commonUMDOutputOptions,
      file: 'headless/dist/tippy-headless.umd.js',
    },
  },
  {
    input: 'build/headless-umd.js',
    plugins: pluginConfigs.umdBaseMin,
    external: ['@popperjs/core'],
    output: {
      ...commonUMDOutputOptions,
      file: 'headless/dist/tippy-headless.umd.min.js',
    },
  },
];

// DEV/TEST (sin cambios relevantes)
const configs = {
  dev: () => ({
    input: 'test/visual/tests.js',
    plugins: [
      plugins.babel,
      plugins.json,
      plugins.resolve,
      replace({ __DEV__: 'true' }),
      plugins.replaceEnvDevelopment,
      //sass({ output: true }), // hot build con CSS embebido a archivo en /test
      plugins.tailwindDev,
      // se agrego historyApiFallback para que funcione el router con
      serve({ contentBase: 'test/visual', port: 1234 }),
      livereload(),
    ],
    output: { file: 'test/visual/dist/bundle.js', format: 'iife' },
  }),
  test: () => ({
    input: 'test/visual/tests.js',
    plugins: [
      plugins.babel,
      plugins.json,
      plugins.resolve,
      replace({ __DEV__: 'true' }),
      plugins.replaceEnvDevelopment,
      //sass({ output: true }),
      plugins.tailwindDev,
    ],
    output: { file: 'test/visual/dist/bundle.js', format: 'iife' },
  }),
};

const func = configs[process.env.NODE_ENV];
export default func ? func() : prodConfig;