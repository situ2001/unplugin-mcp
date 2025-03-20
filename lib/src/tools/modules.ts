import { ModuleInfo, Plugin, PluginHooks } from "rollup";
import { RollupMcpTool, RollupMcpToolSetupOptions } from "../mcp-server";
import DeferredCtor, { Deferred } from 'promise-deferred';
import zod from 'zod';

import { createDebug } from "../utils";
const debug = createDebug('ModuleTool');

export class ModuleTool implements RollupMcpTool {
  private moduleGraph = new Map<string, ModuleInfo>();
  private graphReady: Deferred<boolean>;

  affectsBuildProcess: boolean = false;

  constructor() {
    this.graphReady = new DeferredCtor<boolean>();
  }

  setupMcpServer(mcpServer: any, options?: any) {
    mcpServer.tool(
      `get-module-info`,
      'Get information about a module in the graph by id. You can get id of modules by invoking the list-modules tool.',
      {
        id: zod.string()
      },
      async (request: { id: string }) => {
        debug('get-module-info called', request);

        await this.graphReady.promise;

        let module: ModuleInfo | undefined;

        module = this.moduleGraph.get(request.id);

        if (!module) {
          return {
            content: [
              {
                type: 'text',
                text: `Module not found.`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Module information: ${JSON.stringify(module)}`
            }
          ]
        };
      }
    );

    mcpServer.tool(
      `list-modules`,
      'List id of all modules in the graph. You can get id of modules by invoking this tool.',
      {},
      async () => {
        debug('list-modules called');

        await this.graphReady.promise;

        const modules = Array.from(this.moduleGraph.keys());

        return {
          content: [
            {
              type: 'text',
              text: `Available modules:\n${modules.join('\n')}`
            }
          ]
        };
      }
    );

    return mcpServer;
  }

  registerRollupHooks(options?: RollupMcpToolSetupOptions): Partial<PluginHooks> {
    const self = this;

    return {
      buildStart() {
        self.graphReady = new DeferredCtor<boolean>();
        // Reset the module graph when a build starts
        self.moduleGraph.clear();
      },

      moduleParsed(moduleInfo) {
        // Store each module's info as it's parsed
        self.moduleGraph.set(moduleInfo.id, moduleInfo);
      },

      buildEnd() {
        // Signal that the graph is complete
        self.graphReady.resolve(true);
        debug(`Module graph built with ${self.moduleGraph.size} modules`);
      }
    };
  }
}
