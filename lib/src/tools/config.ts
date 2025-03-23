import { InputOptions } from "rollup";
import { UnpluginMcpTool, UnpluginMcpToolSetupOptions } from "../mcp-server";
import DeferredCtor, { Deferred } from 'promise-deferred';

import { createDebug } from "../utils";
import { UnpluginOptions } from "unplugin";
const debug = createDebug('BuildConfigTool');

export class BuildConfigTool implements UnpluginMcpTool {
  private buildConfig: Deferred<InputOptions>;

  affectsBuildProcess: boolean = false;

  constructor() {
    this.buildConfig = new DeferredCtor<InputOptions>();
  }

  setupMcpServer(mcpServer: any, options?: any) {
    mcpServer.tool(
      `get-build-config`,
      "Get build configuration",
      {},
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

  registerPlugins(options?: UnpluginMcpToolSetupOptions): UnpluginOptions {
    let self = this;

    return {
      name: 'build-config-tool',

      rollup: {
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
}
