import type { EndTestFunction, AttachReturn, RootCausePage } from '@testim/root-cause-core';
import { loadSettings, CONSTS, utils, attach } from '@testim/root-cause-core';
import { hookExpect } from './hookExpect';
import { expectDataToAssertionReport } from './expectDataToAssertionReport';
import { getJasmineCurrentTest, getEndStatusFromJasmineJest } from './expectedToBeCalledFromInsideJasmineJestTest';

declare const page: RootCausePage;
let endTest: EndTestFunction;
let originalPage: RootCausePage;
let unhookExpect: () => void;

export function registerJasmineReporterToGlobal() {
    // @ts-ignore
    if (typeof jasmine === 'undefined') {
        throw new Error('this file is only expected to be jasmine jest setupFilesAfterEnv');
    }

    // https://github.com/facebook/jest/issues/7774#issuecomment-520780088

    // @ts-ignore
    jasmine.getEnv().addReporter({
        // @ts-ignore
        specStarted: (result) => {
            // @ts-ignore
            jasmine.currentTest = result;
        },
        // @ts-ignore
        specDone: (result) => {
            // @ts-ignore
            jasmine.currentTest = result;
        },
    });
}

export async function forBeforeEachGivenPage<TPage extends RootCausePage>(page: TPage) {
    const currentTest = getJasmineCurrentTest();

    const userSettings = await loadSettings();

    let runId: string;

    // expected to be configured via
    // https://jestjs.io/docs/en/configuration#globals-object
    if ('runId' in global) {
        // @ts-ignore
        runId = global.runId;
    } else {
        runId = CONSTS.FALLBACK_RUN_ID;
    }

    const startTestParams = {
        runId,
        projectRoot: process.cwd(),
        fullName: currentTest.fullName,
        description: currentTest.description,
        fullSuitePath: currentTest.testPath,
    };

    const attachController = await attach({ page, startTestParams, activeFeatures: userSettings.features });

    if (userSettings.features.jestAssertions) {
        unhookExpect = makeHookExpect(attachController, currentTest.testPath);
    }

    return attachController;
}

export async function forBeforeEachOwnGlobals() {
    if (typeof page === 'undefined') {
        throw new Error('Global page is missing');
    }

    const userSettings = await loadSettings();

    const currentTest = getJasmineCurrentTest();

    let runId: string;

    // expected to be configured via
    // https://jestjs.io/docs/en/configuration#globals-object
    if ('runId' in global) {
        // @ts-ignore
        runId = global.runId;
    } else {
        runId = CONSTS.FALLBACK_RUN_ID;
    }

    const startTestParams = {
        runId,
        projectRoot: process.cwd(),
        fullName: currentTest.fullName,
        description: currentTest.description,
        fullSuitePath: currentTest.testPath,
    };

    const attachController = await attach({
        page,
        startTestParams,
        activeFeatures: userSettings.features,
    });

    const { page: wrappedPage, endTest: endTestLocal } = attachController;

    if (userSettings.features.jestAssertions) {
        unhookExpect = makeHookExpect(attachController, currentTest.testPath);
    }

    originalPage = page;

    endTest = endTestLocal;

    // @ts-ignore
    global.page = wrappedPage;

    // @ts-ignore
    global.endTest = endTest;

    // @ts-ignore
    global.unhookExpect = unhookExpect;

    if (page !== wrappedPage) {
        throw new Error('failed to set global page to be the wrapped page');
    }
}

export async function forAfterEachEndTestOwnGlobals() {
    // @ts-ignore
    global.endTest(getEndStatusFromJasmineJest());

    // @ts-ignore
    if (global.unhookExpect) {
        // @ts-ignore
        global.unhookExpect();
    }

    // @ts-ignore
    global.page = originalPage;
}

export async function forAfterEachEndTest(localEndTest: EndTestFunction) {
    localEndTest(getEndStatusFromJasmineJest());
}

export function makeHookExpect<T extends RootCausePage>(attachController: AttachReturn<T>, userTestFile: string) {
    return hookExpect((expectArgs, stacktrace) => {
        attachController.pauseStepsRecording();

        return function matcherStartHandler(matcherName, matcherArgs, modifier) {
            return {
                sync(matcherResult) {
                    // failed assertions are handled by test failure, so we won't report on them here ATM
                    // Edge cases are possible
                    if (matcherResult.success) {
                        const report = {
                            ...expectDataToAssertionReport({
                                expectArgs,
                                modifier: modifier === 'root' ? undefined : modifier,
                                matcherName,
                                matcherArgs,
                            }),
                            stepCodeLocation: utils.extractCodeLocationDetailsSync(userTestFile),
                        };
                        attachController.reportAssertion(report);
                    } else {
                        const report = {
                            ...expectDataToAssertionReport({
                                expectArgs,
                                modifier: modifier === 'root' ? undefined : modifier,
                                matcherName,
                                matcherArgs,
                            }),
                            stepCodeLocation: utils.extractCodeLocationDetailsSync(userTestFile),
                            stepError: utils.unknownValueThatIsProbablyErrorToStepError(matcherResult.error),
                        };
                        attachController.reportAssertion(report);
                    }

                    attachController.resumeStepsRecording();
                },
                async async(matcherResultAsync) {
                    if (matcherResultAsync.success) {
                        const report = {
                            ...expectDataToAssertionReport({
                                expectArgs,
                                modifier: modifier === 'root' ? undefined : modifier,
                                matcherName,
                                matcherArgs,
                            }),
                            stepCodeLocation: utils.extractCodeLocationDetailsSync(userTestFile),
                        };
                        attachController.reportAssertion(report);
                    } else {
                        const report = {
                            ...expectDataToAssertionReport({
                                expectArgs,
                                modifier: modifier === 'root' ? undefined : modifier,
                                matcherName,
                                matcherArgs,
                            }),
                            stepCodeLocation: utils.extractCodeLocationDetailsSync(userTestFile),
                            stepError: utils.unknownValueThatIsProbablyErrorToStepError(matcherResultAsync.error),
                        };
                        attachController.reportAssertion(report);
                    }

                    attachController.resumeStepsRecording();
                },
            };
        };
    });
}
