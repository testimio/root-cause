import { AfterHook, ProxiedMethodCallData } from '../interfaces';

const isNullOrUndefined = (val: unknown) => val === null || val === undefined;

const getSelectorAndText = (data: ProxiedMethodCallData[]) => {
  let finalSelector = null;
  let finalText = null;

  // TODO: do we want this behavior, or just get the last one?
  for (const { selector, text, index } of data) {
    if (selector) {
      if (!finalSelector) {
        finalSelector = `${selector}`;
      } else {
        finalSelector = `${finalSelector} > ${selector}`;
      }
    }

    // tried index ?? false, got false for 0 🤨
    if (!isNullOrUndefined(index)) {
      // should this be :nth(index)?
      finalSelector = `${finalSelector}[${index}]`;
    }
    if (!isNullOrUndefined(text)) {
      finalText = text;
    }
  }

  return [finalSelector, finalText];
};

export const puppeteerMetadata: AfterHook = async function puppeteerMetadata({
  fnName,
  testContext,
  methodCallData,
}) {
  const [selector, text] = getSelectorAndText(methodCallData);

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
