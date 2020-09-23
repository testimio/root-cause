import { launch } from '@testim/root-cause';

launch(
  {
    testName: 'Test launch function 5',
    headless: false,
  },
  async (page) => {
    await page.goto('https://example.com');
    await page.click('body');
    await page.evaluate(() => {
      setTimeout(() => {
        console.table(['a', 'b', 'c']);
      }, 0);
    });
    await page.click('body');
    await page.evaluate(() => {
      console.log({
        a: '6',
        b: '19',
      });
    });
    await page.click('body');
  }
);
