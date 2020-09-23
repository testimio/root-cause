import { launch } from '@testim/root-cause';

launch(
  {
    testName: __filename,
    noServer: false,
    automationLibrary: 'puppeteer',
    browserOptions: { headless: false },
  },
  async (page) => {
    await page.goto('http://jsbin.testim.io/ces');
    await page.click('[data-job=GET_OK]', { delay: 800 });
    await page.click('[data-job=GET_404]', { delay: 800 });
    await page.click('[data-job=POST_OK]', { delay: 800 });
    await page.click('[data-job=POST_404]', { delay: 800 });

    await page.evaluate(async () => {
      await new Promise((res) => {
        setTimeout(res, 300);
      });

      for (const el of document.querySelectorAll('[data-job]' as 'button')) {
        const mousedown = new MouseEvent('mousedown');
        el.dispatchEvent(mousedown);

        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => {
          setTimeout(res, 100);
        });
      }

      await new Promise((res) => {
        setTimeout(res, 5000);
      });
    });
  }
);
