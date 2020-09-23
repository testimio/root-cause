import nodeFetch, { Headers } from 'node-fetch';
import { TestimAuthApi } from './testimAuthApi';
import { TestimApiError, TestimNotFoundError } from './apiErrors';
import FormData from 'form-data';
import type { AbortSignal } from 'abort-controller';

type StorageRequest = {
  asset: Uint8Array | NodeJS.ReadableStream;
  projectId: string;
  pathInsideBucket: string;
  contentType?: string;
  contentLength?: number;
  signal?: AbortSignal;
};
export class TestimAssetsApi {
  constructor(
    private baseUrl = 'https://services.testim.io',
    private testimAuthApi: TestimAuthApi = new TestimAuthApi(baseUrl),
    private bucket: string = 'test-result-artifacts',
    private fetch: typeof nodeFetch = nodeFetch
  ) {}

  async getAsset({
    projectId,
    pathInsideBucket,
  }: {
    projectId: string;
    pathInsideBucket: string;
  }): Promise<ReturnType<typeof nodeFetch>> {
    const headers = new Headers();
    this.testimAuthApi.addAuthorizationHeader(headers);
    const response = await this.fetch(`${this.baseUrl}/storage/${this.bucket}/${projectId}/${pathInsideBucket}`, {
      headers,
    });
    if (response.status === 404) {
      throw new TestimNotFoundError(`File ${pathInsideBucket} not found in bucket ${this.bucket}`);
    }
    if (!response.ok) {
      throw new TestimApiError(new Error(await response.text()), 'failed to get resource', 'E_UPLOAD_REQUEST_FAILED');
    }
    return response;
  }

  async uploadAsset({ asset, projectId, pathInsideBucket, contentType, signal }: StorageRequest) {
    const headers = new Headers();
    this.testimAuthApi.addAuthorizationHeader(headers);
    const data = new FormData();
    data.append('file', asset);
    data.append('projectId', projectId);
    if (contentType) {
      data.append('mimeType', contentType);
    }
    data.append('storageType', 'azure');
    data.append('name', pathInsideBucket);

    //TODO(Benji) - detect that the content we're uploading would benefit from gzip and gzip

    //TODO(Benji) - concurrency?
    const response = await this.fetch(`${this.baseUrl}/storage/${this.bucket}/${projectId}/${pathInsideBucket}`, {
      headers,
      body: data,
      method: 'POST',
      signal: signal as any,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new TestimApiError(new Error(text), response.statusText, 'E_UPLOAD_REQUEST_FAILED');
    }
  }
}
