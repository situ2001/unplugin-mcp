import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RollupMcpServer, RollupMcpTool } from "./mcp-server";
import http from "node:http";

export interface McpPluginOptions {
  /**
   * Provide a custom @type{McpServer} to be used by the plugin.
   * 
   * @returns McpServer | Promise<McpServer>
   */
  mcpServer?: (pluginOpt: McpPluginOptions) => McpServer | Promise<McpServer>;

  /**
   * Setup the @type{McpServer} instance. This function exposes the `McpServer` instance
   * right after when it is created.
   */
  setupMcpServer?: (mcpServer: McpServer) => McpServer | Promise<McpServer>;

  /**
   * Register @type{RollupMcpTool} to the RollupMcpServer instance.
   * 
   * This allows you to add custom tools that conform to the @type{RollupMcpTool} interface.
   */
  provideRollupMcpTools?: () => RollupMcpTool[] | Promise<RollupMcpTool[]>;

  /**
   * The port to use for the @type{http.Server} that serves the MCP server.
   * 
   * Defaults to 14514.
   */
  port?: number;

  /**
   * The hostname for the @type{http.Server} that serves the MCP server.
   * 
   * Defaults to 'localhost'.
   */
  host?: string;

  /**
   * The path to identify the MCP server served by the @type{http.Server}.
   * 
   * Defaults to '/mcp'.
   */
  basePath?: string;

  /**
  * Provide a custom @type{http.Server} to be used by the plugin.
  * 
  * If provided, the plugin will not create a new HTTP server.
  * 
  * @param option The options for the HTTP server.
  * @param mcpServer The MCP server instance, which will be used to bind the HTTP server.
  */
  httpServer?: (mcpServer: McpServer, option: HttpServerOptions) => http.Server | Promise<http.Server>;

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
