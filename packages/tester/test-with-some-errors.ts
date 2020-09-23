import * as puppeteer from 'puppeteer';
import * as rootCause from '@testim/root-cause';
import * as path from 'path';

(async () => {
  const startTestParams = {
    runId: 'mock_invocation_id',
    projectRoot: path.resolve(__dirname, 'testsResults'),
    fullName: 'Mock fullName',
    description: 'Nock description',
    fullSuitePath: __filename,
  };

  const browser = await puppeteer.launch({ headless: true });
  const { page } = await rootCause.attach({ page: await browser.newPage(), startTestParams });

  try {
    await page.goto('http://demo.testim.io/');
    await page.click(".Hero__form-box___126DY > :nth-child(1) [type='text']");
    await page.click('.theme__days___3kAIy > div:nth-of-type(30) span');
    await page.click("[role='navigation'] > :nth-child(2)");
    await page.click('.Hero__form-box___126DY');
    try {
      await page.waitForSelector('.heyimnotreal', { timeout: 5 });
    } catch (e) {
      // Intentional error
    }
    await page.click(".Hero__form-box___126DY > :nth-child(2) [type='text']");
    await page.click('#right', { clickCount: 2 });
    await page.click('#right', { clickCount: 2 });
    try {
      await page.click('.fakfakfkakfaf');
    } catch (e) {
      // Intentional error
    }
    await page.click('#right', { clickCount: 2 });
    await page.click('#right', { clickCount: 2 });
    await page.click('#right', { clickCount: 2 });
    await page.click('#right', { clickCount: 2 });
    await page.click('#right', { clickCount: 2 });
    await page.click('#right');
    await page.click('.theme__week___17JkF > span:nth-of-type(4)', { clickCount: 2 });
    await page.click('.theme__title___2Ue3-');
    await page.click('.theme__header___1DCA-');
    await page.click('#years');
    await page.click("[role='navigation'] > :nth-child(2)");
    await page.click(".Hero__form-box___126DY > :nth-child(2) [type='text']");

    try {
      await page.click('.lalalalalala');
    } catch (e) {
      // Intentional error
    }

    await page.click('#years');
    await page.click("[role='navigation'] > :nth-child(2)");
    await page.setViewport({ width: 1568, height: 569 });
    await page.click('.Hero__cta-button___9VskW');
    await scrollToElement(page, '.Gallery__items-box___2hOZl > :nth-child(1) .theme__button___1iKuo');
    await page.click('.Gallery__items-box___2hOZl > :nth-child(1) .theme__button___1iKuo');
    await page.click("[type='email']");
    await page.click("[name='promo']");
    await scrollToElement(page, "[data-react-toolbox='check']");
    await page.click("[data-react-toolbox='check']");
    await browser.close();
  } finally {
    await browser.close();
  }
})();

async function scrollToElement(page: puppeteer.Page, selector: string) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  }, selector);
}
