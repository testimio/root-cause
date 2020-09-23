describe.skip('Some test', () => {
    it('First Test pass', async () => {
        await page.goto('http://jsbin.testim.io/tog');
        await page.click('#forwarning');
        await expect(page).toMatchElement('#forlog', { text: 'Make log' });
        await page.click('#forlog');
    }, 10_000);

    it('Test that should fail', async () => {
        await page.goto('http://jsbin.testim.io/tog');
        await expect(page).toMatchElement('#forerror', { text: 'Make Error' });
        await page.click('#not-found-element');
    }, 10_000);
});
