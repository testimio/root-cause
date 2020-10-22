import type { EndTestFunction, AttachReturn, RootCausePage } from '@testim/root-cause-core';
import { loadSettings, CONSTS, utils, attach } from '@testim/root-cause-core';
import { hookExpect } from './hookExpect';
import { expectDataToAssertionReport } from './expectDataToAssertionReport';
import {
  getJasmineCurrentTest,
  getEndStatusFromJasmineJest,
  registerJasmineCurrentTest,
  isJasmine2,
} from './jasmine2JestRelated';
import {
  isRootCauseCircusEnvActive,
  getEndStatusFromCircus,
  getCurrentTestInfoFromCircus,
} from './circusRelated';
import type { TestEndStatus } from '@testim/root-cause-types';
import type { FailedExpectationsSubset, CurrentTestInfo } from './interfaces';

declare const page: RootCausePage;
let endTest: EndTestFunction;
let originalPage: RootCausePage;
let unhookExpect: () => void;

export function ensurePrerequisite(): void {
  if (isJasmine2()) {
    registerJasmineCurrentTest();
    return;
  }

  if (isRootCauseCircusEnvActive()) {
    return;
  }

  throw new Error('Root Cause Integration Error');
}

export function getCurrentTest(): CurrentTestInfo {
  if (typeof jasmine !== 'undefined') {
    // @ts-ignore
    if (typeof jasmine.currentTest === 'undefined') {
      throw new Error('global jasmine.currentTest is missing');
    }

    return getJasmineCurrentTest();
  }

  if (isRootCauseCircusEnvActive()) {
    return getCurrentTestInfoFromCircus();
  }

  throw new Error(
    'Root Cause integration issue: CurrentTestInfo is not available from jasmine or circus'
  );
}

export function getEndStatus(): TestEndStatus<unknown, FailedExpectationsSubset> {
  if (isRootCauseCircusEnvActive()) {
    return getEndStatusFromCircus();
  }

  return getEndStatusFromJasmineJest();
}

export async function forBeforeEachGivenPage<TPage extends RootCausePage>(
  page: TPage
): Promise<AttachReturn<TPage>> {
  const currentTest = getCurrentTest();

  const userSettings = await loadSettings();

  let runId: string;

  const runIdFromEnvVar = process.env[CONSTS.RUN_ID_ENV_VAR];
  // expected to be configured via
  // https://jestjs.io/docs/en/configuration#globals-object
  if ('runId' in global) {
    // @ts-ignore
    runId = global.runId;
  } else if (runIdFromEnvVar) {
    runId = runIdFromEnvVar;
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

  if (userSettings.features.jestAssertions) {
    unhookExpect = makeHookExpect(
      attachController,
      currentTest.testPath,
      startTestParams.projectRoot
    );
  }

  return attachController;
}

export async function forBeforeEachOwnGlobals(): Promise<void> {
  if (typeof page === 'undefined') {
    throw new Error('Global page is missing');
  }

  const userSettings = await loadSettings();

  const currentTest = getCurrentTest();

  let runId: string;

  const runIdFromEnvVar = process.env[CONSTS.RUN_ID_ENV_VAR];
  // expected to be configured via
  // https://jestjs.io/docs/en/configuration#globals-object
  if ('runId' in global) {
    // @ts-ignore
    runId = global.runId;
  } else if (runIdFromEnvVar) {
    runId = runIdFromEnvVar;
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
    unhookExpect = makeHookExpect(
      attachController,
      currentTest.testPath,
      startTestParams.projectRoot
    );
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

export async function forAfterEachEndTestOwnGlobals(): Promise<void> {
  // @ts-ignore
  global.endTest(getEndStatus());

  // @ts-ignore
  if (global.unhookExpect) {
    // @ts-ignore
    global.unhookExpect();
  }

  // @ts-ignore
  global.page = originalPage;
}

export async function forAfterEachEndTest(localEndTest: EndTestFunction): Promise<void> {
  localEndTest(getEndStatus());
}

export function makeHookExpect<T extends RootCausePage>(
  attachController: AttachReturn<T>,
  userTestFile: string,
  workingDirectory: string
): () => void {
  return hookExpect((expectArgs, stacktrace) => {
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
              stepCodeLocation: extractCodeLocationDetailsSyncOrUndefined(
                userTestFile,
                workingDirectory
              ),
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
              stepCodeLocation: extractCodeLocationDetailsSyncOrUndefined(
                userTestFile,
                workingDirectory
              ),
              stepError: utils.unknownValueThatIsProbablyErrorToStepError(matcherResult.error),
            };
            attachController.reportAssertion(report);
          }
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
              stepCodeLocation: extractCodeLocationDetailsSyncOrUndefined(
                userTestFile,
                workingDirectory
              ),
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
              stepCodeLocation: extractCodeLocationDetailsSyncOrUndefined(
                userTestFile,
                workingDirectory
              ),
              stepError: utils.unknownValueThatIsProbablyErrorToStepError(matcherResultAsync.error),
            };
            attachController.reportAssertion(report);
          }
        },
      };
    };
  });
}

function extractCodeLocationDetailsSyncOrUndefined(userTestFile: string, workingDirectory: string) {
  if (CONSTS.IS_NODE_10) {
    return undefined;
  }

  try {
    return utils.extractCodeLocationDetailsSync(userTestFile, workingDirectory);
  } catch (e) {
    return undefined;
  }
}
