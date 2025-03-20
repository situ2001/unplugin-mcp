# rollup-plugin-mcp

MCP Server integration for Rollup.

## Features

- 🚀 **MCP Server Integration**: Creates and manages an MCP server during your Rollup build process with minimal configuration
- 🧩 **Bi-directional AI Integration**: Not only provides context to AI assistants about your codebase, but also enables AI to actively modify and control your build process
- 📊 **Rich Module Information**: Pre-built tools expose module dependencies, build configurations, and error diagnostics to AI through Rollup hooks
- 🛠️ **Extensible Tool Framework**: Create custom MCP tools with the simple RollupMcpTool interface to expose project-specific information or functionality
- 🔍 **Build Process Integration**: Seamlessly integrates at any point in the Rollup plugin chain and any point in the Rollup hooks.
- 🔄 **Persistent Server**: Keeps running even after build completion in watch mode, enabling continuous AI interaction
- 🌐 **Standard Transport Layer**: Uses HTTP and Server-Sent Events (SSE) for broad compatibility with AI assistants implementing the MCP protocol

## Installation

```bash
pnpm add -D rollup-plugin-mcp
```

## Usage

Add the plugin to your rollup.config.js:

```js
import { defineConfig } from 'rollup';
import mcp from 'rollup-plugin-mcp';
import { ModuleTool,BuildConfigTool,BuildErrorTool } from 'rollup-plugin-mcp/tools'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm'
  },
  plugins: [
    mcp({
      provideRollupMcpTools: () => [
        // register the default tools
        new ModuleTool(),
        new BuildConfigTool(),
        new BuildErrorTool()
      ]
    }),
  ]
});
```

### Options

| Option                  | Type     | Default     | Description                                 |
| ----------------------- | -------- | ----------- | ------------------------------------------- |
| `httpServerPort`        | number   | 14514       | Port for the HTTP server                    |
| `httpServerHost`        | string   | 'localhost' | Host for the HTTP server                    |
| `httpServerPath`        | string   | '/mcp'      | Base path for MCP endpoints                 |
| `useOnlyInWatchMode`    | boolean  | true        | Whether to run only in watch mode           |
| `mcpServer`             | function | undefined   | Custom MCP server factory                   |
| `setupMcpServer`        | function | undefined   | Custom function to configure the MCP server |
| `provideRollupMcpTools` | function | undefined   | Function to provide custom MCP tools        |
| `httpServer`            | function | undefined   | Custom HTTP server factory                  |

### Custom Tools

You can extend the plugin with custom tools implementing the `RollupMcpTool` interface:

```typescript
import { InputOptions, PluginHooks } from "rollup";
import { RollupMcpTool } from "rollup-plugin-mcp";
import DeferredCtor, { Deferred } from 'promise-deferred';

export class BuildConfigTool implements RollupMcpTool {
  private buildConfig: Deferred<InputOptions> = new DeferredCtor<InputOptions>();

  // Indicates if the tool affects the build process
  // If true, the plugin to which the tool is registered cannot have other plugins registered.
  affectsBuildProcess: boolean = false;

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

  registerRollupHooks(): Partial<PluginHooks> {
    let self = this;

    return {
      buildStart(config: InputOptions) {
        self.buildConfig = new DeferredCtor<InputOptions>();
      },

      options(config) {
        self.buildConfig.resolve(config);
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
2. The plugin registers some `RollupMcpTool` instances to the MCP server.
3. The plugin creates http server and sets up http routes for the MCP server.
4. The plugin starts the http server, listening on the specified port and host.
5. The plugin registers the rollup hooks created by the `RollupMcpTool` instances to real rollup.

After these steps, the plugin will be able to:

1. Handle incoming requests from the MCP server and respond.
2. React to call of hooks from rollup.

## License

MIT License. Copyright (c) 2025 situ2001.
