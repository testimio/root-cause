import puppeteer from 'puppeteer';
import * as rootcause from '@testim/root-cause';
import * as path from 'path';

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

    const startTestParams = {
        runId: 'mock_invocation_id',
        projectRoot: path.resolve(__dirname, 'testsResults'),
        fullName: 'Mock fullName',
        description: 'Nock description',
        fullSuitePath: __filename,
    };

    const { page, endTest } = await rootcause.attach({ page: await browser.newPage(), startTestParams });

    try {
        const navigationPromise = page.waitForNavigation();

        await page.goto('https://edition.cnn.com/');

        await page.setViewport({ width: 1440, height: 789 });

        await navigationPromise;

        await page.waitForSelector('.Flex-sc-1sqrs56-0 > .sc-gzVnrw > .sc-htoDjs > .sc-dnqmqq:nth-child(4) > .sc-bZQynM');
        await page.click('.Flex-sc-1sqrs56-0 > .sc-gzVnrw > .sc-htoDjs > .sc-dnqmqq:nth-child(4) > .sc-bZQynM');

        await navigationPromise;

        await page.waitForSelector('.Box-sc-1fet97o-0:nth-child(1) > .sc-gzVnrw > .sc-htoDjs > .sc-dnqmqq:nth-child(12) > .sc-gZMcBi > .sc-gqjmRU:nth-child(7) > .sc-bZQynM');
        await page.click('.Box-sc-1fet97o-0:nth-child(1) > .sc-gzVnrw > .sc-htoDjs > .sc-dnqmqq:nth-child(12) > .sc-gZMcBi > .sc-gqjmRU:nth-child(7) > .sc-bZQynM');

        await navigationPromise;

        await page.waitForSelector('.search-corp-nav > #advanced-search-form-5e13dc669e #advanced-search-keyword-5e13dc669e');
        await page.click('.search-corp-nav > #advanced-search-form-5e13dc669e #advanced-search-keyword-5e13dc669e');

        await page.waitForSelector('.header-search-container #advanced-search-submit-5e13dc669e');
        await page.click('.header-search-container #advanced-search-submit-5e13dc669e');

        await navigationPromise;

        await page.waitForSelector('#search-results-list > ul > li:nth-child(1) > a > h2');
        await page.click('#search-results-list > ul > li:nth-child(1) > a > h2');

        await navigationPromise;

        await page.waitForSelector('.main-footer-wrapper > #content > #main-content-wrapper > .job-description > .top');
        await page.click('.main-footer-wrapper > #content > #main-content-wrapper > .job-description > .top');

        await navigationPromise;

        await page.waitForSelector('.buttonsFooterAccentWrapper > .buttonsFooterAccent > div > #applyFromDetailBtn > .ladda-label');
        await page.click('.buttonsFooterAccentWrapper > .buttonsFooterAccent > div > #applyFromDetailBtn > .ladda-label');

        await page.waitForSelector('.MainDiv #loginField');
        await page.click('.MainDiv #loginField');

        await page.type('.MainDiv #loginField', 'oh no!');
        endTest({ success: true, data: undefined });
    } catch (error) {
        endTest({ success: false, error });
        process.exit(1);
    } finally {
        rootcause.updateHistoryFromScreenplayResultsOnly();
        await browser.close();
        process.exit(0);
    }
})();
