import { openServer, closeServer } from './server';
import puppeteer from 'puppeteer';
import assert from 'assert';
import path from 'path';

declare const document: any;

describe('Sanity UI test', () => {
  let browser: puppeteer.Browser;
  let browserContext: puppeteer.BrowserContext;
  let page: puppeteer.Page;

  jest.setTimeout(30_000);

  beforeAll(async () => {
    await openServer(9876, path.resolve(__dirname, 'fixtures', 'runsResults', 'server-basic'));
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  });

  afterAll(async () => {
    await browser.close();
    closeServer();
  });

  beforeEach(async () => {
    browserContext = await browser.createIncognitoBrowserContext();
    page = await browserContext.newPage();
  });

  afterEach(async () => {
    await page.close();
    await browserContext.close();
  });

  it('UI test 1', async () => {
    await page.goto('http://localhost:9876');
    await page.waitForSelector('#sidebar > div', { timeout: 10000 });
    // await new Promise(res => {});
    const numberOfSteps = await page.evaluate(() => document.querySelectorAll('#sidebar > div').length);

    assert.equal(numberOfSteps, 7);

    await page.click('#sidebar > div:nth-child(2)');
    const selectedStepTitle = await page.evaluate(
      () => document.querySelector('[class^=styles_stepName]')?.textContent
    );

    assert.equal(selectedStepTitle, '2.page-click');
  });
});
