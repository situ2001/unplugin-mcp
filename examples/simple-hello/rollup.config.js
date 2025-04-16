import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { rollupPlugin as mcp } from 'unplugin-mcp';

import { ModuleTool,BuildConfigTool,BuildErrorTool, BundleSizeTool } from 'unplugin-mcp/tools'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    mcp({
      provideUnpluginMcpTools: () => [
        new ModuleTool(),
        new BuildConfigTool(),
        new BuildErrorTool(),
        new BundleSizeTool()
      ]
    }),

    nodeResolve(),
    typescript()
  ]
});
