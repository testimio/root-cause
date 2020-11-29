import {
  getCleanAllPathsPrettyFormatPlugin,
  getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin,
} from '@testim/internal-self-tests-helpers';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ensurePrerequisite, getCurrentTest } from '@testim/root-cause-jest';
import type { TestResultFile } from '@testim/root-cause-types';
import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';
import { attach } from './index';
import { PossibleUserSettings } from './userSettings/interfaces';
import { resolveSettings } from './userSettings/userSettings';
import { jsonReduceNoiseReviver, testUniqueIdentifierFromStartParams } from './utils';

describe('Sanity integration test', () => {
  jest.setTimeout(30_000);
  expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));
  expect.addSnapshotSerializer(getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin());

  let browser: puppeteer.Browser;
  let browserContext: puppeteer.BrowserContext;
  let page: puppeteer.Page;

  beforeAll(async () => {
    ensurePrerequisite();

    // https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
    // Not optimal, but didn't work on circle on circleci/node:12.17-stretch-browsers without it
    // Need to revisit
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      devtools: false,
    });
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

  it(__filename, async () => {
    const currentTestInfo = getCurrentTest();

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
    await playedPage.setContent(
      '<h1>PAGE 1</h1><a href="about:blank" target="blank">CLICK HERE</a>'
    );
    const [newPageOpenedViaLink] = await Promise.all([
      new Promise<puppeteer.Page>((res) => {
        playedPage.once('popup', res);
      }),
      page.click('a'),
    ]);
    await newPageOpenedViaLink.setContent('<h1>PAGE 2</h1>');
    await newPageOpenedViaLink.click('body');
    await playedPage.click('body');

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
        assert.equal(
          await fs.pathExists(path.resolve(expectedResultsPath, stepResult.screenshot)),
          true,
          `${stepResult.screenshot} is missing`
        );
      }
    }
  });
});
