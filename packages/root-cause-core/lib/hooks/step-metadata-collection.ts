import { extractPuppeteerSelector } from '../utils/puppeteer-selector-mapping';
import { extractPuppeteerText } from '../utils/puppeteer-text-mapping';
import { AfterHook } from '../interfaces';

export const puppeteerMetadata: AfterHook = async function puppeteerMetadata({
  args,
  fnName,
  testContext,
  instrumentedFunctionResult,
}) {
  const selector = extractPuppeteerSelector(fnName as any, args);
  const text = extractPuppeteerText(fnName as any, args, instrumentedFunctionResult);

  if (selector) {
    testContext.addStepMetadata({ selector });
  }
  if (fnName) {
    testContext.addStepMetadata({ fnName });
  }
  if (text) {
    testContext.addStepMetadata({ text });
  }
};
