import { promises as fs } from 'fs';
import { join } from 'path';
import { BeforeHook, RootCausePage } from '../interfaces';
import { getChromeCDPSession, sendCDPMessage } from '../utils';
import { NOOP_HOOK } from './hookUtils';

export async function createHtmlCollectionHook(page: RootCausePage): Promise<BeforeHook> {
  const session = await getChromeCDPSession(page);

  if (!session) {
    return NOOP_HOOK;
  }

  return async function htmlCollectionHook({ testContext }) {
    const { data: mhtmlContent } = await sendCDPMessage(session, 'Page.captureSnapshot', {
      format: 'mhtml',
    });

    const mhtmlFile = `${testContext.currentStep?.index}.document.mhtml`;
    const outputFilePath = join(testContext.testArtifactsFolder, mhtmlFile);
    await fs.writeFile(outputFilePath, mhtmlContent);
    testContext.addStepMetadata({ mhtmlFile });
  };
}
