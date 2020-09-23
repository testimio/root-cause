import { DefaultReporter, SummaryReporter } from '@jest/reporters';
// eslint-disable-next-line import/no-extraneous-dependencies
import { formatResultsErrors } from 'jest-message-util';
import chalk from 'chalk';

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
import { CONSTS, utils, runConclusionUtils, persist } from '@testim/root-cause-core';

/*
 * This reporter is a mix of jest built-in DefaultReporter & SummaryReporter,
 * which are included by default with jest,
 * And the root cause run conclusion
 *
 * We use it to inject our message of 'To open in Root Cause viewer, run: root-cause show ID'
 */
class EnhancedDefault implements Reporter {
  private rootDir = process.cwd();

  private runId = this.reporterOptions.runId || CONSTS.FALLBACK_RUN_ID;
  private defaultReporter: DefaultReporter;
  private summaryReporter: SummaryReporter;

  constructor(protected globalConfig: Config.GlobalConfig, protected reporterOptions: ReporterOptions = {}) {
    this.defaultReporter = new DefaultReporter(globalConfig);
    this.summaryReporter = new SummaryReporter(globalConfig);
  }

  async onTestResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {
    /*
            What we do here in hight level
            If the jest test has Root Cause result associated with it,
            We inject our message into the first failureMessages,
            And them we re-run formatResultsErrors and overwriting the failureMessage of the test file.

            The original value for testResult.failureMessage is from the runner-reporter side, see:
            https://github.com/facebook/jest/blob/v26.1.0/packages/jest-jasmine2/src/reporter.ts#L87-L93
            We are using the same `formatResultsErrors` function
        */

    const runResultsPath = utils.constructTestInvocationResultDir(this.rootDir, this.runId);

    const rootCauseResults = await runConclusionUtils.readRunResultsDirToMap(runResultsPath);

    testResult.testResults = testResult.testResults.map((r) => {
      const rootCauseTestId = utils.testUniqueIdentifierFromStartParams({
        projectRoot: this.rootDir,
        fullSuitePath: testResult.testFilePath,
        fullName: r.fullName,
      });

      if (rootCauseResults.has(rootCauseTestId) && r.failureMessages[0]) {
        r.failureMessages[0] = `${chalk.blue(
          `To open in Root Cause viewer, run: ${chalk.underline(`npx root-cause show ${rootCauseTestId}`)}`
        )}\n ${r.failureMessages[0]}'`;
      }

      return r;
    });

    const formattedErrorMessage = formatResultsErrors(
      testResult.testResults,
      {
        rootDir: this.globalConfig.rootDir,
        testMatch: [],
      },
      {
        noStackTrace: false,
      },
      test.path
    );

    testResult.failureMessage = formattedErrorMessage;

    this.defaultReporter.onTestResult(test, testResult, aggregatedResult);
    this.summaryReporter.onTestResult(test, testResult, aggregatedResult);
  }

  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions) {
    this.defaultReporter.onRunStart(results, options);
    this.summaryReporter.onRunStart(results, options);
  }

  onTestStart(test: Test) {
    this.defaultReporter.onTestStart(test);
    this.summaryReporter.onTestStart(test);
  }

  async onRunComplete(contexts: Set<Context>, results: AggregatedResult) {
    this.defaultReporter.onRunComplete();
    this.summaryReporter.onRunComplete(contexts, results);

    // console.log('onRunComplete start');
    const rootCausePath = utils.constructResultDir(this.rootDir);
    const rootCauseRunResultsPath = utils.constructTestInvocationResultDir(this.rootDir, this.runId);
    if (!(await fs.pathExists(rootCauseRunResultsPath))) {
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

  getLastError() {
    const errorFromDefaultReporter = this.defaultReporter.getLastError();
    if (errorFromDefaultReporter) {
      return errorFromDefaultReporter;
    }

    return this.summaryReporter.getLastError();
  }
}

module.exports = EnhancedDefault;
