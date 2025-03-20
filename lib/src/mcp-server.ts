import { McpPluginOptions } from "./types";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { version } from "../../package.json";
import { PluginContext, PluginHooks } from "rollup";

import { createDebug, createErrorDebug } from "./utils";
const debug = createDebug('RollupMcpServer');
const errorDebug = createErrorDebug('RollupMcpServer');

export function initMcpServer(pluginOpt: McpPluginOptions) {
  const mcp = new McpServer({
    name: "rollup-plugin-mcp",
    version,
    // TODO should i pass more options here?
  });

  return mcp;
}

export interface RollupMcpToolSetupOptions {
  /**
   * tag to identify the tool in the MCP server
   */
  tag?: string;
}

/**
 * This interface represents an action that can be used to extend the functionality of the RollupMcpPlugin
 */
export interface RollupMcpTool {
  /**
   * Check if the tool has an effect on the build process.
   */
  affectsBuildProcess: boolean;

  /**
   * Sets up the MCP server instance. For example, you can add tools to the server.
   */
  setupMcpServer(mcpServer: McpServer, options?: RollupMcpToolSetupOptions): McpServer | Promise<McpServer>;

  /**
   * Register hooks to rollup, to gather information about the build.
   */
  registerRollupHooks(options?: RollupMcpToolSetupOptions): Partial<PluginHooks> | Promise<Partial<PluginHooks>>;
}

export class RollupMcpServer {
  public mcpServer: McpServer;

  constructor(mcpServer: McpServer) {
    this.mcpServer = mcpServer;
  }

  static createFromOptions(pluginOpt: McpPluginOptions) {
    const mcpServer = initMcpServer(pluginOpt);
    return new RollupMcpServer(mcpServer);
  }

  static createFromExistingMcpServer(mcpServer: McpServer) {
    return new RollupMcpServer(mcpServer);
  }

  rollupMcpTools: RollupMcpTool[] = [];

  async registerRollupFunctionActions(rollupFunctionTools: RollupMcpTool[]) {
    for (const tool of rollupFunctionTools) {
      this.mcpServer = await tool.setupMcpServer(this.mcpServer);
      this.rollupMcpTools.push(tool);
    }
  }

  /**
   * Aggregates all hooks from registered tools, 
   * focusing only on information gathering without modifying the build process
   * 
   * This just simply aggregates the hooks from all tools and returns them.
   * If you want to use hooks that will modify the build process, you should make sure that you
   * only use one tool at a time.
   */
  async getRollupHooks(): Promise<Partial<PluginHooks>> {
    const hooksByName = new Map<keyof PluginHooks, Array<any>>();

    // Collect hooks from all tools
    for (const tool of this.rollupMcpTools) {
      const actionHooks = await tool.registerRollupHooks();

      for (const [hookName, hookImpl] of Object.entries(actionHooks)) {
        if (!hooksByName.has(hookName as keyof PluginHooks)) {
          hooksByName.set(hookName as keyof PluginHooks, []);
        }
        hooksByName.get(hookName as keyof PluginHooks)!.push(hookImpl);
      }
    }

    // Create combined hooks - for information gathering only
    const combinedHooks: Partial<PluginHooks> = {};

    // Define helper to handle both function and object hooks
    const callHook = (hook: any, context: any, args: any[]) => {
      try {
        if (typeof hook === 'function') {
          return hook.apply(context, args);
        } else if (hook && typeof hook.handler === 'function') {
          return hook.handler.apply(context, args);
        }
      } catch (err) {
        // Log error but don't let it affect the build
        errorDebug(`[rollup-plugin-mcp] Error in hook: ${err}`);
      }
      return undefined;
    };

    // const typeOfPlugin = {
    //   first: ['resolveId', 'load', 'transform'],
    //   sequential: ['buildStart', 'buildEnd', 'closeBundle'],
    //   _parallel: [] // Not used in this context
    // }

    const anyToolsHaveEffect = this.rollupMcpTools.some((tool) => tool.affectsBuildProcess);

    // Handle different hook types with focus on not interfering with other plugins
    for (const [hookName, implementations] of hooksByName.entries()) {
      if (implementations.length === 0) {
        continue;
      }

      if (implementations.length === 1) {
        // @ts-ignore
        combinedHooks[hookName] = implementations[0];
        continue;
      }

      if (anyToolsHaveEffect) {
        // TODO any way to do?
        throw new Error(`Multiple tools with effects detected. Please ensure a plugin register only one tool at a time.`);
      }

      // Just combine the hooks
      combinedHooks[hookName] = async function (this: PluginContext, ...args: any[]) {
        for (const impl of implementations) {
          callHook(impl, this, args);
        }
        // return null to let other plugins handle it
        return null;
      } as any;
    }

    debug(combinedHooks);

    return combinedHooks;
  }
}
