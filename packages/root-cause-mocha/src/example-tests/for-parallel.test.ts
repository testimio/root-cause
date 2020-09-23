/* eslint-disable prefer-arrow-callback */
// this is here to make TS know this is a module
import {} from '@testim/root-cause';

declare const page: import('puppeteer').Page;

describe('for parallel', function () {
  it('First Test pass', async function () {
    this.timeout(5000);
    await page.goto('http://jsbin.testim.io/tog');
    await page.click('#forerror');
    await page.click('#forwarning');
    await page.click('#forlog');
  });

  it('Test that should fail', async function () {
    this.timeout(5000);
    await page.goto('http://jsbin.testim.io/tog');
    await page.click('#forerror');
    await page.click('#not-found-element');
  });
});
