# unplugin-mcp

> Disclaimer: This is a work in progress and welcome contributions. The API and functionality may change as we refine the plugin.

> Disclaimer: This plugin is migrated from rollup plugin and it is untested and unimplemented for other build tools. If you are interested in this plugin, please open an issue or PR.

A unified plugin that creates an MCP Server to provide MCP tools. It works with many JS build tools, like Rollup, Vite, Webpack, and others.

## Features

- 🚀 **MCP Server Integration**: Creates and manages an MCP server during the build process with minimal configuration of your build tools.
- 🧩 **Bi-directional AI Integration**: Not only provides context to AI assistants about your codebase, but also enables AI to actively modify and control your build process
- 📊 **Rich Module Information**: Pre-built tools expose module dependencies, build configurations, and error diagnostics to AI through Rollup hooks
- 🛠️ **Extensible Tool Framework**: Create custom MCP tools with the simple `UnpluginMcpTool` interface to expose project-specific information or functionality
- 🔍 **Build Process Integration**: Seamlessly integrates at any point in the plugin chain and hooks of your build tools like Rollup.
- 🔄 **Persistent Server**: Keeps running even after build completion in watch mode, enabling continuous AI interaction
- 🌐 **Standard Transport Layer**: Uses HTTP and Server-Sent Events (SSE) for broad compatibility with AI assistants implementing the MCP protocol

## Installation

```bash
pnpm add -D unplugin-mcp
```

## Usage (rollup)

Add the plugin to your rollup.config.js:

```js
import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { rollupPlugin as mcp } from 'unplugin-mcp';
import { ModuleTool,BuildConfigTool,BuildErrorTool } from 'unplugin-mcp/tools'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true
  },
  plugins: [
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
```

### Options

Check `McpPluginOptions` in [types file](./lib/src/types.ts) for all available options.

### Custom Tools

You can extend the plugin with custom tools implementing the `UnpluginMcpTool` interface:

```typescript
import { InputOptions } from "rollup";
import { UnpluginMcpTool, UnpluginMcpToolSetupOptions } from "../mcp-server"; // TODO change this to the correct path, and export the interface
import DeferredCtor, { Deferred } from 'promise-deferred';
import { UnpluginOptions } from "unplugin";

export class BuildConfigTool implements UnpluginMcpTool {
  private buildConfig: Deferred<InputOptions>;

  affectsBuildProcess: boolean = false;

  constructor() {
    this.buildConfig = new DeferredCtor<InputOptions>();
  }

  setupMcpServer(mcpServer: any, options?: any) {
    mcpServer.tool(
      `get-build-config`,
      async () => {
        const cfg = await this.buildConfig.promise;

        return {
          content: [
            {
              type: 'text',
              text: `Build configuration: ${JSON.stringify(cfg)}`
            }
          ]
        };
      }
    );

    return mcpServer;
  }

  registerPlugins(options?: UnpluginMcpToolSetupOptions): UnpluginOptions {
    let self = this;

    return {
      name: 'build-config-tool',
      
      // Tools-specific options
      rollup: {
        options(config) {
          self.buildConfig.resolve(config);
        }
      }
    }
  }
}

```

## Examples

Check out the examples directory for working examples, including:

- simple-hello: A basic example demonstrating MCP integration.

## How does it work?

It initializes and setup these components:

1. The plugin creates and setup a singleton MCP server instance.
2. The plugin registers some `UnpluginMcpTool` instances to the MCP server.
3. The plugin creates http server and sets up http routes for the MCP server.
4. The plugin starts the http server, listening on the specified port and host.
5. The plugin registers the hooks created by `UnpluginMcpTool` instances to build tools.

After these steps, the plugin will be able to:

1. Handle incoming requests from the MCP server and respond.
2. React to call of hooks from build tools.

## License

MIT License. Copyright (c) 2025 situ2001.
