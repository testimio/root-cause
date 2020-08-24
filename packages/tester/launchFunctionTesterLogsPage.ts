import { launch } from '@testim/root-cause';

launch(
    {
        testName: __filename,
        noServer: false,
        automationLibrary: 'playwright',
        browserOptions: { browser: 'chromium', headless: false },
    },
    async (page) => {
        await page.goto('http://jsbin.testim.io/tog');
        // await page.setViewport({
        //     width: 1280,
        //     height: 800,
        // });
        await page.click('#forerror');
        await page.click('#forwarning');
        await page.click('#forlog');
        await page.click('#forerror');
        await page.click('#forviolation');
        await page.click('#assertbad');
        await page.click('#sometable');

        await page.evaluate(() => {
            for (const el of document.querySelectorAll('button[id]' as 'button')) {
                el.click();
            }

            return new Promise((res) => {
                setTimeout(res, 1000);
            });
        });

        await page.click('#forlogwithobject');
    }
);
