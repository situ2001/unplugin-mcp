import Koa from 'koa';
import Router from '@koa/router';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HttpServerOptions, McpPluginOptions } from './types';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import http from 'http';

import { createDebug, createErrorDebug } from './utils';
const debug = createDebug('WebServer');
const errorDebug = createErrorDebug('WebServer');

/**
 * Provided default by the plugin.
 * 
 * It will create a koa web server and bind the MCP server to it, then
 * return the http server.
 */
export function createHttpServer(
  mcpServer: McpServer,
  option: HttpServerOptions,
) {
  const koa = new Koa();

  const router = new Router();
  setupRouteForMcpServer(router, mcpServer, option);

  koa
    .use(router.routes())
    .use(router.allowedMethods());

  const server = http.createServer(koa.callback());

  return server;
}

/**
 * Binds the MCP Server to a Koa web server.
 */
export function setupRouteForMcpServer(
  router: Router,
  mcpServer: McpServer,
  options: HttpServerOptions,
) {
  const basePath = options.basePath ?? '/mcp';
  const transports = new Map<string, SSEServerTransport>();

  // SSE endpoint
  router.get(`${basePath}/sse`, async (ctx) => {
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const transport = new SSEServerTransport(`${basePath}/messages`, ctx.res);
    transports.set(transport.sessionId, transport);

    ctx.req.on('close', () => {
      debug('Client disconnected', transport.sessionId);
      transports.delete(transport.sessionId);
    });


    ctx.respond = false; // Prevent Koa from automatically responding
    await mcpServer.connect(transport);

    debug('Client connected', transport.sessionId);
  });

  // Messages endpoint
  router.post(`${basePath}/messages`, async (ctx) => {
    const url = new URL(ctx.url, `http://${ctx.host}`);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      ctx.status = 400;
      ctx.body = 'Session ID required';
      debug('Session ID required');
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      ctx.status = 404;
      ctx.body = 'Transport not found';
      debug('Transport not found', sessionId);
      return;
    }

    debug('Received message from', sessionId);

    ctx.respond = false; // Prevent Koa from automatically responding
    await transport.handlePostMessage(ctx.req, ctx.res);
  });
}
