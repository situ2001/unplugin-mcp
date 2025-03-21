import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UnpluginMcpTool, UnpluginMcpToolSetupOptions } from "../mcp-server";
import DeferredCtor, { Deferred } from "promise-deferred";

import { createDebug } from "../utils";
import { UnpluginOptions } from "unplugin";

const debug = createDebug('BuildErrorTool');

export class BuildErrorTool implements UnpluginMcpTool {
  private buildError: Deferred<Error | undefined> = new DeferredCtor<Error | undefined>();

  affectsBuildProcess: boolean = false;

  private async hasError() {
    return (await this.buildError.promise) !== undefined;
  }

  setupMcpServer(mcpServer: McpServer, options?: UnpluginMcpToolSetupOptions) {
    const { tag } = options ?? {};

    mcpServer.tool(
      `get-build-error`,
      async () => {
        debug('get-build-error called');
        const error = await this.buildError.promise;
        debug('Build error resolved');

        return {
          content: [
            {
              type: 'text',
              text: `Build has ended with an error: ${(await this.hasError()) ? 'Yes' : 'No'}.`
            },
            {
              type: 'text',
              text: (await this.hasError())
                ? `Error details: ${JSON.stringify(error)}`
                : 'No error information available.'
            }
          ]
        };
      }
    );

    return mcpServer;
  }

  registerPlugins(options?: UnpluginMcpToolSetupOptions): UnpluginOptions {
    const self = this;

    return {
      name: 'build-error-tool',

      buildStart() {
        debug('Build started');
        self.buildError = new DeferredCtor<Error | undefined>();
      },

      rollup: {
        buildEnd(error: Error | undefined) {
          debug('Build ended');
          self.buildError.resolve(error);
          debug('Build error resolved in registerRollupHooks');
        },
      }
    };
  }
}
