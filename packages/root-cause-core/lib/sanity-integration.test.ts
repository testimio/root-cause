import { attach } from './index';
import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import assert from 'assert';
import {
  assertNotNullOrUndefined,
  testUniqueIdentifierFromStartParams,
  jsonReduceNoiseReviver,
} from './utils';
import {
  getCleanAllPathsPrettyFormatPlugin,
  getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin,
} from '@testim/internal-self-tests-helpers';
// eslint-disable-next-line import/no-extraneous-dependencies
import { registerJasmineReporterToGlobal, getJasmineCurrentTest } from '@testim/root-cause-jest';
import type { TestResultFile } from '@testim/root-cause-types';

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

  it('Sanity integration test 1', async () => {
    const currentTestInfo = getJasmineCurrentTest();

    const startTestParams = {
      runId: 'mock_invocation_id',
      projectRoot: path.resolve(__dirname, 'testsResults'),
      fullName: currentTestInfo.fullName,
      description: currentTestInfo.description,
      fullSuitePath: __filename,
    };

    const mockedDateConstructor: typeof Date = Object.create(Date);

    let nowCallsCounter = 1;
    mockedDateConstructor.now = function mockedNow() {
      return nowCallsCounter++;
    };

    const { page: playedPage, endTest } = await attach(
      {
        page,
        startTestParams,
      },
      mockedDateConstructor
    );

    await playedPage.goto('http://jsbin.testim.io/ner/1');
    await playedPage.click('#test');
    // to await - might be flaky
    page.evaluate(() => {
      setTimeout(() => {
        throw new Error('injected error');
      }, 0);
    });
    await playedPage.click('#test');
    await playedPage.click('#test');
    // to await - might be flaky
    page.evaluate(() => {
      setTimeout(() => {
        /* eslint-disable-next-line no-console */
        console.warn('injected console');
      }, 0);
    });
    await playedPage.click('#test');
    const counterEl = await playedPage.$('#counter');

    assert.notEqual(counterEl, null);
    assertNotNullOrUndefined(counterEl);

    const text = await (await counterEl.getProperty('innerText')).jsonValue();

    assert.equal(text, '4');

    await playedPage.click('#reset');

    const text2 = await (await counterEl.getProperty('innerText')).jsonValue();

    assert.equal(text2, '0');

    const allButtons = await playedPage.$$('button');

    await allButtons[0].click();

    const text3 = await (await counterEl.getProperty('innerText')).jsonValue();

    assert.equal(text3, '1');

    assert.equal(allButtons.length, 2);

    await endTest({
      success: false,
      error: { message: 'mocked error test failed' },
    });

    const expectedResultsPath = path.resolve(
      __dirname,
      'testsResults',
      '.root-cause',
      'runs',
      'mock_invocation_id',
      testUniqueIdentifierFromStartParams(startTestParams)
    );
    const testResults: TestResultFile = JSON.parse(
      await fs.readFile(path.resolve(expectedResultsPath, 'results.json'), 'utf-8'),
      jsonReduceNoiseReviver
    );

    expect(testResults).toMatchSnapshot();

    for (const stepResult of testResults.steps) {
      // Do also images blob comparison? TBH
      if (stepResult.screenshot) {
        // eslint-disable-next-line no-await-in-loop
        assert.equal(
          await fs.pathExists(path.resolve(expectedResultsPath, stepResult.screenshot)),
          true,
          `${stepResult.screenshot} is missing`
        );
      }
    }
  });
});
