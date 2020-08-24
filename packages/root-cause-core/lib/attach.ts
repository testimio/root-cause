/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import debug from 'debug';
import {
    logsBeforeAllHook,
    logsAfterAllHook,
    logsBeforeEachHook,
    logsAfterEachHook,
} from './consoleLogsCollection';
import { testResultDirFromStartParams } from './utils';
import { errorInStepHook, testSystemInfoHook, testEndHook } from './assortedHooks';
import { puppeteerScreenshot } from './hooks/screenshotCollection';
import { puppeteerMetadata } from './hooks/step-metadata-collection';
import { TestContext } from './TestContext';
import { PuppeteerPageHooker } from './PuppeteerPageHooker';
import {
    AttachParams,
    AttachReturn,
    TestEndStatus,
    AssertionReport,
    ActiveFeatures,
} from './attachInterfaces';
import { FALLBACK_RUN_ID, IS_NODE_10 } from './consts';
import { stacktraceHook } from './stacktraceHook';
import { RootCausePage } from './interfaces';
import { persist } from './persist';
import { networkLogsBeforeAllHook, networkLogsAfterAllHook } from './networkLogs';

const loggerDebug = debug('root-cause:debug');
// swap with this if you need clear log location for dev time and so
// const loggerError = console.error;

function getDefaultActiveFeatures(): ActiveFeatures {
    return {
        screenshots: {
            format: 'jpeg',
            quality: 85,
            fullPage: false,
        },
        console: true,
        networkLogs: true,
        jestAssertions: false,
    };
}

// Attach takes a framework'ish page and needs to return a page of the same type (TPage)
export async function attach<TPage extends RootCausePage>(
    { page, startTestParams, activeFeatures }: AttachParams<TPage>,
    dateConstructor: typeof Date = Date
): Promise<AttachReturn<TPage>> {
    const resolvedActiveFeatures = activeFeatures || getDefaultActiveFeatures();

    // We may make this a bit smarter by trying to sniff call stack
    // Any how it's not very real usecase, but mostly for backward compat
    const defaultTestName = dateConstructor.now().toString();
    const defaultStartTestParams = {
        runId: FALLBACK_RUN_ID,
        fullName: `fullName ${defaultTestName}`,
        description: defaultTestName,
        fullSuitePath: 'pseudo fullSuitePath',
        projectRoot: process.cwd(),
    };

    const resolvedStartTestParams = Object.assign(defaultStartTestParams, startTestParams ?? {});

    const resultsDirFullPath = testResultDirFromStartParams(resolvedStartTestParams);

    await fs.mkdirp(resultsDirFullPath);

    const context = new TestContext(
        resultsDirFullPath,
        resolvedStartTestParams.description,
        resolvedStartTestParams.fullName,
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
    instrumentor.registerAfterHook(puppeteerMetadata);
    instrumentor.registerBeforeHook(async (testContext, fnName, proxyContext) => {
        loggerDebug(`>>${proxyContext.constructor.name}>>${fnName}`);
    });

    if (resolvedActiveFeatures?.screenshots) {
        instrumentor.registerBeforeHook(puppeteerScreenshot);
    }

    if (resolvedActiveFeatures.networkLogs) {
        instrumentor.registerAfterAllHook(networkLogsAfterAllHook);
    }

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
