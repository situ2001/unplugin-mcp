# rollup-plugin-mcp Example

This is a simple example project demonstrating how to use the `rollup-plugin-mcp` plugin with Rollup.

## What is MCP?

MCP (Model Context Protocol) is a protocol that helps Large Language Models (LLMs) understand your codebase better. By integrating MCP into your build process, you can provide structured metadata about your code to LLMs.

## Setup

This example project is set up to use the local version of `rollup-plugin-mcp` from the parent directory.

```json
"devDependencies": {
  "rollup-plugin-mcp": "file:../.."
}
```

## How to run

1. First, build the main plugin:
   ```
   cd ../..
   pnpm install
   pnpm build
   ```

2. Then, run the example:
   ```
   cd examples/simple
   pnpm install
   pnpm build   # for a single build
   pnpm dev     # for watch mode
   ```

3. Open the `index.html` file in a browser to see the result.

## How it works

1. The `rollup.config.js` configures the MCP plugin:
   ```js
   mcp({
     mcpPort: 14515,
     setupMcpServer: (mcpServer) => {
       mcpServer.register('getModuleInfo', async () => {
         return {
           name: 'example-module',
           version: '1.0.0',
           description: 'An example module using rollup-plugin-mcp'
         };
       });
       
       return mcpServer;
     }
   }),
   ```

2. During the build process, the MCP server starts up and provides information about your codebase.

3. If you're using compatible tools (like certain AI coding assistants), they can use this MCP server to get better context about your project structure and functionality.

## Learning More

For more information about the Model Context Protocol, visit the [official repository](https://github.com/microsoft/modelcontextprotocol).