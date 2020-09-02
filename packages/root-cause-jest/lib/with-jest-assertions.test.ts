/* eslint-disable import/no-extraneous-dependencies */
import { attach, utils, updateHistoryFromRootCauseResultsOnly } from '@testim/root-cause-core';
import { getCleanAllPathsPrettyFormatPlugin, getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin } from '@testim/internal-self-tests-helpers';
import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { registerJasmineReporterToGlobal, makeHookExpect } from './helpers';
import { getJasmineCurrentTest } from './expectedToBeCalledFromInsideJasmineJestTest';
import { TestResultFile } from '@testim/root-cause-types';

const { testUniqueIdentifierFromStartParams, jsonReduceNoiseReviver } = utils;

describe('Sanity integration test', () => {
    jest.setTimeout(30_000);
    expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));
    expect.addSnapshotSerializer(getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin());

    let browser: puppeteer.Browser;
    let browserContext: puppeteer.BrowserContext;
    let page: puppeteer.Page;

    beforeAll(async () => {
        registerJasmineReporterToGlobal();

        // https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
        // Not optimal, but didn't work on circle on circleci/node:12.17-stretch-browsers without it
        // Need to revisit
        browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        browserContext = await browser.createIncognitoBrowserContext();
        page = await browserContext.newPage();
    });

    afterEach(async () => {
        await page.close();
        await browserContext.close();
    });

    test('with jest assertions', async () => {
        const currentTest = getJasmineCurrentTest();

        const localRunId = new Date().toString();

        const startTestParams = {
            runId: localRunId,
            projectRoot: process.cwd(),
            fullName: currentTest.fullName,
            description: currentTest.description,
            fullSuitePath: currentTest.testPath,
        };

        const mockedDateConstructor: typeof Date = Object.create(Date);

        let nowCallsCounter = 1;
        mockedDateConstructor.now = function mockedNow() {
            return nowCallsCounter++;
        };

        const attachController = await attach({
            page,
            startTestParams,

        }, mockedDateConstructor);

        const {
            page: playedPage, endTest,
        } = attachController;

        const unhookExpect = makeHookExpect(attachController);

        await playedPage.goto('http://jsbin.testim.io/ner/1');
        await playedPage.click('#test');

        await playedPage.click('#test');
        await playedPage.click('#test');

        await playedPage.click('#test');
        const counterEl = await playedPage.$('#counter');

        expect(counterEl).not.toBe(null);

        utils.assertNotNullOrUndefined(counterEl);

        const text = await (await counterEl.getProperty('innerText')).jsonValue();

        expect(text).toBe('4');

        await playedPage.click('#reset');

        const text2 = await (await counterEl.getProperty('innerText')).jsonValue();

        expect(text2).toBe('0');

        const allButtons = await playedPage.$$('button');

        await allButtons[0].click();

        const text3 = await (await counterEl.getProperty('innerText')).jsonValue();

        expect(text3).toBe('1');

        expect(allButtons).toHaveLength(2);

        await endTest({
            success: false,
            error: { message: 'mocked error test failed' },
        });

        updateHistoryFromRootCauseResultsOnly(localRunId);

        unhookExpect();

        const expectedResultsPath = path.resolve(process.cwd(), '.root-cause', 'runs', localRunId, testUniqueIdentifierFromStartParams(startTestParams));
        const testResults: TestResultFile = JSON.parse(await fs.readFile(path.resolve(expectedResultsPath, 'results.json'), 'utf-8'), jsonReduceNoiseReviver);

        expect(testResults).toMatchSnapshot();

        for (const stepResult of testResults.steps) {
            // Do also images blob comparison? TBH
            if (stepResult.screenshot) {
                // eslint-disable-next-line no-await-in-loop
                expect(fs.pathExists(path.resolve(expectedResultsPath, stepResult.screenshot))).resolves.toBe(true);
            }
        }
    });
});
