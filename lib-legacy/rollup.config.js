import typescript from 'rollup-plugin-typescript2';
import { defineConfig } from 'rollup';
import { readFileSync } from 'node:fs';
import nodeExternals from 'rollup-plugin-node-externals';
import json from '@rollup/plugin-json';

const pkg = JSON.parse(readFileSync('./package.json','utf8'));
let tsconfigOverride = { compilerOptions: { declaration: false } };
const plugins = [
  nodeExternals(),
  json(),
  typescript({
    tsconfig: './tsconfig.json',
    tsconfigOverride
  }),
];

export default defineConfig(
  [
    {
      input: 'src/index.ts',
      output: [
        {
          file: pkg.module,
          format: 'es',
          sourcemap: true,
        },
        {
          file: pkg.main,
          format: 'cjs',
          sourcemap: true,
        }
      ],
      plugins
    },
    {
      input: 'src/tools/index.ts',
      output: [
        {
          file: 'dist/tools/index.js',
          format: 'es',
          sourcemap: true,
        },
        {
          file: 'dist/tools/index.cjs',
          format: 'cjs',
          sourcemap: true,
        }
      ],
      plugins
    }
  ]
);
