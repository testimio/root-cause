import { TestimApi } from '../testim-services-api';
import { getTestimCredentials } from '../testim-credentials-manager';

async function authenticateIfNeeded(): Promise<TestimApi | null> {
  const testimAuthInfo = await getTestimCredentials();

  if (testimAuthInfo.projectId && testimAuthInfo.ciToken) {
    const testim = new TestimApi();
    await testim.authenticate(testimAuthInfo.projectId, testimAuthInfo.ciToken);
    return testim;
  }
  return null;
}
const testimBackendPromise = authenticateIfNeeded().catch(() => {});

export async function getCloudAsset(path: string) {
  const testim = await testimBackendPromise;
  if (!testim || !testim.projectId) {
    throw new Error('Unauthenticated');
  }

  const response = await testim.assets.getAsset({
    projectId: testim.projectId,
    pathInsideBucket: `.root-cause/${path}`,
  });
  return response;
}
