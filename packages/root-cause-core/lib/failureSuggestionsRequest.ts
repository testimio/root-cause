import { guid } from './testim-services-api/guid';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
// import type { Response } from 'node-fetch';
import nodeFetch, { Headers } from 'node-fetch';
import debug from 'debug';
import { BASE_BACKEND_URL } from './consts';
// import URL from 'url';
// import https from 'https';
// import http from 'http';

const loggerError = debug('root-cause:error');

const GUID_FILE = 'guid_container';

interface FailureSuggestionRequest {
  uid: string;
  artifacts: number;
  age: number;
  crashes: number;
  osName: string;
}

/**
 * This function swallows errors by design
 */
export async function sendFailureSuggestionRequestIfApplicable(
  crashes: number,
  artifacts: number
): Promise<LocalResponse | undefined> {
  if (process.env.SUGGESTIONS_OPT_OUT) {
    return;
  }

  let resp: LocalResponse | undefined;

  try {
    const body = await buildRequest(crashes, artifacts);

    try {
      resp = await sendRequest(body);
    } catch (e) {
      loggerError(e);
    }

    // if (!resp || resp.status !== 200) {
    //   try {
    //     resp = await sendRequestWithGET(body);
    //   } catch (e) {
    //     e.toString();
    //   }
    // }
  } catch (e) {
    loggerError(e);
  }

  if (resp && resp.status !== 200) {
    loggerError('sendFailureSuggestionRequestIfApplicable status code is not 200:', resp.status);
  }

  return resp;
}

async function buildRequest(crashes: number, artifacts: number): Promise<FailureSuggestionRequest> {
  return {
    osName: os.type(),
    uid: await getUID(),
    artifacts,
    age: await getAgeInDays(),
    crashes,
  };
}

async function sendRequest(body: unknown) {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  return nodeFetch(`${BASE_BACKEND_URL}/suggestions/failureReason`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

interface LocalResponse {
  status?: number;
}

async function getAgeInDays() {
  const creationTime = await getCreationTime();
  const now = Date.now();
  const diffInMs = now - creationTime;
  const diffInDays = Math.floor(diffInMs / (24 * 60 * 60 * 1000));

  return diffInDays;
}

async function getCreationTime() {
  try {
    const statsInfo = fs.stat(path.resolve(__dirname, GUID_FILE));
    return (await statsInfo).birthtimeMs;
  } catch (e) {
    return Date.now();
  }
}

async function getUID(): Promise<string> {
  try {
    const uid = await fs.readFile(path.resolve(__dirname, GUID_FILE), 'utf8');
    return uid;
  } catch (e) {
    loggerError('guid file not found, generate new one');
    const newUid = guid(8);

    try {
      await fs.writeFile(path.resolve(__dirname, GUID_FILE), newUid);
    } catch (e) {
      loggerError('failed to persist the guid');
      loggerError(e);
    }

    return newUid;
  }
}
