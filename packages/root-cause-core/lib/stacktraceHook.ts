import { extractCodeLocationDetailsSync } from './utils';
import { BeforeHook } from './interfaces';

export const stacktraceHook: BeforeHook = async function stacktraceHook({ testContext }) {
  const stepCodeLocation = extractCodeLocationDetailsSync(testContext.testFilePath, process.cwd());

  const metadata = {
    stepCodeLocation,
  };

  testContext.addStepMetadata(metadata);
};
