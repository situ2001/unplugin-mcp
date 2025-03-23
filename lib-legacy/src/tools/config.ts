import { InputOptions, PluginHooks } from "rollup";
import { RollupMcpTool, RollupMcpToolSetupOptions } from "../mcp-server";
import DeferredCtor, { Deferred } from 'promise-deferred';

import { createDebug } from "../utils";
const debug = createDebug('BuildConfigTool');

export class BuildConfigTool implements RollupMcpTool {
  private buildConfig: Deferred<InputOptions>;

  affectsBuildProcess: boolean = false;

  constructor() {
    this.buildConfig = new DeferredCtor<InputOptions>();
  }

  setupMcpServer(mcpServer: any, options?: any) {
    mcpServer.tool(
      `get-build-config`,
      async () => {
        debug('get-build-config called');
        const cfg = await this.buildConfig.promise;
        debug('Build config resolved');

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

  registerRollupHooks(options?: RollupMcpToolSetupOptions): Partial<PluginHooks> {
    let self = this;

    return {
      buildStart(config: InputOptions) {
        debug('Build started');
      },

      options(config) {
        debug('options called');
        self.buildConfig.resolve(config);
        debug('Build config resolved');
      }
    }
  }
}
