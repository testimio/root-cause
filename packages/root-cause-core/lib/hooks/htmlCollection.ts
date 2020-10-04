import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';
import { promises as fs } from 'fs';
import { join } from 'path';
import { BeforeHook, RootCausePage } from '../interfaces';
import { isChromeCDPSession } from '../utils';

const command = 'Page.captureSnapshot' as const;

type CaptureSnapshot = ProtocolMapping.Commands[typeof command];

export function createHtmlCollectionHook(page: RootCausePage): BeforeHook {
  // Benji promised me it's real
  // TODO(giorag): acquire session in playwright, currently only puppeteer
  const session: unknown = (page as any)._client;

  if (!isChromeCDPSession(session)) {
    return async () => undefined;
  }

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
