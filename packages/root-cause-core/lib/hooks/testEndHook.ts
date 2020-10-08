import { unknownErrorToOurRepresentation } from './hookUtils';
import { AfterAllHook } from '../interfaces';
import { extractCodeLocationDetailsSync } from '../utils';

export const testEndHook: AfterAllHook = async function testEndHook({ testContext, endStatus }) {
  if (endStatus.success) {
    testContext.addTestMetadata({
      testEndStatus: {
        success: true,
      },
    });
  } else {
    const error = unknownErrorToOurRepresentation(endStatus.error);
    let codeLocationDetails;

    try {
      codeLocationDetails = extractCodeLocationDetailsSync(testContext.testFilePath, process.cwd());
    } catch (e) {
      // will not work on node, and also is considered best effort here
    }

    testContext.addTestMetadata({
      testEndStatus: {
        success: endStatus.success,
        error,
        codeLocationDetails,
      },
    });
  }
};
