import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import cors from 'cors';
import debug from 'debug';
import http, { ServerResponse, IncomingMessage } from 'http';

const loggerDebug = debug('root-cause:debug');
const loggerError = debug('root-cause:error');

let server: http.Server;

export async function openServer(port: number, testPath: string): Promise<string> {
  const app = express();

  loggerDebug('testPath', testPath);

  if (
    !(await fs.pathExists(path.resolve(__dirname, '../client-static/index.html'))) &&
    !(await fs.pathExists(path.resolve(__dirname, '../dist/client-static/index.html')))
  ) {
    throw new Error('missing client static');
  }

  if (!(await fs.pathExists(path.resolve(testPath, 'results.json')))) {
    console.error({ testPath });
    throw new Error('testPath dose not exist');
  }

  app.use(cors({ origin: ['http://localhost:3000'] }));

  // We want to prevent caching of index.html
  // The server is local so it's not very important
  app.use(noCacheMiddleware);
  app.use(express.static(path.resolve(__dirname, '../client-static'))); // deploy-time
  app.use(express.static(path.resolve(__dirname, '../dist/client-static'))); // dev-time

  app.use('/results', express.static(testPath));

  app.get('/test/', async (req: express.Request, res: express.Response) => {
    try {
      const results = JSON.parse(await fs.readFile(path.resolve(testPath, 'results.json'), 'utf-8'));
      res.json(results);
    } catch (e) {
      console.error({ testPath });
      console.error({ e });
      res.status(500).end('Error loading result');
    }
  });

  app.get('/new-steps/:laststep', (req, res) => res.send('OK'));

  return new Promise((resolve) => {
    server = app.listen(port, () => {
      const url = `http://localhost:${port}`;

      loggerDebug(`root cause available at: ${url}`);
      resolve(url);
    });
  });
}

export function closeServer() {
  server.close();
}

function noCacheMiddleware(_request: IncomingMessage, response: ServerResponse, next: () => void) {
  response.setHeader('Surrogate-Control', 'no-store');
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '0');

  next();
}
