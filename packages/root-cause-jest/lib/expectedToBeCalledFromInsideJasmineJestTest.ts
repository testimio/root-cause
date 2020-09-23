import type { JasmineCurrentTestInfo, FailedExpectations } from './interfaces';
import type { TestEndStatus } from '@testim/root-cause-types';
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
