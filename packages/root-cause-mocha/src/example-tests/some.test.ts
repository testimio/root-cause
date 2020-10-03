/* eslint-disable prefer-arrow-callback */
// this is here to make TS know this is a module
import {} from '@testim/root-cause';

declare const page: import('puppeteer').Page;

describe('Some mocha test', function () {
  it('First Test pass', async function () {
    this.timeout(5000);
    await page.goto('http://jsbin.testim.io/tog');

    // test one level selector
    const errorButton = await page.waitForSelector('#forerror');
    await errorButton.click();

    // test two level selector
    const bodyHandle = await page.$('body');
    const warningButton = (await bodyHandle?.$$('#forwarning'))?.[0];
    if (!warningButton) {
      throw new Error("#forwarning wasn't found in the page");
    }
    // output step name is: click "body > #forwarning[0]"
    // do we want it or not?
    await warningButton.click();

    await page.click('#forlog');
    await page.click('#forerror');
    await page.click('#forviolation');
    await page.click('#assertbad');
    await page.click('#sometable');
  });

  it('Test that should fail', async function () {
    this.timeout(5000);
    await page.goto('http://jsbin.testim.io/tog');
    await page.click('#not-found-element');
  });
});
