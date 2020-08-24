/**
 * This file should be loaded using mocha --require @testim/root-cause-mocha/rootHooks
 */

import type { RootHookObject, Test } from 'mocha';
import type { AttachReturn, StartTestParams } from '@testim/root-cause-core';
import { attach, loadSettings, utils } from '@testim/root-cause-core';
import * as uuid from 'uuid';
import { MOCHA_INTERMEDIATE_DIR } from './consts';
import type { RootCauseTestAddonData } from './interfaces';

const LAUNCH_PUPPETEER_OURSELF = 'LAUNCH_PUPPETEER' in process.env;

// We don't want to depend on specific puppeteer/playwright types here
declare let page: unknown;
declare let browser: unknown;
declare let attachController: AttachReturn<any> | undefined;

// For self-dev only
async function beforeAllLaunchPuppeteer() {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const pptr: typeof import('puppeteer') = require('puppeteer');
    // @ts-ignore
    global.browser = await pptr.launch();
}

async function beforeEachLaunchPuppeteer() {
    // @ts-ignore
    global.page = await browser.newPage();
}

async function afterEachLaunchPuppeteer() {
    if (page) {
        // @ts-ignore
        await page.close();
    }
}

async function afterAllLaunchPuppeteer() {
    if (browser) {
        // @ts-ignore
        await browser.close();
    }
}
// -----

async function rootCauseAttachBeforeEach() {
    // @ts-ignore
    const test: Test = this.currentTest;

    if (
        typeof page === 'undefined'
    ) {
        throw new Error('Invariant: browser page must be available globally');
    }

    if (typeof test.file === 'undefined') {
        throw new Error('Invariant: test.file must be available');
    }

    const testIntermediateResultsDirName = uuid.v4();
    const runId = `${MOCHA_INTERMEDIATE_DIR}_${testIntermediateResultsDirName}`;
    const RunIntermediateResultsDir = utils.constructTestInvocationResultDir(process.cwd(), runId);

    const startTestParams: StartTestParams = {
        runId,
        projectRoot: process.cwd(),
        fullName: test.fullTitle(),
        description: test.title,
        fullSuitePath: test.file,
    };
    const testIntermediateResultDir = utils.testResultDirFromStartParams(startTestParams);

    const rootCauseData: RootCauseTestAddonData = {
        startTestParams,
        testIntermediateResultDir,
        runIntermediateResultsDir: RunIntermediateResultsDir,
    };

    // @ts-expect-error
    test.rootCauseData = rootCauseData;

    const settings = await loadSettings();

    // @ts-ignore
    global.attachController = await attach<any>({ page, startTestParams, activeFeatures: settings.features });
    // @ts-ignore
    global.origPage = page;
    // @ts-ignore
    global.page = global.attachController.page;

    /**
     * This trick allows us to pass custom data from test run to the reporter
     */
    // @ts-expect-error
    const origTestSerialize = test.serialize;
    // @ts-expect-error
    test.serialize = function rootCauseTestSerialize() {
        const origSerializedTest = origTestSerialize.apply(test);
        // @ts-ignore
        origSerializedTest.rootCauseData = this.rootCauseData;

        return origSerializedTest;
    };
}

async function rootCauseAttachAfterEach() {
    // @ts-ignore
    const test: Test = this.currentTest;

    if (typeof attachController !== 'undefined') {
        // @ts-ignore
        global.page = global.origPage;
        if (test.state === 'passed') {
            await attachController.endTest({
                success: true,
            });
        } else {
            await attachController.endTest({
                success: false,
                error: test.err,
            });
        }
    }
}

const mochaHooks: RootHookObject = {
    beforeAll: LAUNCH_PUPPETEER_OURSELF ? beforeAllLaunchPuppeteer : undefined,
    beforeEach: LAUNCH_PUPPETEER_OURSELF ? [beforeEachLaunchPuppeteer, rootCauseAttachBeforeEach] : rootCauseAttachBeforeEach,
    afterEach: LAUNCH_PUPPETEER_OURSELF ? [afterEachLaunchPuppeteer, rootCauseAttachAfterEach] : rootCauseAttachAfterEach,
    afterAll: LAUNCH_PUPPETEER_OURSELF ? afterAllLaunchPuppeteer : undefined,
};

export { mochaHooks };
