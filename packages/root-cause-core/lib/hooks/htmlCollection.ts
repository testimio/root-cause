import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';
import { join } from 'path';
import { CDPSession } from 'puppeteer';
import { BeforeHook, RootCausePage } from '../interfaces';
import { promises as fs } from 'fs';

const command = 'Page.captureSnapshot' as const;

type CaptureSnapshot = ProtocolMapping.Commands[typeof command];

export function createHtmlCollectionHook(page: RootCausePage): BeforeHook {
  // Benji promised me it's real
  const session = (page as any)._client as CDPSession;

  return async function htmlCollectionHook({ testContext }) {
    const params: CaptureSnapshot['paramsType'] = [{ format: 'mhtml' }];
    const { data: mhtmlContent } = (await session.send(
      command,
      params
    )) as CaptureSnapshot['returnType'];

    const mhtmlFile = `${testContext.currentStep?.index}.document.mhtml`;
    const outputFilePath = join(testContext.testArtifactsFolder, mhtmlFile);
    await fs.writeFile(outputFilePath, mhtmlContent);
    testContext.addStepMetadata({ mhtmlFile });
  };
}
