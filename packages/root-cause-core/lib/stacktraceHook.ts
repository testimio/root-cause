import { TestContext } from './TestContext';
import { extractCodeLocationDetailsSync } from './utils';

export const stacktraceHook = async (testContext: TestContext) => {
  const stepCodeLocation = extractCodeLocationDetailsSync(testContext.testFilePath, process.cwd());

  const metadata = {
    stepCodeLocation,
  };
  // laalalal
  testContext.addStepMetadata(metadata);
};
