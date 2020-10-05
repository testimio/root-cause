import {
  getCleanAllPathsPrettyFormatPlugin,
  getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin,
} from '@testim/internal-self-tests-helpers';
// eslint-disable-next-line import/no-extraneous-dependencies
import { getJasmineCurrentTest, registerJasmineReporterToGlobal } from '@testim/root-cause-jest';
import type { TestResultFile } from '@testim/root-cause-types';
import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';
import playwright from 'playwright';
import { attach } from './index';
import { PossibleUserSettings } from './userSettings/interfaces';
import { resolveSettings } from './userSettings/userSettings';
import {
  assertNotNullOrUndefined,
  jsonReduceNoiseReviver,
  testUniqueIdentifierFromStartParams,
} from './utils';

describe('Sanity integration test playwright', () => {
  jest.setTimeout(30_000);
  expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));
  expect.addSnapshotSerializer(getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin());

  let browser: playwright.Browser;
  let browserContext: playwright.BrowserContext;
  let page: playwright.Page;

  beforeAll(async () => {
    registerJasmineReporterToGlobal();

    // https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
    // Not optimal, but didn't work on circle on circleci/node:12.17-stretch-browsers without it
    // Need to revisit
    browser = await playwright.chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    browserContext = await browser.newContext();
    page = await browserContext.newPage();
  });

  afterEach(async () => {
    await page.close();
    await browserContext.close();
  });

  it('Sanity integration test 1', async () => {
    const currentTestInfo = getJasmineCurrentTest();

    const startTestParams = {
      runId: 'mock_invocation_id-playwright',
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

    const overriddenFeatures: PossibleUserSettings = {
      features: {
        html: true,
      },
    };

    const { page: playedPage, endTest } = await attach(
      {
        page,
        startTestParams,
        activeFeatures: resolveSettings(overriddenFeatures).features,
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

    const expectedResults = path.resolve(
      __dirname,
      'testsResults',
      '.root-cause',
      'runs',
      startTestParams.runId,
      testUniqueIdentifierFromStartParams(startTestParams)
    );

    const testResults: TestResultFile = JSON.parse(
      await fs.readFile(path.resolve(expectedResults, 'results.json'), 'utf-8'),
      jsonReduceNoiseReviver
    );

    expect(testResults).toMatchSnapshot();

    for (const stepResult of testResults.steps) {
      // Do also images blob comparison? TBH
      if (stepResult.screenshot) {
        assert.equal(
          await fs.pathExists(path.resolve(expectedResults, stepResult.screenshot)),
          true,
          `${stepResult.screenshot} is missing`
        );
      }
    }
  });
});
