import debug from 'debug';
import type { RequestHandler, Response } from 'express';
import { IFileResult, Parser } from 'fast-mhtml';
import fs from 'fs-extra';
import path from 'path';

const logger = debug('root-cause:debug:serve-mhtml');

function sendFile(res: Response, file: IFileResult) {
  logger('serve-mhtml: sending file %s', file.filename);
  res.setHeader('Content-Type', file.type);
  res.send(file.content);
  res.end();
}

function failWith(res: Response, status: number, error: string) {
  logger('serve-mhtml: %s', error);
  res.status(status);
  res.send(error);
  res.end();
}

export function serveMhtml(testPath: string): RequestHandler {
  const fileCache = new Map<string, IFileResult>();

  async function processMhtml(file: string): Promise<IFileResult> {
    fileCache.clear();

    const data = await fs.readFile(path.resolve(testPath, file));

    const splitFiles: IFileResult[] = new Parser({}).parse(data).rewrite().spit();
    for (const result of splitFiles) {
      fileCache.set(result.filename.replace(/#.*/, ''), result); // remove hash and set in cache
    }

    return splitFiles[0];
  }

  return function serveMhtmlMiddleware({ params: { file } }, res) {
    (async () => {
      if (file.endsWith('mhtml')) {
        const indexFromHtml = await processMhtml(file);
        return sendFile(res, indexFromHtml);
      }

      const result = fileCache.get(file);
      if (!result) {
        return failWith(
          res,
          404,
          `Missing ${file}, should be one of: ${JSON.stringify(fileCache.keys())}`
        );
      }

      sendFile(res, result);
    })().catch(error => {
      return failWith(res, 500, `Error: ${error}<br />${error.stack.replace(/\n/, '<br />')}`);
    });
  };
}
