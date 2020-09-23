import { TestContext } from './TestContext';
import { extractCodeLocationDetailsSync } from './utils';

export const stacktraceHook = async (testContext: TestContext) => {

    const stepCodeLocation = extractCodeLocationDetailsSync(testContext.testFilePath);

    const metadata = {
        stepCodeLocation,
    };

    testContext.addStepMetadata(metadata);
};

