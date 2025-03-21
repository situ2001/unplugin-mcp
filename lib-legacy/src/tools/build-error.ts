import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PluginHooks } from "rollup";
import { RollupMcpTool, RollupMcpToolSetupOptions } from "../mcp-server";
import DeferredCtor, { Deferred } from "promise-deferred";

import { createDebug } from "../utils";

const debug = createDebug('BuildErrorTool');

export class BuildErrorTool implements RollupMcpTool {
  private buildError: Deferred<Error | undefined> = new DeferredCtor<Error | undefined>();

  affectsBuildProcess: boolean = false;

  private async hasError() {
    return (await this.buildError.promise) !== undefined;
  }

  setupMcpServer(mcpServer: McpServer, options?: RollupMcpToolSetupOptions) {
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

  registerRollupHooks(options?: RollupMcpToolSetupOptions): Partial<PluginHooks> {
    const self = this;

    return {
      buildStart() {
        debug('Build started');
        self.buildError = new DeferredCtor<Error | undefined>();
      },

      buildEnd(error: Error | undefined) {
        self.buildError.resolve(error);
        debug('Build error resolved in registerRollupHooks');
      },
    };
  }
}
