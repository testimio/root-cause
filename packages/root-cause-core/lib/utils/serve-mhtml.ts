import path from 'path';
import fs from 'fs-extra';
import { RequestHandler, Response } from 'express';
import { Parser } from 'fast-mhtml';

// Actual interface has differences
interface FileContent {
  filename: string;
  content: string;
  type: string;
}

function sendFile(res: Response, file: FileContent) {
  res.setHeader('Content-Type', file.type);
  res.send(file.content);
  res.end();
}

function failWith(res: Response, status: number, error: string) {
  res.status(status);
  res.send(error);
  res.end();
}

export function serveMhtml(testPath: string): RequestHandler {
  const fileCache = new Map<string, FileContent>();

  async function processMhtml(file: string): Promise<FileContent> {
    fileCache.clear();

    const data = await fs.readFile(path.resolve(testPath, file));

    const splitFiles: FileContent[] = new Parser({}).parse(data).rewrite().spit();
    for (const result of splitFiles) {
      fileCache.set(result.filename.replace(/#.*/, ''), result); // remove hash and set in cache
    }

    return splitFiles[0];
  }

  return async ({ params: { path: file } }, res) => {
    if (file.endsWith('mhtml')) {
      try {
        const indexFromHtml = await processMhtml(file);
        return sendFile(res, indexFromHtml);
      } catch (err) {
        return failWith(res, 500, `Error: ${err}<br />${err.stack.replace(/\n/, '<br />')}`);
      }
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
  };
}
