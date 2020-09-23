// https://github.com/mochajs/mocha/pull/1360#issuecomment-407404831

import fs from 'fs-extra';
import { utils, runConclusionUtils, runConclusionInterfaces, persist, utilGuid } from '@testim/root-cause-core';
import type { Runner, MochaOptions, Test, Stats } from 'mocha';
import Mocha, { reporters } from 'mocha';
import type { RootCauseTestAddonData } from './interfaces';
import debug from 'debug';
import { RunnerResultEntry } from '@testim/root-cause-types';

const debugLogger = debug('testim-root-cause:mocha');

export default class RootCauseMochaReporter implements reporters.Base {
  private runId = utilGuid();
  private runTestResultsDir = utils.constructTestInvocationResultDir(process.cwd(), this.runId);
  private testsResultsMovesCompleted: Array<Promise<void>> = [];
  private rootDir = process.cwd();
  private actualReporter: reporters.Base;

  private testsWithRootCauseResults: Array<{
    mochaTest: Test;
    addonData: RootCauseTestAddonData;
  }> = [];

  private runTestResultsDirCreatePromise = fs.mkdirp(this.runTestResultsDir);

  constructor(public runner: Runner, options: MochaOptions) {
    let ReporterClassToUse: typeof reporters.Base = reporters.Spec;

    const thisForMochaReporterFind: { _reporter?: typeof reporters.Base; options: {} } = { options: {} };

    // we do that to use the internal behavior of mocha to load the inner reporter
    // https://github.com/mochajs/mocha/blob/v8.1.1/lib/mocha.js#L265-L316
    Mocha.prototype.reporter.call(
      thisForMochaReporterFind,
      options.reporterOptions?.actualReporter ?? '',
      options.reporterOptions
    );

    utils.assertNotNullOrUndefined(thisForMochaReporterFind._reporter);

    ReporterClassToUse = thisForMochaReporterFind._reporter;

    this.actualReporter = new ReporterClassToUse(runner, options);

    runner.on('test end', async (test) => {
      // @ts-ignore
      const rootCauseData: RootCauseTestAddonData | undefined = test.rootCauseData;

      if (!rootCauseData) {
        return;
      }

      this.testsWithRootCauseResults.push({
        mochaTest: test,
        addonData: rootCauseData,
      });

      utils.assertNotNullOrUndefined(test.file);

      const finalTestResultPath = utils.testResultDirFromStartParams({
        description: test.title,
        projectRoot: this.rootDir,
        fullName: test.fullTitle(),
        fullSuitePath: test.file,
        runId: this.runId,
      });

      this.testsResultsMovesCompleted.push(
        (async () => {
          await this.runTestResultsDirCreatePromise;

          try {
            // todo: consider adding explicit copy queue to make operations, so we will have controlled concurrency
            await fs.move(rootCauseData.testIntermediateResultDir, finalTestResultPath, {});

            await fs.remove(rootCauseData.runIntermediateResultsDir);
          } catch (moveError) {
            // unexpected
            // we don't have good recovery from this error
            // debug log it, and ignore
            debugLogger('Error moving test result to final path', rootCauseData.startTestParams, moveError);
          }
        })()
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const reporterInstance = this;

    runner.on('end', async function () {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const runner: Runner = this;

      debugLogger(`runner end. tests so far: ${reporterInstance.testsWithRootCauseResults.length}`);

      debugLogger(
        `Reporter end event, waiting for tests results to be copied (${reporterInstance.testsResultsMovesCompleted.length})`
      );

      await Promise.all(reporterInstance.testsResultsMovesCompleted);
      debugLogger(`Results copied (${reporterInstance.testsResultsMovesCompleted.length})`);

      const rootCauseRunResults = await runConclusionUtils.readRunResultsDirToMap(reporterInstance.runTestResultsDir);

      const inputForPrepareRunConclusion = new Map(
        reporterInstance.testsWithRootCauseResults
          .map((test): {
            runner: RunnerResultEntry;
            rootCause: runConclusionInterfaces.RootCauseRunResultEntry;
          } | null => {
            utils.assertNotNullOrUndefined(test.mochaTest.file);
            utils.assertNotNullOrUndefined(test.mochaTest.state);
            const id = utils.testUniqueIdentifierFromStartParams(test.addonData.startTestParams);
            const rootCause = rootCauseRunResults.get(id);

            if (!rootCause) {
              debugLogger('test result dropped, this is a possible bug', { id });
              return null;
            }

            return {
              runner: {
                id: utils.testUniqueIdentifierFromStartParams(test.addonData.startTestParams),
                suiteFilePath: test.mochaTest.file,
                testResult: {
                  status: test.mochaTest.state,
                  title: test.addonData.startTestParams.description,
                  fullName: test.addonData.startTestParams.fullName,
                },
              },
              rootCause,
            };
          })
          .filter(utils.nonNullable)
          .map((e) => [e.runner.id, e])
      );

      const rootCausePath = utils.constructResultDir(reporterInstance.rootDir);

      const startTime = runner.stats?.start;
      utils.assertNotNullOrUndefined(startTime);

      await runConclusionUtils.concludeRun(
        reporterInstance.runId,
        rootCausePath,
        startTime.getTime(),
        inputForPrepareRunConclusion
      );

      if (process.env.TESTIM_PERSIST_RESULTS_TO_CLOUD) {
        await persist(reporterInstance.runId, {
          projectRoot: reporterInstance.rootDir,
          resultLabel: (global as any).resultLabels ?? null,
        });
      }
    });
  }

  public get stats(): Stats {
    return this.actualReporter.stats;
  }

  public get failures(): Test[] {
    return this.actualReporter.failures;
  }

  epilogue(): void {
    return this.actualReporter.epilogue();
  }

  public done(failures: number, fn?: ((failures: number) => void) | undefined) {
    if (this.actualReporter.done) {
      return this.actualReporter.done(failures, fn);
    }
  }
}

module.exports = RootCauseMochaReporter;
