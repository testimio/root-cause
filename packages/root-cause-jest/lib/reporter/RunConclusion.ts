import type {
  Reporter,
  TestResult,
  Test,
  AggregatedResult,
  ReporterOnStartOptions,
  Context,
  // eslint-disable-next-line import/no-extraneous-dependencies
} from '@jest/reporters';
// eslint-disable-next-line import/no-extraneous-dependencies
import type { Config } from '@jest/types';
import type { ReporterOptions } from '../interfaces';
import fs from 'fs-extra';
import { jestResultsToIdMap } from './jestResultsToIdMap';
import { utils, CONSTS, runConclusionUtils, persist } from '@testim/root-cause-core';

// https://jestjs.io/docs/en/configuration#reporters-arraymodulename--modulename-options

class JestReporter implements Reporter {
  // That's very likely to match process.cwd() in the test files themselves

  // private rootDir = this.globalConfig.rootDir;
  private rootDir = process.cwd();

  private runId = this.reporterOptions.runId || CONSTS.FALLBACK_RUN_ID;

  constructor(protected globalConfig: Config.GlobalConfig, protected reporterOptions: ReporterOptions = {}) {
    // see if can use:
    // https://jestjs.io/docs/en/configuration#testenvironmentoptions-object
    // this.globalConfig.testEnvironment
    // this.globalConfig.testEnvironmentOptions
    // And avoid using reporterOptions
  }

  onTestResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {}

  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions) {}

  onTestStart(test: Test) {}

  async onRunComplete(contexts: Set<Context>, results: AggregatedResult) {
    // console.log('onRunComplete start');
    const rootCausePath = utils.constructResultDir(this.rootDir);
    const rootCauseRunResultsPath = utils.constructTestInvocationResultDir(this.rootDir, this.runId);
    if (!fs.pathExists(rootCauseRunResultsPath)) {
      return;
    }
    // it's very possible that there won't be complete intersection between root cause & jest results
    // not all jest tests might have root cause attached, and maybe there are root cause results in run dir from prev run

    const rootCauseResults = await runConclusionUtils.readRunResultsDirToMap(rootCauseRunResultsPath);
    const jestSide = jestResultsToIdMap(results.testResults, this.rootDir);
    const finalResults = runConclusionUtils.intersectRunnerAndRootCause(rootCauseResults, jestSide);
    await runConclusionUtils.concludeRun(this.runId, rootCausePath, results.startTime, finalResults);

    if (process.env.TESTIM_PERSIST_RESULTS_TO_CLOUD) {
      await persist(this.runId, {
        projectRoot: this.rootDir,
        resultLabel: (global as any).resultLabels ?? null,
      });
    }
  }

  getLastError() {}
}

// export { JestReporter as default };
// make jest happy. explicit commonjs
module.exports = JestReporter;
