import type nodeFetch from 'node-fetch';

import { TestimAuthApi } from './testimAuthApi';
import { TestimExecutionsApi } from './testimExecutionsApi';
import { TestimAssetsApi } from './testimAssetsApi';
import { ScreenplayExecutionsApi } from './screenplayExecutionsApi';
import type { AbortSignal } from 'abort-controller';

export { TestimAuthApi } from './testimAuthApi';
export { TestimExecutionsApi } from './testimExecutionsApi';
export { TestimAssetsApi } from './testimAssetsApi';
export { ScreenplayExecutionsApi } from './screenplayExecutionsApi';

/**
 * This class is a facade over the Testim Backend API
 */
export class TestimApi {
    auth: TestimAuthApi;
    assets: TestimAssetsApi;
    executions: TestimExecutionsApi;
    screenplayExecutions: ScreenplayExecutionsApi;
    projectId?: string;
    ciToken?: string;
    constructor(baseUrl?: string, fetch?: typeof nodeFetch) {
        this.auth = new TestimAuthApi(baseUrl, fetch);
        this.assets = new TestimAssetsApi(baseUrl, this.auth, undefined, fetch);
        this.executions = new TestimExecutionsApi(baseUrl, this.auth, fetch);
        this.screenplayExecutions = new ScreenplayExecutionsApi(this.executions, this.assets);
    }
    async authenticate(projectId: string, ciToken: string, signal?: AbortSignal) {
        await this.auth.getToken(projectId, ciToken, signal);
        this.projectId = projectId;
        this.ciToken = ciToken;
    }
}
