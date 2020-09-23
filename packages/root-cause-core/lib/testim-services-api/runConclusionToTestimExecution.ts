import type { TestimBackendExecutionInputFormat } from './interfaces';
import { promisify } from 'util';
import glob from 'glob';
import { guid } from './guid';
import { createHash } from 'crypto';
import { RunConclusionFile } from '@testim/root-cause-types';

export type TestimUserMetadata = {
  projectId: string;
  companyId: string;
  resultLabels: string[];
};
export type GitMetadata = {
  gitBranch: string;
  gitCommit: string;
  gitRepoUrl: string;
};
function convertExecution(
  conclusion: RunConclusionFile,
  testimUserMetadata: TestimUserMetadata,
  gitMetadata?: GitMetadata,
  guidImpl = guid
): TestimBackendExecutionInputFormat['execution'] {
  const execution: TestimBackendExecutionInputFormat['execution'] = {};

  const testIdToResultIds = new Map();
  // we set our testIds to uuids to make sure there are no duplicates here
  for (const test of conclusion.tests) {
    const resultId = guidImpl();
    testIdToResultIds.set(test.id, resultId);
    execution[resultId] = {
      resultId,
      testId: test.id,
      status: 'FINISHED', // this sets runnerStatus in the backend
      testRunOverrideStatus: 'completed',
      success: test.success,
      reason: test.reason,
      startTime: test.timestamp || conclusion.timestamp,
      endTime: test.endedTimestamp || conclusion.timestamp,
      isTestsContainer: false,
      name: test.name,
      show: true,
      config: getDetaultTestConfig(conclusion, testimUserMetadata, gitMetadata),
    };
  }
  const containers = new Set(conclusion.tests.map((x) => x.suiteFilePath).filter(Boolean));
  for (const container of containers) {
    const resultId = guidImpl();
    const tests = conclusion.tests.filter((x) => x.suiteFilePath === container);

    tests.forEach((test) => {
      execution[testIdToResultIds.get(test.id)].parentResultId = resultId;
    });
    const lastTestEnd = Math.max(...conclusion.tests.map((x) => x.endedTimestamp), conclusion.timestamp);
    execution[resultId] = {
      resultId,
      name: container,
      // TODO(Benji) check if product-wise we want to filter out the running user-name like in test ids
      testId: createHash('md5').update(container).digest('hex'),
      status: 'FINISHED',
      testRunOverrideStatus: 'completed',
      success: tests.every((x) => x.success),
      startTime: conclusion.timestamp,
      endTime: lastTestEnd,
      show: false,
      config: getDetaultTestConfig(conclusion, testimUserMetadata),
      childTestResultIds: tests.map((x) => testIdToResultIds.get(x.id)),
      // TODO(Benji): code: Do we want to support this like in TDK?
      isTestsContainer: true,
    };
  }
  return execution;
}
type TestRunStatus = 'QUEUED' | 'RUNNING' | 'FINISHED' | 'ABORTED' | 'TIMEOUT' | 'SKIPPED';
function getStatus(conclusion: RunConclusionFile): TestRunStatus {
  // we always set the status after the tests have run
  return 'FINISHED';
}

/*
 * Since we did not execute the test - all these values are bullshit.
 * TODO(Benji) provide meaningful data here in a future iteration:
 *  - read these values (like parallel) from Jest (or whatever runner)
 *  - save them to the runConclusions file
 *  - read them here
 */
function getDetaultTestConfig(
  conclusion: RunConclusionFile,
  testimUserMetadata: TestimUserMetadata,
  gitMetadata?: GitMetadata
) {
  return {
    parallel: 1,
    browser: 'chrome',
    runnerVersion: 'none(rootCause)',
    testimBranch: 'master',
    canaryMode: false,
    gitBranch: gitMetadata?.gitBranch ?? undefined,
    gitCommit: gitMetadata?.gitCommit ?? undefined,
    gitRepoUrl: gitMetadata?.gitRepoUrl ?? undefined,
    source: 'n/a',
    testPlans: [],
    testLabels: [],
    testNames: conclusion.tests.map((x) => x.name),
    testIds: [],
    testConfigs: [],
    testConfigIds: [],
    browserTimeout: 3e5,
    timeout: 3e5,
    newBrowserWaitTimeout: 3e5,
    tunnelPort: '80',
    runnerMode: 'n/a',
    sessionType: 'rootCause',
    companyId: testimUserMetadata.companyId,
    testConfig: {},
  };
}

export async function getRunConclusionFiles(rootCauseRunDir: string): Promise<string[]> {
  const files = (await promisify((cb) => glob(`${rootCauseRunDir}/**/*`, { nodir: true }, cb))()) as string[];
  return files;
}

export function runConclusionToTestimExecution(
  conclusion: RunConclusionFile,
  testimUserMetadata: TestimUserMetadata,
  gitMetadata?: GitMetadata,
  guidImpl = guid
): TestimBackendExecutionInputFormat {
  return {
    // we don't control runId and we can't deal with duplicates in the database since this gets translated to a RunResult
    // So append a GUID to it
    runId: conclusion.runId + guidImpl(),
    projectId: testimUserMetadata.projectId,
    labels: `Testim Root Cause Run ${new Date().toLocaleString()}`,
    startTime: conclusion.timestamp,
    endTime: Date.now(),
    execution: convertExecution(conclusion, testimUserMetadata, gitMetadata, guidImpl),
    status: getStatus(conclusion),
    config: getDetaultTestConfig(conclusion, testimUserMetadata, gitMetadata),
    // useful since this is a mechanism that lets customers tag runs
    resultLabels: testimUserMetadata.resultLabels,
    show: true,
    remoteRunId: '',
    metadata: {},
  };
}
