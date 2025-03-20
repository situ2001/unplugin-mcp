import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RollupMcpServer, RollupMcpTool } from "./mcp-server";
import http from "node:http";

export interface McpPluginOptions {
  /**
   * The port to use for the HTTP server that
   * serves the MCP server.
   * 
   * Defaults to 14514.
   */
  httpServerPort?: number;

  /**
   * The hostname for the HTTP server that
   * serves the MCP server.
   * 
   * Defaults to 'localhost'.
   */
  httpServerHost?: string;

  /**
   * The path to identify the MCP server served by the HTTP server.
   * 
   * Defaults to '/mcp'.
   */
  httpServerPath?: string;

  /**
  * Provide a custom HTTP server to be used by the plugin.
  * 
  * This is useful when you share the same HTTP server and MCP server
  * across multiple instances of this plugin.
  * 
  * If provided, the plugin will not create a new HTTP server.
  * 
  * @param option The options for the HTTP server.
  * @param mcpServer The MCP server instance, which will be used to bind the HTTP server.
  */
  httpServer?: (mcpServer: McpServer, option: HttpServerOptions) => http.Server | Promise<http.Server>;

  /**
   * A function that returns an instance of McpServer or a Promise that resolves to it.
   * 
   * This is useful if you want to provide a custom implementation 
   * of McpServer from outside the plugin. Or if you want to share 
   * the server across multiple instances of this plugin.
   * 
   * If provided, the built-in McpServer, along with its default handlers, will not be used.
   * 
   * @returns McpServer | Promise<McpServer>
   */
  mcpServer?: (pluginOpt: McpPluginOptions) => McpServer | Promise<McpServer>;

  /**
   * Setup the MCP server. It is called after the server is created and before it is served.
   * 
   * This is useful if you want to configure the server with custom handlers.
   */
  setupMcpServer?: (mcpServer: McpServer) => McpServer | Promise<McpServer>;

  /**
   * Register @type{RollupMcpTool} to the RollupMcpServer instance.
   * 
   * This allows you to add custom tools that conform to the @type{RollupMcpTool} interface.
   */
  provideRollupMcpTools?: () => RollupMcpTool[] | Promise<RollupMcpTool[]>;

  /**
   * If this is set to true, the plugin will block the build process from exiting
   * and start the HTTP server. This is useful if you want to use the plugin to
   * serve the MCP server in non-watch mode. 
   * 
   * Set this to make it effective in non-watch mode.
   * 
   * Defaults to true.
   */
  useOnlyInWatchMode?: boolean;
}


/**
 * Options for the HTTP server.
 */
export interface HttpServerOptions {
  port: number;
  host: string;
  basePath: string;
}
