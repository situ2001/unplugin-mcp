import type { Plugin, RollupOptions } from 'rollup';
import { McpPluginOptions } from './types';
import { initMcpServer, RollupMcpServer, RollupMcpTool } from './mcp-server';
import { createHttpServer, setupRouteForMcpServer } from './web-server';
import picocolors from 'picocolors';
import process from 'node:process';
import { serverManager } from './globals';

export { RollupMcpTool } from './mcp-server';
export { createHttpServer, setupRouteForMcpServer } from './web-server';

export default async function mcp(pluginOpt: McpPluginOptions): Promise<Plugin> {
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
  let mcpServer = await (
    pluginOpt.mcpServer?.(pluginOpt)
    ?? initMcpServer(pluginOpt)
  );

  // Optionally setup the server with custom handlers
  if (pluginOpt.setupMcpServer) {
    mcpServer = await pluginOpt.setupMcpServer(mcpServer);
  }

  const rollupMcpServer = RollupMcpServer.createFromExistingMcpServer(mcpServer);

  // Initialize with default tools
  // Not adding them to the server yet
  const defaultTools: RollupMcpTool[] = [
    // new BuildErrorTool(),
    // new BuildConfigTool(),
    // new ModuleTool(),
  ];

  // Add custom tools if provided
  const customTools = await pluginOpt.provideRollupMcpTools?.() ?? [];
  await rollupMcpServer.registerRollupFunctionActions([...defaultTools, ...customTools]);

  const httpServerOptions = {
    port: httpServerPort,
    host: httpServerHost,
    basePath: httpServerPath,
  }

  let httpServer = serverManager.getHttpServer();
  if (!httpServer) {
    httpServer = await (
      pluginOpt.httpServer?.(mcpServer, httpServerOptions)
      ?? createHttpServer(mcpServer, httpServerOptions)
    );

    serverManager.setHttpServer(httpServer);
    console.log(
      picocolors.green('MCP server HTTP server created')
    );
  }

  if (!serverManager.isRunning()) {
    await serverManager.startHttpServer(httpServerOptions);
  }

  const hooks = await rollupMcpServer.getRollupHooks();

  return {
    name: 'mcp',
    ...hooks,
  }
}
