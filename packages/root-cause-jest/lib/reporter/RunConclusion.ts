/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * This is a "silent" reporter,
 * To be used as a secondary reporter. if the user does not use our default reporter
 * (Jest supports multiple reporters)
 */
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

export default class JestReporter implements Reporter {
  // That's very likely to match process.cwd() in the test files themselves

  // private rootDir = this.globalConfig.rootDir;
  protected rootDir = process.cwd();

  protected runId: string;

  constructor(
    protected globalConfig: Config.GlobalConfig,
    protected reporterOptions: ReporterOptions = {}
  ) {
    // see if can use:
    // https://jestjs.io/docs/en/configuration#testenvironmentoptions-object
    // this.globalConfig.testEnvironment
    // this.globalConfig.testEnvironmentOptions
    // And avoid using reporterOptions

    if (this.reporterOptions.runId) {
      this.runId = this.reporterOptions.runId;
    } else {
      const now = Date.now();
      // reporters are loaded into jest main process before workers are spawned, so we can pass our run id as env var from here
      process.env[CONSTS.RUN_ID_ENV_VAR] = now.toString();
      this.runId = now.toString();
    }
  }

  onTestResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult): void {}

  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions): void {}

  onTestStart(test: Test): void {}

  async onRunComplete(contexts: Set<Context>, results: AggregatedResult): Promise<void> {
    // console.log('onRunComplete start');
    const rootCausePath = utils.constructResultDir(this.rootDir);
    const rootCauseRunResultsPath = utils.constructTestInvocationResultDir(
      this.rootDir,
      this.runId
    );
    if (!fs.pathExists(rootCauseRunResultsPath)) {
      return;
    }
    // it's very possible that there won't be complete intersection between root cause & jest results
    // not all jest tests might have root cause attached, and maybe there are root cause results in run dir from prev run

    const rootCauseResults = await runConclusionUtils.readRunResultsDirToMap(
      rootCauseRunResultsPath
    );
    const jestSide = jestResultsToIdMap(results.testResults, this.rootDir);
    const finalResults = runConclusionUtils.intersectRunnerAndRootCause(rootCauseResults, jestSide);
    await runConclusionUtils.concludeRun(
      this.runId,
      rootCausePath,
      results.startTime,
      finalResults
    );

    if (process.env.TESTIM_PERSIST_RESULTS_TO_CLOUD) {
      await persist(this.runId, {
        projectRoot: this.rootDir,
        resultLabel: (global as any).resultLabels ?? null,
      });
    }
  }

  getLastError(): Error | undefined {
    // eslint-disable-next-line no-useless-return
    return;
  }
}

// The jest setup in projects like https://github.com/Microsoft/fluentui
// wasn't able to load the reporter with esm export default, but only using this
// Not Sure why
module.exports = JestReporter;
