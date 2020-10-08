import { AfterHook, AfterHookArgs } from '../interfaces';
import { unknownErrorToOurRepresentation } from './hookUtils';

export const errorInStepHook: AfterHook = async function errorInStepHook({
  instrumentedFunctionResult,
  testContext,
}: AfterHookArgs) {
  if (!instrumentedFunctionResult.success) {
    testContext.addStepMetadata({
      stepError: unknownErrorToOurRepresentation(instrumentedFunctionResult.error),
    });
  }
};
