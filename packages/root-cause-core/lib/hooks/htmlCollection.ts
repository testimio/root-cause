import { promises as fs } from 'fs';
import { join } from 'path';
import { BeforeHook, RootCausePage } from '../interfaces';
import { getChromeCDPSession, sendCDPMessage, getPageFromProxyContext } from '../utils';

export async function createHtmlCollectionHook(page: RootCausePage): Promise<BeforeHook> {
  let session = await getChromeCDPSession(page);

  if (!session) {
    return async () => undefined;
  }

  return async function htmlCollectionHook({ testContext, stepResult, proxyContext }) {
    const pageToCaptureSnapshot = (await getPageFromProxyContext(proxyContext)) ?? page;

    if (page !== pageToCaptureSnapshot) {
      try {
        session = await getChromeCDPSession(pageToCaptureSnapshot);
      } catch {
        //
      }
    }

    if (session === null) {
      return;
    }

    const { data: mhtmlContent } = await sendCDPMessage(session, 'Page.captureSnapshot', {
      format: 'mhtml',
    });

    const mhtmlFile = `${stepResult.index}.document.mhtml`;
    const outputFilePath = join(testContext.testArtifactsFolder, mhtmlFile);
    await fs.writeFile(outputFilePath, mhtmlContent);
    stepResult.mhtmlFile = mhtmlFile;
  };
}
