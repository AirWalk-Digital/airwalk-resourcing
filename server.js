/* eslint-disable no-console */
const { createServer } = require('http');
const next = require('next');
const { parse } = require('url');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ noServer: true });
const {
  setupWSConnection,
  // setPersistence,
  // docs,
} = require('y-websocket/bin/utils');
// const persisitance = require('./store').persistence;

// setPersistence(persisitance);
wss.on('connection', setupWSConnection);

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const nextUpgradeHandler = app.getUpgradeHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (pathname.startsWith('/resourcing')) {
      // Rewrite /resourcing to /
      const newUrl = req.url.replace('/resourcing', '');
      req.url = newUrl;
      app.render(req, res, '/', parsedUrl.query);
    } else {
      handler(req, res, parsedUrl);
    }
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .on('upgrade', (request, socket, head) => {
      const { pathname } = parse(request.url || '/', true);

      if (pathname === '/_next/webpack-hmr') {
        return nextUpgradeHandler(request, socket, head);
      }

      const handleAuth = (ws) => {
        wss.emit('connection', ws, request);
      };
      wss.handleUpgrade(request, socket, head, handleAuth);
      return undefined; // Explicitly return undefined to satisfy consistent-return
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
