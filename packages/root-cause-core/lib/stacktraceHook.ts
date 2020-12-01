import { extractCodeLocationDetailsSync } from './utils';
import { BeforeHook } from './interfaces';

export const stacktraceHook: BeforeHook = async function stacktraceHook({
  stepResult,
  testContext,
}) {
  const stepCodeLocation = extractCodeLocationDetailsSync(testContext.testFilePath, process.cwd());

  stepResult.stepCodeLocation = stepCodeLocation;
};
