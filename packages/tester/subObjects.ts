import puppeteer from 'puppeteer';
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

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const { page: thePage, endTest } = await rootCause.attach({
    page: await browser.newPage(),
    startTestParams,
  });

  try {
    await thePage.goto('http://jsbin.testim.io/zegacafuwa/edit?output');

    await thePage.waitFor(6000);

    const myFrame = thePage.frames()[2];

    const canvasDiv = await myFrame.$('#canvasDiv');
    const bounds = await canvasDiv?.boundingBox();
    if (!bounds) {
      throw new Error('could not get bounding box');
    }
    await myFrame.focus('#theInput');

    await myFrame.type('#theInput', 'heya!');

    await thePage.keyboard.press('h');
    await thePage.keyboard.press('e');
    await thePage.keyboard.press('l');
    await thePage.keyboard.press('l');
    await thePage.keyboard.press('o');

    await thePage.mouse.move(bounds.x + 10, bounds.y + 10);
    await thePage.mouse.move(bounds.x + 20, bounds.y + 10);
    await thePage.mouse.move(bounds.x + 30, bounds.y + 10);
    await thePage.mouse.move(bounds.x + 40, bounds.y + 10);
    endTest({ success: true, data: undefined });
  } catch (error) {
    endTest({ success: false, error });
    process.exit(1);
  } finally {
    rootCause.updateHistoryFromRootCauseResultsOnly();
    await browser.close();
    process.exit(0);
  }
})();
