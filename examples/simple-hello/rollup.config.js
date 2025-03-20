import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import mcp from 'rollup-plugin-mcp';

import { ModuleTool,BuildConfigTool,BuildErrorTool } from 'rollup-plugin-mcp/tools'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    // Use the MCP plugin
    mcp({
      provideRollupMcpTools: () => [
        new ModuleTool(),
        new BuildConfigTool(),
        new BuildErrorTool()
      ]
    }),

    nodeResolve(),
    typescript()
  ]
});
