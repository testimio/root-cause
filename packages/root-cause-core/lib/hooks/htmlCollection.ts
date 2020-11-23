import { promises as fs } from 'fs';
import { join } from 'path';
import { BeforeHook, RootCausePage } from '../interfaces';
import { getChromeCDPSession, sendCDPMessage } from '../utils';

export async function createHtmlCollectionHook(page: RootCausePage): Promise<BeforeHook> {
  const session = await getChromeCDPSession(page);

  if (!session) {
    return async () => undefined;
  }

  // @todo need to use the specific page of the step
  return async function htmlCollectionHook({ testContext, stepResult }) {
    const { data: mhtmlContent } = await sendCDPMessage(session, 'Page.captureSnapshot', {
      format: 'mhtml',
    });

    const mhtmlFile = `${stepResult.index}.document.mhtml`;
    const outputFilePath = join(testContext.testArtifactsFolder, mhtmlFile);
    await fs.writeFile(outputFilePath, mhtmlContent);
    stepResult.mhtmlFile = mhtmlFile;
  };
}
