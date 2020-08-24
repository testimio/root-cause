import { TestContext } from './TestContext';
import { extractCodeErrorDetails } from './utils';

export const stacktraceHook = async (testContext: TestContext) => {
    const myObject: any = {};
    Error.captureStackTrace(myObject);

    const codeError = await extractCodeErrorDetails(myObject.stack);
    const metadata = {
        codeError,
    };
    testContext.addStepMetadata(metadata);
};

