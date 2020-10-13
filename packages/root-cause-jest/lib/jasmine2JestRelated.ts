import type { JasmineCurrentTestInfo, FailedExpectations } from './interfaces';
import type { TestEndStatus } from '@testim/root-cause-types';

export function isJasmine2() {
  return typeof jasmine !== 'undefined';
}

export function registerJasmineCurrentTest() {
  if (typeof jasmine !== 'undefined') {
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
  } else {
    throw new Error('Jasmine global is missing');
  }
}

/**
 * Helper that masks access to the jasmine global
 */
export function getJasmineCurrentTest(): JasmineCurrentTestInfo {
  // @ts-ignore
  if (typeof jasmine === 'undefined') {
    throw new Error('global jasmine is missing');
  }

  // @ts-ignore
  if (typeof jasmine.currentTest === 'undefined') {
    throw new Error('global jasmine.currentTest is missing');
  }

  // @ts-expect-error
  return jasmine.currentTest;
}

/**
 * Helper that masks access to the jasmine global
 */
export function getEndStatusFromJasmineJest(): TestEndStatus<unknown, FailedExpectations> {
  const t = getJasmineCurrentTest();
  const testEndStatus =
    t.failedExpectations.length > 0
      ? ({
          success: false,
          error: t.failedExpectations[0],
        } as const)
      : ({
          success: true,
          data: t.passedExpectations,
        } as const);

  return testEndStatus;
}
