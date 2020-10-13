import childProcess from 'child_process';
import cors from 'cors';
import debug from 'debug';
import express from 'express';
import fs from 'fs-extra';
import http, { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import { serveMhtml } from './utils/serve-mhtml';

const loggerDebug = debug('root-cause:debug');

const DEV_STATIC_FILES_LOCATION = path.resolve(__dirname, '../../client/build');
const PROD_STATIC_FILES_LOCATION = path.resolve(__dirname, '../client-static');
const STATIC_INDEX_FILE = 'index.html';

let server: http.Server;

async function buildClientStatics() {
  await new Promise<void>((res, rej) => {
    childProcess.exec(
      'yarn workspace @testim/root-cause-client-bundled build -s',
      {
        windowsHide: true,
      },
      (error, sdtOut, stdErr) => {
        if (error) {
          rej(sdtOut);
        } else {
          res();
        }
      }
    );
  });

  if (!(await fs.pathExists(path.resolve(DEV_STATIC_FILES_LOCATION, STATIC_INDEX_FILE)))) {
    throw new Error('Dev statics are missing after build, this is not expected.');
  }
}

function isDevMode() {
  return __filename.endsWith('.ts');
}

export async function openServer(port: number, testPath: string): Promise<string> {
  const app = express();

  loggerDebug('testPath', testPath);

  if (isDevMode()) {
    console.log('--- Dev mode detected ---');
    console.log(
      'For better client development experience, you may start the client dev server on a new terminal using:'
    );
    console.log('yarn workspace @testim/root-cause-client-bundled start');
    console.log('but keep this server also running');

    if (!(await fs.pathExists(path.resolve(DEV_STATIC_FILES_LOCATION, STATIC_INDEX_FILE)))) {
      console.log('Client Static files not found, building client project...');
      try {
        await buildClientStatics();
        console.log('Done building client project');
      } catch (e) {
        console.warn(e);
        console.warn(
          'Building client project failed. you can keep this running, and use the CRA dev server'
        );
        console.warn(
          "If you keep seeing this message and the CRA start don't have any errors, please open an issue"
        );
      }
    }
  } else if (!(await fs.pathExists(path.resolve(PROD_STATIC_FILES_LOCATION, STATIC_INDEX_FILE)))) {
    console.error("Missing client static, there's an issue with the package integrity");
    console.error('Please report an issue');
    throw new Error("Missing client static, there's an issue with the package integrity");
  }

  if (!(await fs.pathExists(path.resolve(testPath, 'results.json')))) {
    console.error({ testPath });
    throw new Error('testPath dose not exist');
  }

  app.use(cors({ origin: ['http://localhost:3000'] }));

  // We want to prevent caching of index.html
  // The server is local so it's not very important
  app.use(noCacheMiddleware);
  app.use(express.static(PROD_STATIC_FILES_LOCATION)); // deploy-time
  app.use(express.static(DEV_STATIC_FILES_LOCATION)); // dev-time

  app.use('/results', express.static(testPath));

  app.get('/test/', async (req: express.Request, res: express.Response) => {
    try {
      const results = JSON.parse(
        await fs.readFile(path.resolve(testPath, 'results.json'), 'utf-8')
      );
      res.json(results);
    } catch (e) {
      console.error({ testPath });
      console.error({ e });
      res.status(500).end('Error loading result');
    }
  });

  app.get('/new-steps/:laststep', (req, res) => res.send('OK'));

  app.get('/test/html/:file', serveMhtml(testPath));

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
