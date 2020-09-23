import { TestimAuthApi } from './testimAuthApi';
import nodeFetch, { Headers } from 'node-fetch';
import { TestimApiError } from './apiErrors';
import { TestimBackendExecutionInputFormat } from './interfaces';
import type { AbortSignal } from 'abort-controller';

export class TestimExecutionsApi {
  constructor(
    private baseUrl = 'https://services.testim.io',
    private testimAuthApi: TestimAuthApi = new TestimAuthApi(baseUrl),
    private fetch: typeof nodeFetch = nodeFetch
  ) {}
  async createExecution(execution: TestimBackendExecutionInputFormat, signal?: AbortSignal) {
    //TODO(benji)
    // - upload screenshots (use storage/router.js see what clickim calls)
    //   - maybe hash/optimize to make sure we don't upload the image
    //   - use gzip? (so that in the future `console.log`s and network hars are uploaded efficiently)
    // - rewrite screenshot URLs
    // - match format

    const headers = new Headers();
    headers.set('content-type', 'application/json');
    this.testimAuthApi.addAuthorizationHeader(headers);
    const response = await this.fetch(`${this.baseUrl}/result/run`, {
      method: 'POST',
      headers,
      signal: signal as any,
      body: JSON.stringify(execution),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new TestimApiError(
        new Error(),
        `Error creating execution:${response.statusText}\n${body}`,
        'E_CREATING_EXECUTION_FAILED'
      );
    }
  }
}
