export interface ReporterOptions {
  runId?: string;
}

/**
 * We extract this info via jasmine apis in jasmine2 or via our env wrapper in circus
 */
export interface CurrentTestInfo {
  testPath: string;
  description: string;
  /**
   * The name is the concatenated describes stack + description
   */
  fullName: string;
  failedExpectations: FailedExpectationsSubset[];
}

// https://github.com/facebook/jest/issues/7774#issuecomment-626217091
// https://jasmine.github.io/api/edge/global.html#SpecResult
export interface JasmineCurrentTestInfo {
  id: string;
  description: string;
  /**
   * The name is the concatenated describes stack + description
   */
  fullName: string;
  failedExpectations: FailedExpectations[];
  // not really available for us,jasmine jest doesn't have it
  // see https://jasmine.github.io/2.1/custom_reporter.html#section-specDone
  passedExpectations: unknown[];
  pendingReason: string;
  testPath: string;
}

export interface FailedExpectations {
  actual: string;
  error: Error;
  expected: string;
  matcherName: string;
  message: string;
  passed: boolean;
  stack: string;
}

export interface FailedExpectationsSubset {
  error: Error;
  message: string;
  stack: string;
}
