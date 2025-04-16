import { OutputBundle, OutputChunk, Plugin, PluginHooks } from "rollup";
import { UnpluginMcpTool, UnpluginMcpToolSetupOptions } from "../mcp-server";
import DeferredCtor, { Deferred } from 'promise-deferred';
import { formatBytes } from "../utils";
import zod from 'zod';

import { createDebug } from "../utils/debug";
import { UnpluginOptions } from "unplugin";
const debug = createDebug('BundleSizeTool');

interface BundleSizeInfo {
  fileName: string;
  size: number;
  sizeFormatted: string;
  type: string;
  isEntry: boolean;
  modules: {
    id: string;
    originalSize: number;
    renderedSize: number;
    percentage: number;
  }[];
}

interface BundleSizeAnalysis {
  bundles: BundleSizeInfo[];
  totalSize: number;
  totalSizeFormatted: string;
}

const getInitBundleSizeAnalysis = () => ({
  bundles: [] as BundleSizeInfo[],
  totalSize: 0,
  totalSizeFormatted: '0 B'
});

export class BundleSizeTool implements UnpluginMcpTool {
  private bundleSizeAnalysis: BundleSizeAnalysis;
  private analysisReady: Deferred<boolean>;

  affectsBuildProcess: boolean = false;

  constructor() {
    this.analysisReady = new DeferredCtor<boolean>();
    this.bundleSizeAnalysis = getInitBundleSizeAnalysis();
  }

  setupMcpServer(mcpServer: any, options?: any) {
    mcpServer.tool(
      `get-bundle-size`,
      'Get information about the size of generated bundles and their modules',
      {},
      async () => {
        debug('get-bundle-size called');

        await this.analysisReady.promise;

        return {
          content: [
            {
              type: 'text',
              text: `Bundle size analysis: ${JSON.stringify(this.bundleSizeAnalysis)}`
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
      name: 'bundle-size-tool',

      buildStart() {
        self.analysisReady = new DeferredCtor<boolean>();
        self.bundleSizeAnalysis = getInitBundleSizeAnalysis();
      },

      rollup: {
        generateBundle(outputOptions, bundle) {
          const bundleInfoArray: BundleSizeInfo[] = [];
          let totalSize = 0;

          for (const [fileName, file] of Object.entries(bundle)) {
            let fileSize = 0;

            if ('code' in file) {
              fileSize = file.code.length;
              totalSize += fileSize;

              const modules = file.modules
                ? Object.entries(file.modules)
                  .map(([id, info]) => {
                    const originalSize = info.originalLength || 0;
                    const renderedSize = info.renderedLength || 0;
                    const percentage = (renderedSize / fileSize) * 100;

                    return {
                      id,
                      originalSize,
                      renderedSize,
                      percentage
                    };
                  })
                  .sort((a, b) => b.renderedSize - a.renderedSize)
                : [];

              bundleInfoArray.push({
                fileName,
                size: fileSize,
                sizeFormatted: formatBytes(fileSize),
                type: file.type,
                isEntry: !!file.isEntry,
                modules
              });
            }
          }

          self.bundleSizeAnalysis = {
            bundles: bundleInfoArray,
            totalSize,
            totalSizeFormatted: formatBytes(totalSize)
          };

          self.analysisReady.resolve(true);
          debug(`Bundle size analysis complete for ${bundleInfoArray.length} bundles with total size ${formatBytes(totalSize)}`);
        }
      }
    };
  }
}
