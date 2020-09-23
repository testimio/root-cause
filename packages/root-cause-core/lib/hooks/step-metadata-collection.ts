import { extractPuppeteerSelector } from '../utils/puppeteer-selector-mapping';
import { extractPuppeteerText } from '../utils/puppeteer-text-mapping';
import type { TestContext } from '../TestContext';
import { RootCausePage } from '../interfaces';

export async function puppeteerMetadata(
  testContext: TestContext,
  fnName: string,
  proxyContext: any,
  rootPage: RootCausePage,
  args: any[],
  returnValue: any
) {
  const selector = extractPuppeteerSelector(fnName as any, args);
  const text = extractPuppeteerText(fnName as any, args, returnValue);
  if (selector) {
    testContext.addStepMetadata({ selector });
  }
  if (fnName) {
    testContext.addStepMetadata({ fnName });
  }
  if (text) {
    testContext.addStepMetadata({ text });
  }
}
