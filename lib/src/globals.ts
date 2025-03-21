import http from 'node:http';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HttpServerOptions } from './types';
import picocolors from 'picocolors';

import { createDebug } from './utils';
const debug = createDebug('ServerManager');

/**
 * Global singleton state for sharing HTTP and MCP servers across plugin instances
 */
interface ServerState {
  httpServer: http.Server | null;
  mcpServer: McpServer | null;
  isServerStarted: boolean;
}

/**
 * Global singleton state (will persist between function calls)
 */
const globalState: ServerState = {
  httpServer: null,
  mcpServer: null,
  isServerStarted: false
};

/**
 * Getter/Setter for the HTTP server and MCP server.
 * 
 * Note: settings are only set once, so if you call the setter multiple times,
 * it will only set the server the first time, and you will get the same server
 * instance on subsequent calls.
 */
export const serverManager = {
  setMcpServer(server: McpServer): McpServer {
    if (!globalState.mcpServer) {
      globalState.mcpServer = server;
    }
    return globalState.mcpServer;
  },

  getMcpServer(): McpServer | null {
    return globalState.mcpServer;
  },

  setHttpServer(server: http.Server): http.Server {
    if (!globalState.httpServer) {
      globalState.httpServer = server;
    }
    return globalState.httpServer;
  },

  getHttpServer(): http.Server | null {
    return globalState.httpServer;
  },

  async startHttpServer(options: HttpServerOptions): Promise<void> {
    if (!globalState.httpServer) {
      debug('HTTP server not set');
      return;
    }

    if (globalState.isServerStarted) {
      debug('Server already started');
      return;
    }


    return new Promise((resolve) => {
      globalState.isServerStarted = true;

      globalState.httpServer!.listen(
        options.port,
        options.host,
        () => {
          console.log(picocolors.green(`MCP SSE Server Listening on http://${options.host}:${options.port}`));
          resolve();
        }
      );

      globalState.httpServer!.on('error', (err) => {
        console.error(picocolors.red(`Error starting HTTP server: ${err.message}`));
        globalState.isServerStarted = false;
      });

      globalState.httpServer!.on('close', () => {
        console.log(picocolors.yellow('HTTP server closed'));
        globalState.isServerStarted = false;
      });
    });
  },

  isRunning(): boolean {
    return globalState.isServerStarted;
  }
};
