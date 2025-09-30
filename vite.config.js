// vite.config.ts
import { defineConfig } from 'vite';
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite'

const NAMESPACE_PREFIX = process.env.NAMESPACE || 'tippy';
const commonDefine = {
  __NAMESPACE_PREFIX__: JSON.stringify(NAMESPACE_PREFIX),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
};

// Nombres de archivos exactos
const fileNames = (base /* 'tippy' | 'tippy-bundle' | 'tippy-headless' */) => ({
  entryFileNames: (chunk) => {
    const fmt = chunk.format;
    if (fmt === 'es') return `${base}.esm.js`;
    if (fmt === 'cjs') return `${base}.cjs.js`;
    if (fmt === 'umd') return `${base}.umd.js`;
    return `${base}.[format].js`;
  },
  assetFileNames: (asset) => {
    if (asset.name && asset.name.endsWith('.css')) return `tippy.css`;
    return `assets/[name][extname]`;
  },
});

// Externals + globals para UMD
const externalGlobals = {
  external: ['@popperjs/core'],
  output: { globals: { '@popperjs/core': 'Popper' } },
};

export default defineConfig(({ mode }) => {
  // Defaults para *siempre* estar en modo librería
  const cfg = {
    define: commonDefine,
    plugins: [
      tailwindcss(),
    ],
    publicDir: false,
    css: { devSourcemap: true },
    build: {
      emptyOutDir: false,
      sourcemap: true,
      // clave: siempre es LIB BUILD, jamás app build
      lib: {
        entry: path.resolve('build/base.js'), // se sobreescribe por modo
        name: 'tippy',
        formats: ['es', 'cjs', 'umd'],        // se sobreescribe por modo
        fileName: () => 'tippy',
      },
      rollupOptions: {
        ...externalGlobals,
        output: fileNames('tippy'),
      },
      minify: false,
    },
  };

  switch (mode) {
    case 'libMain': {
      // tippy.esm/cjs/umd (no min), externals activos
      cfg.build.lib.entry = path.resolve('build/base.js');
      cfg.build.lib.formats = ['es', 'cjs', 'umd'];
      cfg.build.rollupOptions = { ...externalGlobals, output: fileNames('tippy') };
      cfg.build.minify = false;
      break;
    }

    case 'libMainMin': {
      // tippy.umd.min.js (externals)
      cfg.build.lib.entry = path.resolve('build/base.js');
      cfg.build.lib.formats = ['umd'];
      cfg.build.rollupOptions = { ...externalGlobals, output: fileNames('tippy') };
      cfg.build.minify = 'terser';
      break;
    }

    case 'libBundle': {
      // tippy-bundle.umd.js (SIN externals)
      cfg.build.lib.entry = path.resolve('build/bundle-umd.js');
      cfg.build.lib.formats = ['umd'];
      cfg.build.rollupOptions = { output: fileNames('tippy-bundle') };
      cfg.build.minify = false;
      break;
    }

    case 'libBundleMin': {
      // tippy-bundle.umd.min.js (SIN externals)
      cfg.build.lib.entry = path.resolve('build/bundle-umd.js');
      cfg.build.lib.formats = ['umd'];
      cfg.build.rollupOptions = { output: fileNames('tippy-bundle') };
      cfg.build.minify = 'terser';
      break;
    }

    case 'headless': {
      // headless: esm/cjs (externals) → headless/dist
      cfg.build.outDir = 'headless/dist';
      cfg.build.lib.entry = path.resolve('build/headless.js');
      cfg.build.lib.formats = ['es', 'cjs'];
      cfg.build.rollupOptions = { ...externalGlobals, output: fileNames('tippy-headless') };
      cfg.build.minify = false;
      break;
    }

    case 'headlessUmd': {
      // headless: umd (externals) no min
      cfg.build.outDir = 'headless/dist';
      cfg.build.lib.entry = path.resolve('build/headless-umd.js');
      cfg.build.lib.formats = ['umd'];
      cfg.build.rollupOptions = { ...externalGlobals, output: fileNames('tippy-headless') };
      cfg.build.minify = false;
      break;
    }

    case 'headlessUmdMin': {
      // headless: umd (externals) min
      cfg.build.outDir = 'headless/dist';
      cfg.build.lib.entry = path.resolve('build/headless-umd.js');
      cfg.build.lib.formats = ['umd'];
      cfg.build.rollupOptions = { ...externalGlobals, output: fileNames('tippy-headless') };
      cfg.build.minify = 'terser';
      break;
    }
  }

  return cfg;
});
