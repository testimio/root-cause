// The following dependencies are jest dependencies
// And as this is a jest reporter it's save to assume they will be available
// One possible issue, is that on different jest versions, we will have a bit different api
// The api for jest 24-27 is expected to stay similar enough to work.
// Ideally we would have several sub packages for screenplay.
// See https://github.com/testimio/screenplay/issues/5 for more context

// eslint-disable-next-line import/no-extraneous-dependencies
import { DefaultReporter, SummaryReporter } from '@jest/reporters';
// eslint-disable-next-line import/no-extraneous-dependencies
import { formatResultsErrors } from 'jest-message-util';
// eslint-disable-next-line import/no-extraneous-dependencies
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
 * And the screenplay run conclusion
 *
 * We use it to inject our message of 'To open in Screenplay viewer, run: screenplay show ID'
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
            If the jest test has screenplay result associated with it,
            We inject our message into the first failureMessages,
            And them we re-run formatResultsErrors and overwriting the failureMessage of the test file.

            The original value for testResult.failureMessage is from the runner-reporter side, see:
            https://github.com/facebook/jest/blob/v26.1.0/packages/jest-jasmine2/src/reporter.ts#L87-L93
            We are using the same `formatResultsErrors` function
        */

        const screenplayRunResultsPath = utils.constructTestInvocationResultDir(this.rootDir, this.runId);

        const screenplayResults = await runConclusionUtils.readRunResultsDirToMap(screenplayRunResultsPath);

        testResult.testResults = testResult.testResults.map((r) => {
            const screenplayTestId = utils.testUniqueIdentifierFromStartParams({ projectRoot: this.rootDir, fullSuitePath: testResult.testFilePath, fullName: r.fullName });

            if (screenplayResults.has(screenplayTestId) && r.failureMessages[0]) {
                r.failureMessages[0] = `${chalk.blue(`To open in Screenplay viewer, run: ${chalk.underline(`npx screenplay show ${screenplayTestId}`)}`)}\n ${r.failureMessages[0]}'`;
            }

            return r;
        });

        const formattedErrorMessage = formatResultsErrors(testResult.testResults, {
            rootDir: this.globalConfig.rootDir,
            testMatch: [],
        }, {
            noStackTrace: false,
        }, test.path);

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
        const screenplayPath = utils.constructScreenplayResultDir(this.rootDir);
        const screenplayRunResultsPath = utils.constructTestInvocationResultDir(this.rootDir, this.runId);
        if (!await fs.pathExists(screenplayRunResultsPath)) {
            return;
        }
        // it's very possible that there won't be complete intersection between screenplay & jest results
        // not all jest tests might have screenplay attached, and maybe there are screenplay results in run dir from prev run

        const screenplayResults = await runConclusionUtils.readRunResultsDirToMap(screenplayRunResultsPath);
        const jestSide = jestResultsToIdMap(results.testResults, this.rootDir);
        const finalResults = runConclusionUtils.intersectRunnerAndScreenplay(screenplayResults, jestSide);

        await runConclusionUtils.concludeRun(this.runId, screenplayPath, results.startTime, finalResults);

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
