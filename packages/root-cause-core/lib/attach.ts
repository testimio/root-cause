/* eslint-disable no-await-in-loop */
import debug from 'debug';
import fs from 'fs-extra';
import {
  ActiveFeatures,
  AssertionReport,
  AttachParams,
  AttachReturn,
  TestEndStatus,
} from './attachInterfaces';
import { FALLBACK_RUN_ID, IS_NODE_10 } from './consts';
import {
  logsAfterAllHook,
  logsAfterEachHook,
  logsBeforeAllHook,
  logsBeforeEachHook,
} from './hooks/consoleLogsCollectionHooks';
import { errorInStepHook } from './hooks/errorInStepHook';
import { createHtmlCollectionHook } from './hooks/htmlCollection';
import { networkLogsAfterAllHook, networkLogsBeforeAllHook } from './hooks/networkLogsHooks';
import { instrumentProfilingHooks } from './hooks/profilingHooks';
import { puppeteerScreenshot } from './hooks/screenshotCollectionHook';
import { stacktraceHook } from './hooks/stacktraceHook';
import { stepMetadataCollectionHook } from './hooks/stepMetadataCollectionHook';
import { testEndHook } from './hooks/testEndHook';
import { testSystemInfoHook } from './hooks/testSystemInfoHook';
import { RootCausePage } from './interfaces';
import { persist } from './persist';
import { PuppeteerPageHooker } from './PuppeteerPageHooker';
import { TestContext } from './TestContext';
import { resolveSettings } from './userSettings/userSettings';
import { getSelfCallSiteFromStacktrace, testResultDirFromStartParams } from './utils';

const loggerDebug = debug('root-cause:debug');
// swap with this if you need clear log location for dev time and so
// const loggerError = console.error;

function getDefaultActiveFeatures(): ActiveFeatures {
  return resolveSettings({ features: {} }).features;
}

// Attach takes a framework'ish page and needs to return a page of the same type (TPage)
export async function attach<TPage extends RootCausePage>(
  { page, startTestParams, activeFeatures }: AttachParams<TPage>,
  dateConstructor: typeof Date = Date
): Promise<AttachReturn<TPage>> {
  const resolvedActiveFeatures = activeFeatures || getDefaultActiveFeatures();

  const callSite = getSelfCallSiteFromStacktrace();

  const defaultTestName = dateConstructor.now().toString();
  const defaultStartTestParams = {
    runId: FALLBACK_RUN_ID,
    fullName: `fullName ${defaultTestName}`,
    description: defaultTestName,
    fullSuitePath: callSite?.getFileName() || 'pseudo fullSuitePath',
    projectRoot: process.cwd(),
  };

  const resolvedStartTestParams = Object.assign(defaultStartTestParams, startTestParams ?? {});

  const resultsDirFullPath = testResultDirFromStartParams(resolvedStartTestParams);

  await fs.mkdirp(resultsDirFullPath);

  const context = new TestContext(
    resultsDirFullPath,
    resolvedStartTestParams.description,
    resolvedStartTestParams.fullName,
    resolvedStartTestParams.fullSuitePath,
    resolvedActiveFeatures,
    dateConstructor
  );

  const instrumentor = new PuppeteerPageHooker(context, page);

  const hookedPage = instrumentor.wrapWithProxy(page);

  instrumentor.registerBeforeAllHook(testSystemInfoHook);
  if (resolvedActiveFeatures.console) {
    instrumentor.registerBeforeAllHook(logsBeforeAllHook);
    instrumentor.registerAfterAllHook(logsAfterAllHook);
    instrumentor.registerBeforeHook(logsBeforeEachHook);
    instrumentor.registerAfterHook(logsAfterEachHook);
  }
  if (resolvedActiveFeatures.networkLogs) {
    instrumentor.registerBeforeAllHook(networkLogsBeforeAllHook);
  }

  if (!IS_NODE_10) {
    instrumentor.registerBeforeHook(stacktraceHook);
  }

  instrumentor.registerAfterHook(errorInStepHook);
  instrumentor.registerAfterHook(stepMetadataCollectionHook);
  instrumentor.registerBeforeHook(async ({ proxyContext, fnName }) => {
    loggerDebug(`>>${proxyContext.constructor.name}>>${fnName}`);
  });

  if (resolvedActiveFeatures?.screenshots) {
    instrumentor.registerBeforeHook(puppeteerScreenshot);
  }

  if (resolvedActiveFeatures?.html) {
    instrumentor.registerBeforeHook(await createHtmlCollectionHook(page));
  }

  if (resolvedActiveFeatures.networkLogs) {
    instrumentor.registerAfterAllHook(networkLogsAfterAllHook);
  }

  await instrumentProfilingHooks(instrumentor, page);

  instrumentor.registerAfterAllHook(testEndHook);

  // Maybe expose explicit start? TBD
  await instrumentor.start();

  async function endTest(endStatus: TestEndStatus<unknown, unknown>) {
    await instrumentor.end(endStatus);
  }

  function pauseStepsRecording() {
    instrumentor.pause();
  }

  function resumeStepsRecording() {
    instrumentor.resume();
  }

  function reportAssertion(assertion: AssertionReport) {
    context.addAssertionStep({
      ...assertion,
    });
  }

  return {
    page: hookedPage,
    endTest,
    persist: (resultLabels: string[]) =>
      persist(resolvedStartTestParams?.runId, {
        projectRoot: resolvedStartTestParams?.projectRoot,
        resultLabel: resultLabels,
      }),
    pauseStepsRecording,
    resumeStepsRecording,
    reportAssertion,
  };
}
