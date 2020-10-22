/**
 * This is jest reporter that is a wrapper around jest default reporter,
 * To be used instead of jest default runner
 */
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
} from '@jest/reporters';

import type { Config } from '@jest/types';
import type { ReporterOptions } from '../interfaces';
import { utils, runConclusionUtils } from '@testim/root-cause-core';
import RunConclusion from './RunConclusion';

/*
 * This reporter is a mix of jest built-in DefaultReporter & SummaryReporter,
 * which are included by default with jest,
 * And the root cause run conclusion
 *
 * We use it to inject our message of 'To open in Root Cause viewer, run: root-cause show ID'
 */
export default class EnhancedDefault extends RunConclusion implements Reporter {
  private defaultReporter: DefaultReporter;
  private summaryReporter: SummaryReporter;

  constructor(
    protected globalConfig: Config.GlobalConfig,
    protected reporterOptions: ReporterOptions = {}
  ) {
    super(globalConfig, reporterOptions);

    this.defaultReporter = new DefaultReporter(globalConfig);
    this.summaryReporter = new SummaryReporter(globalConfig);
  }

  async onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResult: AggregatedResult
  ): Promise<void> {
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
          `To open in Root Cause viewer, run: ${chalk.underline(
            `npx root-cause show ${rootCauseTestId}`
          )}`
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

    if (formattedErrorMessage !== null) {
      testResult.failureMessage = formattedErrorMessage;
    }

    this.defaultReporter.onTestResult(test, testResult, aggregatedResult);
    this.summaryReporter.onTestResult(test, testResult, aggregatedResult);
  }

  // onTestFileResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {
  // }

  onTestCaseResult(test: Test, testCaseResult: any): void {
    this.summaryReporter.onTestCaseResult(test, testCaseResult);
    this.defaultReporter.onTestCaseResult(test, testCaseResult);
  }

  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions): void {
    this.defaultReporter.onRunStart(results, options);
    this.summaryReporter.onRunStart(results, options);
  }

  onTestStart(test: Test): void {
    this.defaultReporter.onTestStart(test);
    this.summaryReporter.onTestStart(test);
  }

  async onRunComplete(contexts: Set<Context>, results: AggregatedResult): Promise<void> {
    await super.onRunComplete(contexts, results);
    this.defaultReporter.onRunComplete();
    this.summaryReporter.onRunComplete(contexts, results);
  }

  getLastError(): Error | undefined {
    const errorFromDefaultReporter = this.defaultReporter.getLastError();
    if (errorFromDefaultReporter) {
      return errorFromDefaultReporter;
    }

    return this.summaryReporter.getLastError();
  }
}

// The jest setup in projects like https://github.com/Microsoft/fluentui
// wasn't able to load the reporter with esm export default, but only using this
// Not Sure why
module.exports = EnhancedDefault;
