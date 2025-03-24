import { McpPluginOptions } from "./types";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { version } from "../../package.json";
import { UnpluginOptions } from 'unplugin';

import { createDebug, createErrorDebug } from "./utils";
import picocolors from "picocolors";
const debug = createDebug('UnpluginMcpServer');
const errorDebug = createErrorDebug('UnpluginMcpServer');

export function initMcpServer(pluginOpt: McpPluginOptions) {
  const mcp = new McpServer({
    name: "unplugin-mcp",
    version,
    // TODO should i add more options here?
  });

  return mcp;
}

export interface UnpluginMcpToolSetupOptions {
  /**
   * tag to identify the tool in the MCP server
   */
  tag?: string;
}

/**
 * This interface represents an action that can be used to extend the functionality of the UnpluginMcpPlugin
 */
export interface UnpluginMcpTool {
  /**
   * Check if the tool has an effect on the build process.
   */
  affectsBuildProcess: boolean;

  /**
   * Sets up the MCP server instance. For example, you can add tools to the server.
   */
  setupMcpServer(mcpServer: McpServer, options?: UnpluginMcpToolSetupOptions): McpServer;

  /**
   * Register hooks to bundler, to gather information about the build and so on.
   */
  registerPlugins(options?: UnpluginMcpToolSetupOptions): UnpluginOptions;
}

export class UnpluginMcpServer {
  public mcpServer: McpServer;

  constructor(mcpServer: McpServer) {
    this.mcpServer = mcpServer;
  }

  unpluginMcpTools: UnpluginMcpTool[] = [];

  registerUnpluginMcpTools(rollupFunctionTools: UnpluginMcpTool[]) {
    for (const tool of rollupFunctionTools) {
      this.mcpServer = tool.setupMcpServer(this.mcpServer);
      this.unpluginMcpTools.push(tool);
    }
  }

  getUnpluginsFromTools(): UnpluginOptions[] {
    const plugins = this.unpluginMcpTools.map((tool) => tool.registerPlugins());

    const anyToolsHaveEffect = this.unpluginMcpTools.some((tool) => tool.affectsBuildProcess);
    if (anyToolsHaveEffect && plugins.length > 1) {
      console.warn(
        picocolors.yellow(
          'Multiple tools with effects detected. Please try your best to use only one tool at a time.'
          + '\n'
          + 'This may cause unexpected behavior.'
        )
      );
    }

    return plugins;
  }
}
