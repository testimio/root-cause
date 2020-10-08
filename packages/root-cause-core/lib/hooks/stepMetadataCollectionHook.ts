import { AfterHook, ProxiedMethodCallData } from '../interfaces';

const isNullOrUndefined = (val: unknown) => val === null || val === undefined;

const getSelector = (data: ProxiedMethodCallData[]) => {
  let finalSelector = null;

  // TODO: do we want this behavior, or just get the last one?
  for (const { selector, index } of data) {
    if (selector) {
      if (!finalSelector) {
        finalSelector = `${selector}`;
      } else {
        finalSelector = `${finalSelector} > ${selector}`;
      }
    }

    // tried index ?? false, got false for 0 🤨
    if (!isNullOrUndefined(index)) {
      // Two options are: "[index]" and ":nth-of-type(index)"
      // I did nth-of-type first, but considering it requires a tag selector,
      // It would be both incorrect and longer.
      // TODO: Remove this comment before merging
      finalSelector = `${finalSelector}[${index}]`;
    }
  }

  return finalSelector;
};

export const stepMetadataCollectionHook: AfterHook = async function stepMetadataCollectionHook({
  fnName,
  testContext,
  methodCallData,
}) {
  const selector = getSelector(methodCallData);
  const text = methodCallData[methodCallData.length - 1]?.text;

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
