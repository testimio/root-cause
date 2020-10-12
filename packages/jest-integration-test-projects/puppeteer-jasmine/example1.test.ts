/* eslint-disable no-useless-catch */
describe('Some test suite', () => {
  it('This test should pass', async () => {
    await page.goto('http://jsbin.testim.io/tog');
    await page.click('#forwarning');
    // expect-puppeteer
    // await expect(page).toMatchElement('#forlog', { text: 'Make log' });

    // expect-playwright
    // @ts-ignore
    await expect(page).toMatchElement('#forlog', { text: 'Make log' });

    await page.click('#forlog');
  }, 7_000);

  it('This that should fail', async () => {
    await page.goto('http://jsbin.testim.io/tog');

    await page.click('#sometable');

    await expect(page).toMatchElement('#forviolation', { text: 'Make violation... no so much' });

    await page.click('#not-found-element');
  }, 10_000);
});
