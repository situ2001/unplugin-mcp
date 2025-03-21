import { McpPluginOptions } from './types';
import { initMcpServer, UnpluginMcpServer, UnpluginMcpTool } from './mcp-server';
import { createHttpServer } from './web-server';
import picocolors from 'picocolors';
import process from 'node:process';
import { serverManager } from './globals';
import { createRollupPlugin, createUnplugin } from 'unplugin';

export { UnpluginMcpTool as RollupMcpTool } from './mcp-server';
export { createHttpServer, setupRouteForMcpServer } from './web-server';

const unpluginFactory = (pluginOpt: McpPluginOptions) => {
  const {
    port: httpServerPort = 14514,
    host: httpServerHost = 'localhost',
    basePath: httpServerPath = '/mcp',
    useOnlyInWatchMode = true,
  } = pluginOpt;

  const isRollupWatchMode = process.env.ROLLUP_WATCH === "true";
  if (!isRollupWatchMode && useOnlyInWatchMode) {
    console.log(
      picocolors.yellow('MCP server is only used in watch mode.'),
    );
    console.log(
      picocolors.dim('You can use the `--watch` flag to enable rollup watch mode.')
    )
    console.log(
      picocolors.dim('Or set `useOnlyInWatchMode` in plugin options to false to use it in non-watch mode.')
    )

    return {
      name: 'mcp',
    };
  }

  // Initialize or use provided MCP server
  let mcpServer = (
    pluginOpt.mcpServer?.(pluginOpt)
    ?? initMcpServer(pluginOpt)
  );

  // Optionally setup the server with custom handlers
  if (pluginOpt.setupMcpServer) {
    mcpServer = pluginOpt.setupMcpServer(mcpServer);
  }

  const rollupMcpServer = new UnpluginMcpServer(mcpServer);

  // Initialize with default tools
  // Not adding them to the server yet
  const defaultTools: UnpluginMcpTool[] = [
    // new BuildErrorTool(),
    // new BuildConfigTool(),
    // new ModuleTool(),
  ];

  // Add custom tools if provided
  const customTools = pluginOpt.provideUnpluginMcpTools?.() ?? [];
  rollupMcpServer.registerUnpluginMcpTools([...defaultTools, ...customTools]);

  console.log('current tools', customTools);

  const httpServerOptions = {
    port: httpServerPort,
    host: httpServerHost,
    basePath: httpServerPath,
  }

  let httpServer = serverManager.getHttpServer();

  if (!httpServer) {
    let httpServer = serverManager.getHttpServer();
    if (!httpServer) {
      httpServer = (
        pluginOpt.httpServer?.(mcpServer, httpServerOptions)
        ?? createHttpServer(mcpServer, httpServerOptions)
      );

      serverManager.setHttpServer(httpServer);
      console.log(
        picocolors.green('MCP server HTTP server created')
      );
    }

    if (!serverManager.isRunning()) {
      serverManager.startHttpServer(httpServerOptions);
    }
  }

  const plugins = rollupMcpServer.getUnpluginsFromTools();

  return plugins;
}

export const unplugin = createUnplugin(unpluginFactory);
export default unplugin;

export const rollupPlugin = createRollupPlugin(unpluginFactory);
