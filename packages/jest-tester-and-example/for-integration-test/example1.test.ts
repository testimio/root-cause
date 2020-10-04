/* eslint-disable no-useless-catch */
describe('Some test suite', () => {
  it('This test should pass', async () => {
    await page.goto('http://jsbin.testim.io/tog');
    await new Promise((res) => {
      setTimeout(res, 1000);
    });
    await page.click('#forwarning');
    // expect-puppeteer
    // await expect(page).toMatchElement('#forlog', { text: 'Make log' });

    // expect-playwright
    // @ts-ignore
    await expect(page).toHaveText('#forlog', 'Make log');

    await page.click('#forlog');
  }, 7_000);

  it('This that should fail', async () => {
    await page.goto('http://jsbin.testim.io/tog');
    // await expect(page).toMatchElement('#forerror', { text: 'Make Error' });

    await page.click('#sometable');

    // @ts-ignore
    await expect(page).toHaveText('#forviolation', 'Make violation... no so much');

    await page.click('#not-found-element');
  }, 10_000);
});
