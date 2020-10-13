import fs from 'fs-extra';
import path from 'path';
import assert from 'assert';
import { readJsonTestSnapshotFile } from './utils';
import ms from 'ms';
import { launchImpl } from './launch';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ensurePrerequisite, getCurrentTest } from '@testim/root-cause-jest';
import { guid } from './testim-services-api/guid';
import {
  getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin,
  getCleanAllPathsPrettyFormatPlugin,
} from '@testim/internal-self-tests-helpers';
import type { TestResultFile } from '@testim/root-cause-types';

describe('Launch api test', () => {
  expect.addSnapshotSerializer(getCleanAllPathsPrettyFormatPlugin(process.cwd()));
  expect.addSnapshotSerializer(getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin());
  jest.setTimeout(ms('10 seconds'));

  beforeAll(() => {
    ensurePrerequisite();
  });

  it('Launch api test passing', async () => {
    const testInfo = getCurrentTest();

    const mockedDateConstructor: typeof Date = Object.create(Date);

    let nowCallsCounter = 1;
    mockedDateConstructor.now = function mockedNow() {
      return nowCallsCounter++;
    };

    const localRunId = guid();

    await launchImpl(
      {
        testName: testInfo.fullName,
        noServer: true,
        automationLibrary: 'puppeteer',
        browserOptions: {
          headless: true,
          browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        _runId: localRunId,
      },
      async (page) => {
        await page.goto('http://jsbin.testim.io/ner/1');

        await page.click('#test');
        await page.click('#test');
        await page.click('#test');
        await page.click('#test');
        await page.click('#test');
        await page.click('#test');
        await page.click('#reset');
        await page.click('#test');

        const counter = await page.$('#counter');

        if (!counter) {
          throw new Error('counter not found');
        }

        const textProp = await counter.getProperty('innerText');
        const text = await textProp.jsonValue();

        assert.equal(text, '1');
      },
      mockedDateConstructor
    );

    const runResultsDir = path.resolve(__dirname, '..', '.root-cause', 'runs', localRunId);

    const allResultsInDir = (await fs.readdir(runResultsDir)).sort();

    // const testResultsFixture: TestResultFile = await readJsonTestSnapshotFile(path.resolve(__dirname, 'fixtures', 'launch-api-test-passing', 'results.json'));
    const testResults: TestResultFile = await readJsonTestSnapshotFile(
      path.resolve(runResultsDir, allResultsInDir[0], 'results.json')
    );

    expect(testResults).toMatchSnapshot();

    for (const stepResult of testResults.steps) {
      if (stepResult.screenshot) {
        assert.equal(
          await fs.pathExists(
            path.resolve(runResultsDir, allResultsInDir[0], stepResult.screenshot)
          ),
          true,
          `${stepResult.screenshot} is missing`
        );
      }
    }
  });

  it('Launch api test = failing', async () => {
    const mockedDateConstructor: typeof Date = Object.create(Date);

    let nowCallsCounter = 1;
    mockedDateConstructor.now = function mockedNow() {
      return nowCallsCounter++;
    };

    const testInfo = getCurrentTest();

    const localRunId = guid();

    await assert.rejects(() =>
      launchImpl(
        {
          testName: testInfo.fullName,
          noServer: true,
          automationLibrary: 'puppeteer',
          browserOptions: {
            headless: true,
            browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
          _runId: localRunId,
        },
        async (page) => {
          await page.goto('http://jsbin.testim.io/ner/1');

          await page.click('#test');
          await page.click('#test');
          await page.click('#test');
          await page.click('#test');
          await page.click('#test');
          await page.click('#test');
          await page.click('#reset');
          await page.click('#test');

          const counter = await page.$('#counter');

          if (!counter) {
            throw new Error('counter not found');
          }

          const textProp = await counter.getProperty('innerText');
          const text = await textProp.jsonValue();

          assert.equal(text, '2');
        },
        mockedDateConstructor
      )
    );

    const runResultsDir = path.resolve(__dirname, '..', '.root-cause', 'runs', localRunId);

    const allResultsInDir = await fs.readdir(runResultsDir);

    const testResults: TestResultFile = await readJsonTestSnapshotFile(
      path.resolve(runResultsDir, allResultsInDir[0], 'results.json')
    );

    expect(testResults).toMatchSnapshot();

    for (const stepResult of testResults.steps) {
      if (stepResult.screenshot) {
        assert.equal(
          await fs.pathExists(
            path.resolve(runResultsDir, allResultsInDir[0], stepResult.screenshot)
          ),
          true,
          `${stepResult.screenshot} is missing`
        );
      }
    }
  });
});
