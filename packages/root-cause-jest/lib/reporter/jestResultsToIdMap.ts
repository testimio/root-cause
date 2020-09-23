import type { TestResult } from '@jest/reporters';
import path from 'path';
import type { RunnerResultEntry } from '@testim/root-cause-types';
import { utils } from '@testim/root-cause-core';

export function jestResultsToIdMap(
  jestSuiteResults: TestResult[],
  projectRoot: string
): Map<string, RunnerResultEntry> {
  const flattedSuites = utils.arrayFlat(
    jestSuiteResults.map((s) =>
      s.testResults.map(
        (r): RunnerResultEntry => ({
          testResult: r,
          suiteFilePath: path.relative(projectRoot, s.testFilePath),
          id: utils.testUniqueIdentifierFromStartParams({
            projectRoot,
            fullSuitePath: s.testFilePath,
            fullName: r.fullName,
          }),
        })
      )
    )
  );

  return new Map(flattedSuites.map((e) => [e.id, e]));
}
