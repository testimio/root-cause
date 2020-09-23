import { attach } from './index';
import type { TestResultFile } from '@testim/root-cause-types';
import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { testUniqueIdentifierFromStartParams, jsonReduceNoiseReviver } from './utils';
import {
  getCleanAllPathsPrettyFormatPlugin,
  getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin,
  interestingPartsOfHar,
  getPostmanEchoWorkaround1PrettyFormatPlugin,
  getPostmanEchoWorkaround2PrettyFormatPlugin,
} from '@testim/internal-self-tests-helpers';
import { guid } from './testim-services-api/guid';
import { updateHistoryFromRootCauseResultsOnly } from './updateHistoryFromRootCauseResultsOnly';
// eslint-disable-next-line import/no-extraneous-dependencies
import { registerJasmineReporterToGlobal, getJasmineCurrentTest } from '@testim/root-cause-jest';

describe('with har record', () => {
  jest.setTimeout(30_000);
  expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));
  expect.addSnapshotSerializer(getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin());
  expect.addSnapshotSerializer(getPostmanEchoWorkaround1PrettyFormatPlugin());
  expect.addSnapshotSerializer(getPostmanEchoWorkaround2PrettyFormatPlugin());

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

  test('with har record', async () => {
    const currentTest = getJasmineCurrentTest();

    const localRunId = guid();

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

    const attachController = await attach(
      {
        page,
        startTestParams,
        activeFeatures: {
          screenshots: {
            format: 'jpeg',
            quality: 85,
            fullPage: false,
          },
          console: true,
          networkLogs: true,
          jestAssertions: false,
        },
      },
      mockedDateConstructor
    );

    const { page: playedPage, endTest } = attachController;
    // The delay + mousedown handler inside jsbin is to make sure the requests will stay under specific test
    // Still, it might be flaky
    await playedPage.goto('http://jsbin.testim.io/ces');
    await playedPage.click('[data-job=GET_OK]', { delay: 800 });
    await playedPage.click('[data-job=GET_404]', { delay: 800 });
    await playedPage.click('[data-job=POST_OK]', { delay: 800 });
    await playedPage.click('[data-job=POST_404]', { delay: 800 });

    await endTest({
      success: true,
    });

    updateHistoryFromRootCauseResultsOnly(localRunId);

    const expectedResultsPath = path.resolve(
      process.cwd(),
      '.root-cause',
      'runs',
      localRunId,
      testUniqueIdentifierFromStartParams(startTestParams)
    );
    const testResults: TestResultFile = JSON.parse(
      await fs.readFile(path.resolve(expectedResultsPath, 'results.json'), 'utf-8'),
      jsonReduceNoiseReviver
    );

    expect(testResults).toMatchSnapshot('Test results.json');

    for (const stepResult of testResults.steps) {
      // Do also images blob comparison? TBH
      if (stepResult.screenshot) {
        // eslint-disable-next-line no-await-in-loop
        expect(fs.pathExists(path.resolve(expectedResultsPath, stepResult.screenshot))).resolves.toBe(true);
      }
    }

    const harFileContent = JSON.parse(await fs.readFile(path.resolve(expectedResultsPath, 'networkLogs.har'), 'utf8'));
    expect(interestingPartsOfHar(harFileContent)).toMatchSnapshot('har file content');
  });
});
