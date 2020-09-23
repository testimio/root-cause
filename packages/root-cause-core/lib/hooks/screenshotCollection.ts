import type { TestContext } from '../TestContext';
import path from 'path';
import { extractPuppeteerSelector } from '../utils/puppeteer-selector-mapping';
import { RootCausePage } from '../interfaces';

declare const document: any;
declare const window: any;

export async function puppeteerScreenshot(
  testContext: TestContext,
  fnName: string,
  proxyContext: any,
  rootPage: RootCausePage,
  args: any[]
) {
  if (!testContext.featuresSettings.screenshots) {
    return;
  }

  const filename = `${testContext.getStepIndex()}.${proxyContext.constructor.name.toLowerCase()}-${fnName}.${
    testContext.featuresSettings.screenshots.format === 'png' ? 'png' : 'jpg'
  }`;

  const selector = extractPuppeteerSelector(fnName as any, args);
  if (selector) {
    try {
      //TODO(Benji) figure out why `$eval` here causes:
      // "Object reference chain is too long"
      const rect = await proxyContext.evaluate((selector: string) => {
        const found = document.querySelector(selector);
        if (!found) {
          return { error: 'not found' };
        }
        const { x, y, width, height, top, right, bottom, left } = found.getBoundingClientRect();
        const { innerWidth: screenWidth, innerHeight: screenHeight } = window;
        const { devicePixelRatio } = window;
        return {
          x,
          y,
          width,
          height,
          top,
          right,
          bottom,
          left,
          screenWidth,
          screenHeight,
          devicePixelRatio,
        };
      }, selector);
      testContext.addStepMetadata({ rect });
    } catch (e) {
      // TODO log error when we have logger
      testContext.addStepMetadata({ rect: { error: e } });
    }
  }
  await rootPage.screenshot({
    path: path.join(testContext.testArtifactsFolder, filename),
    type: testContext.featuresSettings.screenshots.format,
    quality:
      testContext.featuresSettings.screenshots.format === 'jpeg'
        ? testContext.featuresSettings.screenshots.quality
        : undefined,
    fullPage: testContext.featuresSettings.screenshots.fullPage,
  });
  testContext.addStepMetadata({ screenshot: filename });
}
